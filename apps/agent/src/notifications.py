"""
Foresynth Agent - Telegram Notification Helpers

Sends agent decisions and chat responses to users via Telegram Bot API.
"""
import httpx
import logging
from src.core.config import get_settings
from src.core.database import get_supabase

logger = logging.getLogger(__name__)


def _format_signal_emoji(signal: str) -> str:
    """Map signal to visual emoji."""
    return {
        "BUY_YES": "🟢 BUY YES",
        "BUY_NO": "🔴 BUY NO",
        "HOLD": "🟡 HOLD",
        "SKIP": "⏭ SKIP",
    }.get(signal, "❓ UNKNOWN")


def _format_confidence_bar(confidence: float) -> str:
    """Visual confidence indicator."""
    filled = int(confidence * 10)
    return "█" * filled + "░" * (10 - filled) + f" {confidence:.0%}"


async def send_decision_to_telegram(user_id: str, decision: dict) -> bool:
    """
    Format and send a single agent decision to the user's Telegram.
    
    Message format:
    🧠 FORESYNTH ADVISOR
    ─────────────────
    📊 Market: <question>
    🎯 Signal: 🟢 BUY YES
    📈 Confidence: ████████░░ 80%
    ⚖️ Risk: medium
    
    💡 Reasoning:
    <reasoning text>
    
    🔑 Key Factors:
    • Factor 1
    • Factor 2
    """
    try:
        db = get_supabase()
        settings = get_settings()

        # Get user's telegram chat ID
        user_resp = (
            db.table("users")
            .select("telegram_chat_id")
            .eq("id", user_id)
            .execute()
        )

        if not user_resp.data or not user_resp.data[0].get("telegram_chat_id"):
            logger.info(f"No Telegram chat ID for user {user_id[:8]}, skipping push.")
            return False

        chat_id = user_resp.data[0]["telegram_chat_id"]

        # Format the message
        signal_display = _format_signal_emoji(decision.get("signal", "HOLD"))
        confidence_bar = _format_confidence_bar(decision.get("confidence", 0))
        risk = decision.get("risk_level", "medium").upper()
        market_slug = decision.get("market_slug", "")
        market_url = f"https://polymarket.com/event/{market_slug}" if market_slug else ""

        key_factors = decision.get("key_factors", [])
        factors_text = "\n".join(f"  • {f}" for f in key_factors) if key_factors else "  • N/A"

        question = decision.get("market_question", "Unknown Market")
        if market_url:
            question_display = f'<a href="{market_url}">{question}</a>'
        else:
            question_display = question

        message = (
            f"🧠 <b>FORESYNTH ADVISOR</b>\n"
            f"{'─' * 22}\n"
            f"📊 <b>Market</b>: {question_display}\n"
            f"🎯 <b>Signal</b>: {signal_display}\n"
            f"📈 <b>Confidence</b>: <code>{confidence_bar}</code>\n"
            f"⚖️ <b>Risk</b>: {risk}\n\n"
            f"💡 <b>Reasoning</b>:\n"
            f"  {decision.get('reasoning', 'No reasoning provided.')}\n\n"
            f"🔑 <b>Key Factors</b>:\n"
            f"{factors_text}"
        )

        # Send via Bot API
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            if resp.status_code == 200:
                logger.info(f"📨 Decision sent to Telegram for user {user_id[:8]}")
                return True
            else:
                logger.error(f"Telegram send failed: {resp.text}")
                return False

    except Exception as e:
        logger.error(f"send_decision_to_telegram error: {e}")
        return False


async def send_chat_response(chat_id: str, text: str) -> bool:
    """Send a plain text response to a Telegram chat."""
    try:
        settings = get_settings()
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"send_chat_response error: {e}")
        return False
