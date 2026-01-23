from typing import Literal
from pydantic import BaseModel
import httpx
import logging

from src.core import get_supabase
from src.services.telegram import get_telegram_service

logger = logging.getLogger(__name__)

class NotificationPayload(BaseModel):
    """Notification payload for all channels."""
    user_id: str
    title: str
    message: str
    type: Literal["price_alert", "wallet_alert", "system"]
    metadata: dict = {}
    channels: list[Literal["in-app", "telegram", "discord"]] = ["in-app"]


class NotificationService:
    """
    Unified notification service.
    
    Handles delivery to:
    - In-App: Stored in database
    - Telegram: Via Bot API
    - Discord: Via Webhook
    """
    
    def __init__(self):
        self.db = get_supabase()
        self.telegram = get_telegram_service()
    
    async def send(self, payload: NotificationPayload) -> dict:
        """Send notification to all specified channels."""
        results = {}
        
        for channel in payload.channels:
            if channel == "in-app":
                results["in-app"] = await self._send_in_app(payload)
            elif channel == "telegram":
                results["telegram"] = await self._send_telegram(payload)
            elif channel == "discord":
                results["discord"] = await self._send_discord(payload)
        
        return results
    
    async def _send_in_app(self, payload: NotificationPayload) -> bool:
        """Store notification in database."""
        try:
            data = {
                "user_id": payload.user_id,
                "title": payload.title,
                "message": payload.message,
                "type": payload.type,
                "metadata": payload.metadata,
                "is_read": False
            }
            response = self.db.table("notifications").insert(data).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"In-app notification failed: {e}")
            return False
    
    async def _send_telegram(self, payload: NotificationPayload) -> bool:
        """Send notification via Telegram Bot API."""
        try:
            # Get user's telegram chat ID
            user_response = self.db.table("users").select("telegram_chat_id").eq("id", payload.user_id).execute()
            
            if not user_response.data or not user_response.data[0].get("telegram_chat_id"):
                return False
            
            chat_id = user_response.data[0]["telegram_chat_id"]
            
            # Format message
            type_icon = "🔔"
            if payload.type == "price_alert":
                type_icon = "📈"
            elif payload.type == "wallet_alert":
                type_icon = "🐋"
            
            text = f"{type_icon} <b>{payload.title}</b>\n\n{payload.message}"
            
            return await self.telegram.send_message(chat_id, text)
        except Exception as e:
            logger.error(f"Telegram notification dispatch failed: {e}")
            return False
    
    async def _send_discord(self, payload: NotificationPayload) -> bool:
        """Send notification via Discord Webhook."""
        try:
            # Get user's discord webhook
            user_response = self.db.table("users").select("discord_webhook_url").eq("id", payload.user_id).execute()
            
            if not user_response.data or not user_response.data[0].get("discord_webhook_url"):
                return False
            
            webhook_url = user_response.data[0]["discord_webhook_url"]
            
            # Discord embed format
            embed = {
                "title": f"🔔 {payload.title}",
                "description": payload.message,
                "color": 0x00D1FF,  # Primary cyan color
                "footer": {"text": f"Foresynth | {payload.type}"}
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json={"embeds": [embed]},
                    timeout=10.0
                )
                return response.status_code in [200, 204]
        except Exception as e:
            logger.error(f"Discord notification failed: {e}")
            return False


# Singleton instance
_notification_service: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """Get notification service singleton."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
