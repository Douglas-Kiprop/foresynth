import asyncio
import secrets
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from src.core import get_db, get_cache
from src.core.security import get_current_user
from src.services.telegram import get_telegram_service
from src.core.config import get_settings

router = APIRouter()
telegram_service = get_telegram_service()

@router.post("/connect")
async def generate_connect_token(
    user_id: str = Depends(get_current_user),
    cache = Depends(get_cache)
):
    """
    Generates a one-time token to link a Telegram account.
    Stores the token in Redis for 10 minutes.
    """
    token = secrets.token_urlsafe(32)
    # Store token -> user_id mapping in Redis for 600 seconds
    await asyncio.to_thread(cache.setex, f"tg_connect:{token}", 600, user_id)
    
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
    cache = Depends(get_cache)
):
    """
    Endpoint for Telegram Bot webhooks.
    Handles the /start <token> handshake.
    """
    if not telegram_service.verify_secret(x_telegram_bot_api_secret_token):
        raise HTTPException(status_code=401, detail="Invalid secret token")
    
    data = await request.json()
    
    # Check if this is a message
    if "message" not in data:
        return {"status": "ok"}
        
    message = data["message"]
    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    
    if text.startswith("/start "):
        token = text.split(" ")[1]
        user_id = await asyncio.to_thread(cache.get, f"tg_connect:{token}")
        
        if user_id:
            # Token found! Link the account.
            # user_id is coming from Redis as bytes/string depending on client config
            if isinstance(user_id, bytes):
                user_id = user_id.decode('utf-8')
                
            # Update user profile in Supabase
            try:
                db.table("users").update({"telegram_chat_id": str(chat_id)}).eq("id", user_id).execute()
                
                # Send confirmation message
                await telegram_service.send_message(
                    chat_id, 
                    "✅ <b>Foresynth Account Linked!</b>\n\nYou will now receive alerts for your tracked squads directly in this chat."
                )
                
                # Clean up token
                await asyncio.to_thread(cache.delete, f"tg_connect:{token}")
                
            except Exception as e:
                await telegram_service.send_message(chat_id, "❌ Error linking account. Please try again later.")
                return {"status": "error", "message": str(e)}
        else:
            await telegram_service.send_message(chat_id, "❌ Invalid or expired connection token. Please request a new one from the Foresynth dashboard.")
            
    return {"status": "ok"}

@router.post("/set-webhook")
async def set_webhook(
    url: str,
    user_id: str = Depends(get_current_user) # Secure this to admin or just manual check
):
    """Utility endpoint to manually set the Telegram webhook."""
    # TODO: Add admin check
    success = await telegram_service.set_webhook(url)
    return {"success": success}
