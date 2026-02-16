"""
Foresynth Agent - Polymarket Tools

Lightweight wrappers around the Polymarket Gamma and CLOB APIs.
Adapted from the official Polymarket/agents SDK utilities.
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

GAMMA_API_BASE = "https://gamma-api.polymarket.com"
CLOB_API_BASE = "https://clob.polymarket.com"
DATA_API_BASE = "https://data-api.polymarket.com"


async def get_markets(
    limit: int = 20,
    active: bool = True,
    sort_by: str = "volume",
    ascending: bool = False,
) -> list[dict]:
    """Fetch active markets from Gamma API, sorted by volume."""
    params = {
        "limit": limit,
        "active": active,
        "order": sort_by,
        "ascending": ascending,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{GAMMA_API_BASE}/markets", params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Polymarket get_markets error: {e}")
        return []


async def get_market_by_slug(slug: str) -> Optional[dict]:
    """Fetch a single market by its slug."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{GAMMA_API_BASE}/markets", params={"slug": slug})
            resp.raise_for_status()
            data = resp.json()
            return data[0] if data else None
    except Exception as e:
        logger.error(f"Polymarket get_market_by_slug error: {e}")
        return None


async def get_market_by_id(condition_id: str) -> Optional[dict]:
    """Fetch a single market by its condition ID."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GAMMA_API_BASE}/markets",
                params={"id": condition_id},
            )
            resp.raise_for_status()
            data = resp.json()
            return data[0] if data else None
    except Exception as e:
        logger.error(f"Polymarket get_market_by_id error: {e}")
        return None


async def get_market_prices(token_ids: list[str]) -> dict[str, float]:
    """Fetch current prices for a batch of CLOB token IDs."""
    if not token_ids:
        return {}

    prices: dict[str, float] = {}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            for token_id in token_ids:
                resp = await client.get(
                    f"{CLOB_API_BASE}/price",
                    params={"token_id": token_id, "side": "buy"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    prices[token_id] = float(data.get("price", 0))
    except Exception as e:
        logger.error(f"Polymarket get_market_prices error: {e}")

    return prices


async def get_wallet_trades(wallet_address: str, limit: int = 10) -> list[dict]:
    """Fetch recent trades for a specific wallet from the Data API."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{DATA_API_BASE}/v1/trades",
                params={"user": wallet_address, "limit": limit},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Polymarket get_wallet_trades error: {e}")
        return []


async def search_markets(query: str, limit: int = 10) -> list[dict]:
    """Search for markets matching a text query."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GAMMA_API_BASE}/markets",
                params={"_q": query, "limit": limit, "active": True},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Polymarket search_markets error: {e}")
        return []
