
import httpx
import logging
from functools import lru_cache
from typing import Optional

from src.core.config import get_settings

logger = logging.getLogger(__name__)

class TelegramService:
    """
    Service for interacting with the Telegram Bot API.
    Handles message sending and webhook management.
    """
    def __init__(self):
        settings = get_settings()
        self.token = settings.telegram_bot_token
        self.webhook_secret = settings.telegram_webhook_secret
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.client = httpx.AsyncClient(timeout=10.0)

    async def send_message(self, chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
        """Send a message to a specific chat ID."""
        if not self.token:
            logger.warning("Telegram token not configured, skipping message send.")
            return False
            
        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        
        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {chat_id}: {e}")
            return False

    async def set_webhook(self, webhook_url: str) -> bool:
        """Set the webhook URL for the bot."""
        if not self.token:
            return False
            
        url = f"{self.base_url}/setWebhook"
        payload = {
            "url": webhook_url,
            "secret_token": self.webhook_secret
        }
        
        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            logger.info(f"Telegram webhook set to {webhook_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to set Telegram webhook: {e}")
            return False

    async def delete_webhook(self) -> bool:
        """Remove the webhook integration."""
        if not self.token:
            return False
            
        url = f"{self.base_url}/deleteWebhook"
        try:
            response = await self.client.post(url)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Failed to delete Telegram webhook: {e}")
            return False

    async def get_bot_info(self) -> Optional[dict]:
        """Fetch bot info (username, id) from Telegram."""
        if not self.token:
            return None
            
        url = f"{self.base_url}/getMe"
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            return data["result"]
        except Exception as e:
            logger.error(f"Failed to fetch Telegram bot info: {e}")
            return None

    def verify_secret(self, secret_token: str) -> bool:
        """Verify that the webhook request came from Telegram."""
        return secret_token == self.webhook_secret

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


@lru_cache()
def get_telegram_service() -> TelegramService:
    return TelegramService()
