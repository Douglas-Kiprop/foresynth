"""
Foresynth Agent - Supabase Tools

Functions to retrieve user-specific context from the shared Supabase database.
These are the agent's link to the user's watchlists, squads, and configurations.
"""
import logging
from src.core.database import get_supabase

logger = logging.getLogger(__name__)


async def get_user_watchlist_ids(user_id: str) -> list[str]:
    """
    Fetch all market IDs from the user's watchlists.
    Returns a list of unique market ID strings.
    """
    try:
        db = get_supabase()

        # Get user's watchlists with market_ids array
        wl_resp = (
            db.table("watchlists")
            .select("market_ids")
            .eq("user_id", user_id)
            .execute()
        )
        if not wl_resp.data:
            return []

        # Flatten the arrays
        all_ids = set()
        for row in wl_resp.data:
            ids = row.get("market_ids", [])
            if ids:
                all_ids.update(ids)

        return list(all_ids)
    except Exception as e:
        logger.error(f"get_user_watchlist_ids error: {e}")
        return []


async def get_user_tracked_wallets(user_id: str) -> list[str]:
    """
    Fetch all wallet addresses the user is tracking through their squads.
    Returns a de-duplicated list of wallet addresses.
    """
    try:
        db = get_supabase()

        # Get user's active squads
        squads_resp = (
            db.table("squads")
            .select("id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .execute()
        )
        if not squads_resp.data:
            return []

        squad_ids = [s["id"] for s in squads_resp.data]

        # Get tracked targets from those squads
        targets_resp = (
            db.table("tracked_targets")
            .select("wallet_address")
            .in_("squad_id", squad_ids)
            .execute()
        )

        wallets = list({t["wallet_address"] for t in (targets_resp.data or [])})
        return wallets
    except Exception as e:
        logger.error(f"get_user_tracked_wallets error: {e}")
        return []


async def get_agent_config(user_id: str) -> dict:
    """
    Fetch the user's agent configuration from the agent_configs table.
    Returns defaults if no config exists.
    """
    defaults = {
        "risk_profile": "moderate",
        "focus_sectors": [],
        "sources": ["watchlists", "news"],
        "alert_frequency": "medium",
    }
    try:
        db = get_supabase()
        resp = (
            db.table("agent_configs")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if resp.data:
            return {**defaults, **resp.data[0]}
        return defaults
    except Exception as e:
        logger.error(f"get_agent_config error: {e}")
        return defaults


async def save_agent_decision(user_id: str, decision: dict) -> bool:
    """Persist an agent decision to the agent_decisions table for the feed."""
    try:
        db = get_supabase()
        data = {
            "user_id": user_id,
            "market_question": decision.get("market_question", ""),
            "market_slug": decision.get("market_slug", ""),
            "signal": decision.get("signal", "HOLD"),
            "confidence": decision.get("confidence", 0.0),
            "reasoning": decision.get("reasoning", ""),
            "key_factors": decision.get("key_factors", []),
            "risk_level": decision.get("risk_level", "medium"),
        }
        resp = db.table("agent_decisions").insert(data).execute()
        return bool(resp.data)
    except Exception as e:
        logger.error(f"save_agent_decision error: {e}")
        return False
