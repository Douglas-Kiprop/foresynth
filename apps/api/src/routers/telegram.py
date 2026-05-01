import asyncio
import secrets
import httpx
import traceback
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from src.core import get_db, get_async_cache
from src.core.security import get_current_user
from src.services.telegram import get_telegram_service
from src.core.config import get_settings

import logging

logger = logging.getLogger(__name__)

router = APIRouter()
telegram_service = get_telegram_service()

import os

AGENT_BASE_URL = os.environ.get("AGENT_BASE_URL", "http://127.0.0.1:8001")

@router.post("/connect")
async def generate_connect_token(
    request: Request,
    user_id: str = Depends(get_current_user),
    cache = Depends(get_async_cache)
):
    """
    Generates a one-time token to link a Telegram account.
    Stores the token in Redis for 10 minutes.
    """
    # Debug: Print JWT for manual curl command
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        print(f"\n--- [DEBUG: SUPABASE JWT TOKEN] ---")
        print(auth_header.split(" ")[1])
        print("----------------------------------\n")
    
    token = secrets.token_urlsafe(32)
    # Store token -> user_id mapping in Redis for 600 seconds
    await cache.setex(f"tg_connect:{token}", 600, user_id)
    
    bot_info = await telegram_service.get_bot_info()
    bot_username = bot_info.get("username", "ForesynthBot") if bot_info else "ForesynthBot"
    
    return {
        "token": token,
        "bot_username": bot_username
    }

@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str = Header(None),
    db = Depends(get_db),
    cache = Depends(get_async_cache)
):
    """
    Endpoint for Telegram Bot webhooks.
    Handles:
      1. /start <token> — account linking handshake
      2. All other text messages — forwarded to the Agent for AI chat
    """
    if not telegram_service.verify_secret(x_telegram_bot_api_secret_token):
        raise HTTPException(status_code=401, detail="Invalid secret token")
    
    data = await request.json()
    print(f"\n[DEBUG] Webhook received: {data}")
    
    # Check if this is a message
    if "message" not in data:
        return {"status": "ok"}
        
    message = data["message"]
    chat_id = str(message["chat"]["id"])
    text = message.get("text", "")
    
    # ── 1. Handle /start command (account linking) ─────────────
    if text.startswith("/start "):
        token = text.split(" ")[1]
        user_id = await cache.get(f"tg_connect:{token}")
        
        if user_id:
            if isinstance(user_id, bytes):
                user_id = user_id.decode('utf-8')
                
            try:
                db.table("users").update({"telegram_chat_id": chat_id}).eq("id", user_id).execute()
                
                await telegram_service.send_message(
                    chat_id, 
                    "✅ <b>Foresynth Account Linked!</b>\n\nYou will now receive alerts for your tracked squads directly in this chat.\n\n💬 You can also <b>chat with your AI advisor</b> — just type any question!"
                )
                
                await cache.delete(f"tg_connect:{token}")
                
            except Exception as e:
                await telegram_service.send_message(chat_id, "❌ Error linking account. Please try again later.")
                return {"status": "error", "message": str(e)}
        else:
            await telegram_service.send_message(chat_id, "❌ Invalid or expired connection token. Please request a new one from the Foresynth dashboard.")
        
        return {"status": "ok"}
    
    # ── 2. Forward all other messages to the Agent ─────────────
    if text and not text.startswith("/"):
        # Look up the user by their telegram_chat_id
        try:
            user_resp = db.table("users").select("id").eq("telegram_chat_id", chat_id).execute()
            
            if not user_resp.data:
                await telegram_service.send_message(
                    chat_id,
                    "⚠️ Your Telegram is not linked to a Foresynth account.\n\nPlease link it from the Foresynth dashboard first."
                )
                return {"status": "ok"}
            
            user_id = user_resp.data[0]["id"]
            print(f"[DEBUG] Forwarding message to agent: user_id={user_id}, chat_id={chat_id}")
            
            # Fire-and-forget to the Agent service
            asyncio.create_task(_forward_to_agent(user_id, chat_id, text))
            
        except Exception as e:
            logger.error(f"Error forwarding chat to agent: {e}")
            await telegram_service.send_message(chat_id, "⚠️ Something went wrong. Please try again.")
        
    return {"status": "ok"}


async def _forward_to_agent(user_id: str, chat_id: str, message: str):
    """Forward a chat message to the Agent service asynchronously."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{AGENT_BASE_URL}/chat",
                json={
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "message": message,
                },
            )
            if resp.status_code != 200:
                logger.error(f"Agent /chat returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to forward message to agent: {e}")
        logger.error(traceback.format_exc())
        # Notify the user that something went wrong
        try:
            await telegram_service.send_message(
                chat_id,
                "⚠️ The AI advisor is currently unavailable. Please try again in a moment."
            )
        except Exception:
            pass


@router.post("/set-webhook")
async def set_webhook(
    url: str,
    user_id: str = Depends(get_current_user) # Secure this to admin or just manual check
):
    """Utility endpoint to manually set the Telegram webhook."""
    # TODO: Add admin check
    success = await telegram_service.set_webhook(url)
    return {"success": success}
