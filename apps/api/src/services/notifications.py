"""
Foresynth API - Notification Service

Unified notification delivery across channels: In-App, Telegram, Discord.
"""
from typing import Literal
from pydantic import BaseModel
import httpx

from src.core import get_supabase


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
            print(f"In-app notification failed: {e}")
            return False
    
    async def _send_telegram(self, payload: NotificationPayload) -> bool:
        """Send notification via Telegram Bot API."""
        # Get user's telegram chat ID
        user_response = self.db.table("users").select("telegram_chat_id").eq("id", payload.user_id).execute()
        
        if not user_response.data or not user_response.data[0].get("telegram_chat_id"):
            return False
        
        chat_id = user_response.data[0]["telegram_chat_id"]
        
        # TODO: Add actual Telegram bot token
        bot_token = ""  # Get from settings
        
        if not bot_token:
            print("Telegram bot token not configured")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": f"🔔 *{payload.title}*\n\n{payload.message}",
                        "parse_mode": "Markdown"
                    },
                    timeout=10.0
                )
                return response.status_code == 200
        except Exception as e:
            print(f"Telegram notification failed: {e}")
            return False
    
    async def _send_discord(self, payload: NotificationPayload) -> bool:
        """Send notification via Discord Webhook."""
        # Get user's discord webhook
        user_response = self.db.table("users").select("discord_webhook_url").eq("id", payload.user_id).execute()
        
        if not user_response.data or not user_response.data[0].get("discord_webhook_url"):
            return False
        
        webhook_url = user_response.data[0]["discord_webhook_url"]
        
        try:
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
            print(f"Discord notification failed: {e}")
            return False


# Singleton instance
_notification_service: NotificationService | None = None


def get_notification_service() -> NotificationService:
    """Get notification service singleton."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
