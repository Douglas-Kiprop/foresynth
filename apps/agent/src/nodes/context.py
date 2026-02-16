"""
Foresynth Agent - Context Node

Fetches the user's personal context from Supabase:
  - Watchlist markets
  - Tracked wallets (squads)
  - Agent configuration (risk profile, focus sectors, sources)

This node runs first after the Supervisor seeds the state.
"""
import logging
from src.state import AgentState
from src.tools.supabase_tools import (
    get_user_watchlist_ids,
    get_user_tracked_wallets,
    get_agent_config,
)

logger = logging.getLogger(__name__)


async def context_node(state: AgentState) -> dict:
    """
    Populate the state with user-specific context.
    
    Reads: user_id
    Writes: watchlist_markets, tracked_wallets, user_config, messages
    """
    user_id = state.get("user_id", "")
    if not user_id:
        return {
            "messages": ["⚠️ Context Node: No user_id provided, skipping."],
            "watchlist_markets": [],
            "tracked_wallets": [],
            "user_config": {},
        }

    logger.info(f"📋 Context Node: Loading context for user {user_id[:8]}...")

    # Parallel-ish fetch
    watchlist_ids = await get_user_watchlist_ids(user_id)
    tracked_wallets = await get_user_tracked_wallets(user_id)
    user_config = await get_agent_config(user_id)

    # Resolve watchlist IDs to market details
    watchlist_markets = []
    if watchlist_ids:
        logger.info(f"📋 Context: Resolving {len(watchlist_ids)} watchlist items via Polymarket API...")
        from src.tools.polymarket import get_market_by_id, get_market_by_slug

        for market_input in watchlist_ids:
            # Handle both condition IDs (0x...) and slugs (string)
            if market_input.startswith("0x"):
                data = await get_market_by_id(market_input)
            else:
                data = await get_market_by_slug(market_input)
            
            if not data:
                continue

            # Extract 'Yes' token ID
            # Gamma API structure: tokens=[{'outcome': 'Yes', 'token_id': '...'}, ...]
            yes_token_id = ""
            for t in data.get("tokens", []):
                if t.get("outcome") == "Yes":
                    yes_token_id = t.get("token_id")
                    break
            
            # Fallback for questions that might not be Yes/No (though agent is likely Yes/No focused)
            if not yes_token_id and data.get("tokens"):
                yes_token_id = data["tokens"][0].get("token_id")

            watchlist_markets.append({
                "market_id": data.get("condition_id"),
                "question": data.get("question"),
                "slug": data.get("slug"),
                "clob_token_id": yes_token_id
            })

    sources = user_config.get("sources", ["watchlists", "news"])

    # Filter out sources the user hasn't enabled
    if "watchlists" not in sources:
        watchlist_markets = []
    if "squads" not in sources:
        tracked_wallets = []

    msg = (
        f"📋 Context loaded: {len(watchlist_markets)} watchlist markets, "
        f"{len(tracked_wallets)} tracked wallets, "
        f"risk={user_config.get('risk_profile', 'moderate')}"
    )
    logger.info(msg)

    return {
        "watchlist_markets": watchlist_markets,
        "tracked_wallets": tracked_wallets,
        "user_config": user_config,
        "messages": [msg],
    }
