"""
Foresynth Agent - Market Analyst Node

Fetches live market data for the user's watchlist markets
and recent smart-money trades from tracked wallets.

This node turns raw Supabase IDs into actionable market snapshots.
"""
import logging
from src.state import AgentState, MarketSnapshot, WalletActivity
from src.tools.polymarket import (
    get_market_by_id,
    get_market_prices,
    get_wallet_trades,
)

logger = logging.getLogger(__name__)


async def market_analyst_node(state: AgentState) -> dict:
    """
    Fetch live data for watchlist markets and tracked wallets.

    Reads: watchlist_markets, tracked_wallets
    Writes: market_snapshots, smart_money_trades, messages
    """
    watchlist_markets = state.get("watchlist_markets", [])
    tracked_wallets = state.get("tracked_wallets", [])

    logger.info(
        f"📊 Market Analyst: Analyzing {len(watchlist_markets)} markets, "
        f"{len(tracked_wallets)} wallets..."
    )

    # ── 1. Enrich watchlist markets with live prices ────────────
    snapshots: list[MarketSnapshot] = []

    # Collect token IDs for batch price fetch
    token_ids = [m.get("clob_token_id") for m in watchlist_markets if m.get("clob_token_id")]
    prices = await get_market_prices(token_ids) if token_ids else {}

    for market in watchlist_markets:
        token_id = market.get("clob_token_id", "")
        yes_price = prices.get(token_id, 0.0)

        snapshot: MarketSnapshot = {
            "token_id": token_id,
            "question": market.get("question", "Unknown"),
            "slug": market.get("slug", ""),
            "outcome_yes_price": round(yes_price, 4),
            "outcome_no_price": round(1.0 - yes_price, 4) if yes_price else 0.0,
            "volume_24h": 0.0,  # Could be enriched from Gamma if needed
            "liquidity": 0.0,
        }
        snapshots.append(snapshot)

    # ── 2. Fetch recent smart-money trades ─────────────────────
    trades: list[WalletActivity] = []

    for wallet in tracked_wallets[:10]:  # Cap to avoid rate limits
        raw_trades = await get_wallet_trades(wallet, limit=5)
        for t in raw_trades:
            shares = float(t.get("size", 0))
            price = float(t.get("price", 0))
            activity: WalletActivity = {
                "wallet": wallet,
                "side": t.get("side", "UNKNOWN").upper(),
                "shares": shares,
                "price": price,
                "usd_size": round(shares * price, 2),
                "market_slug": t.get("marketSlug", ""),
            }
            trades.append(activity)

    msg = (
        f"📊 Market Analyst complete: {len(snapshots)} snapshots, "
        f"{len(trades)} smart-money trades"
    )
    logger.info(msg)

    return {
        "market_snapshots": snapshots,
        "smart_money_trades": trades,
        "messages": [msg],
    }
