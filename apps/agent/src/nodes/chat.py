"""
Foresynth Agent - Chat Node

Handles conversational queries from users via Telegram.
Uses the LLM with user context (risk profile, watchlist) to
produce a friendly, informative response.
"""
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.state import AgentState
from src.core.config import get_settings
from src.notifications import send_chat_response

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are FORESYNTH ADVISOR — an elite AI trading assistant for Polymarket prediction markets, chatting with a user via Telegram.

You have access to the user's context below. Use it to give personalised, actionable advice.

## User Profile
- Risk profile: {risk_profile}
- Focus sectors: {focus_sectors}

## User Watchlist
{watchlist_summary}

## Guidelines
1. Be conversational, concise, and to the point — this is a Telegram chat.
2. Use emojis sparingly to keep the tone friendly.
3. If the user asks about specific markets, reference their watchlist when relevant.
4. If you don't have enough data to answer, say so honestly.
5. Keep responses under 300 words — Telegram messages should be digestible.
6. Format responses with simple HTML tags (<b>, <i>, <code>) since Telegram parse_mode is HTML.
"""


async def chat_node(state: AgentState) -> dict:
    """
    Process a conversational chat message and send the reply to Telegram.

    Reads: current_message, telegram_chat_id, user_config, watchlist_markets
    Writes: messages
    """
    message = state.get("current_message", "")
    chat_id = state.get("telegram_chat_id", "")
    config = state.get("user_config", {})
    watchlist = state.get("watchlist_markets", [])

    risk_profile = config.get("risk_profile", "moderate")
    focus_sectors = ", ".join(config.get("focus_sectors", [])) or "all sectors"

    # Build watchlist summary
    if watchlist:
        watchlist_lines = []
        for m in watchlist[:10]:  # Limit to avoid token overflow
            question = m.get("question", m.get("title", "Unknown"))
            watchlist_lines.append(f"- {question}")
        watchlist_summary = "\n".join(watchlist_lines)
    else:
        watchlist_summary = "No markets on watchlist."

    # ── Call the LLM ───────────────────────────────────────────
    settings = get_settings()
    llm = ChatOpenAI(
        model="openai/gpt-4o-mini",
        temperature=0.3,
        api_key=settings.openai_api_key,
        base_url=settings.openai_api_base,
        default_headers={
            "HTTP-Referer": "https://foresynth.com",
            "X-Title": "Foresynth Agent",
        }
    )

    system_msg = SystemMessage(
        content=CHAT_SYSTEM_PROMPT.format(
            risk_profile=risk_profile,
            focus_sectors=focus_sectors,
            watchlist_summary=watchlist_summary,
        )
    )
    human_msg = HumanMessage(content=message)

    try:
        response = await llm.ainvoke([system_msg, human_msg])
        reply_text = response.content.strip()

        # Send the reply back to Telegram
        if chat_id:
            sent = await send_chat_response(chat_id, reply_text)
            if sent:
                logger.info(f"💬 Chat reply sent to Telegram chat {chat_id}")
            else:
                logger.error(f"💬 Failed to send reply to Telegram chat {chat_id}")

        return {
            "chat_replied": True,
            "messages": [f"💬 Chat reply sent ({len(reply_text)} chars)"],
        }

    except Exception as e:
        logger.error(f"Chat node error: {e}")
        # Try to send an error message to the user
        if chat_id:
            await send_chat_response(
                chat_id,
                "⚠️ Sorry, I ran into an issue processing your message. Please try again in a moment."
            )
        return {
            "chat_replied": True,
            "messages": [f"❌ Chat error: {e}"],
        }
