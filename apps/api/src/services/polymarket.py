"""
Foresynth API - Polymarket Service

Client for interacting with Polymarket APIs (Gamma, CLOB).
"""
import httpx
import asyncio
import json
from typing import Optional
from pydantic import BaseModel

from src.core import get_async_cache

# API Base URLs
GAMMA_API_BASE = "https://gamma-api.polymarket.com"
CLOB_API_BASE = "https://clob.polymarket.com"


class MarketData(BaseModel):
    """Detailed market data from Polymarket."""
    id: str
    question: str
    slug: str
    volume: float
    liquidity: float
    yes_price: float
    no_price: float
    end_date: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    active: bool = True
    clob_token_id: Optional[str] = None


class PolymarketService:
    """
    Service for interacting with Polymarket APIs.
    """
    
    def __init__(self):
        self.cache = get_async_cache()
    
    async def search_markets(
        self,
        query: str,
        limit: int = 20,
        active_only: bool = True
    ) -> list[MarketData]:
        """Search markets by keyword."""
        cache_key = f"pm_search:{query}:{limit}"
        
        # Check cache
        cached_json = await self.cache.get(cache_key)
        if cached_json:
            cached = json.loads(cached_json)
            return [MarketData(**m) for m in cached]
        
        params = {
            "_q": query,
            "_limit": limit,
        }
        if active_only:
            params["active"] = True
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GAMMA_API_BASE}/markets",
                params=params,
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
        
        markets = []
        for m in data:
            prices = m.get("outcomePrices", [0.5, 0.5])
            clob_ids = json.loads(m.get("clobTokenIds", "[]"))
            markets.append(MarketData(
                id=m.get("id", ""),
                question=m.get("question", ""),
                slug=m.get("slug", ""),
                volume=float(m.get("volume", 0)),
                liquidity=float(m.get("liquidity", 0)),
                yes_price=float(prices[0]) if prices else 0.5,
                no_price=float(prices[1]) if len(prices) > 1 else 0.5,
                end_date=m.get("endDate"),
                image=m.get("image"),
                category=m.get("category"),
                description=m.get("description"),
                active=m.get("active", True),
                clob_token_id=clob_ids[0] if clob_ids else None
            ))
        
        # Cache for 5 minutes
        await self.cache.setex(cache_key, 300, json.dumps([m.model_dump() for m in markets]))
        
        return markets
    
    async def get_market(self, market_id: str) -> Optional[MarketData]:
        """Get detailed market data by ID."""
        cache_key = f"pm_market:{market_id}"
        
        cached_json = await self.cache.get(cache_key)
        if cached_json:
            cached = json.loads(cached_json)
            return MarketData(**cached)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{GAMMA_API_BASE}/markets/{market_id}",
                    timeout=15.0
                )
                response.raise_for_status()
                m = response.json()
        except httpx.HTTPError:
            return None
        
        prices = m.get("outcomePrices", [0.5, 0.5])
        clob_ids = json.loads(m.get("clobTokenIds", "[]"))
        market = MarketData(
            id=m.get("id", ""),
            question=m.get("question", ""),
            slug=m.get("slug", ""),
            volume=float(m.get("volume", 0)),
            liquidity=float(m.get("liquidity", 0)),
            yes_price=float(prices[0]) if prices else 0.5,
            no_price=float(prices[1]) if len(prices) > 1 else 0.5,
            end_date=m.get("endDate"),
            image=m.get("image"),
            category=m.get("category"),
            description=m.get("description"),
            active=m.get("active", True),
            clob_token_id=clob_ids[0] if clob_ids else None
        )
        
        # Cache for 1 minute
        await self.cache.setex(cache_key, 60, json.dumps(market.model_dump()))
        
        return market
    
    async def get_current_price(self, market_id: str) -> Optional[dict]:
        """Get current price for a market from CLOB."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{CLOB_API_BASE}/prices",
                    params={"token_id": market_id},
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError:
            return None
    
    async def get_trending(self, limit: int = 10) -> list[MarketData]:
        """Get trending markets by volume."""
        cache_key = f"pm_trending:{limit}"
        
        if self.cache:
            try:
                cached = await self.cache.get(cache_key)
                if cached:
                    return [MarketData(**m) for m in json.loads(cached)]
            except Exception as e:
                print(f"PolymarketService: Cache read error: {e}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GAMMA_API_BASE}/markets",
                params={
                    "_limit": limit,
                    "active": True,
                    "_sort": "volume",
                    "_order": "desc"
                },
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
        
        markets = []
        for m in data:
            prices = m.get("outcomePrices", [0.5, 0.5])
            markets.append(MarketData(
                id=m.get("id", ""),
                question=m.get("question", ""),
                slug=m.get("slug", ""),
                volume=float(m.get("volume", 0)),
                liquidity=float(m.get("liquidity", 0)),
                yes_price=float(prices[0]) if prices else 0.5,
                no_price=float(prices[1]) if len(prices) > 1 else 0.5,
                end_date=m.get("endDate"),
                image=m.get("image"),
                category=m.get("category"),
                active=True
            ))
        
        # Cache for 2 minutes
        if self.cache:
            await self.cache.setex(cache_key, 120, json.dumps([m.model_dump() for m in markets]))
        
        return markets

    async def get_leaderboard(self, timeframe: str = "monthly") -> list[dict]:
        """Fetch global leaderboard from Polymarket Data API."""
        # Mapping timeframe to Polymarket data-api window: day, week, month, all
        period_map = {
            "daily": "day",
            "weekly": "week",
            "monthly": "month",
            "all": "all"
        }
        time_period = period_map.get(timeframe, "month")
        
        cache_key = f"pm_leaderboard:{time_period}"
        
        # Check cache
        if self.cache:
            try:
                cached = await self.cache.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                print(f"PolymarketService: Cache read error: {e}")

        url = "https://data-api.polymarket.com/v1/leaderboard"
        params = {
            "timePeriod": time_period,
            "orderBy": "PNL",
            "limit": 20,
            "offset": 0,
            "category": "overall"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                # Cache for 1 hour
                if self.cache and data:
                    await self.cache.setex(cache_key, 3600, json.dumps(data))
                
                return data
        except Exception as e:
            print(f"PolymarketService: Leaderboard fetch error: {e}")
            return []

    async def get_closed_positions(
        self, 
        wallet_address: str, 
        limit: int = 100
    ) -> list[dict]:
        """Fetch closed positions for a wallet to calculate win rate."""
        cache_key = f"pm_closed_pos:{wallet_address}:{limit}"
        
        if self.cache:
            try:
                cached = await self.cache.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                print(f"PolymarketService: Cache read error: {e}")

        url = "https://data-api.polymarket.com/v1/closed-positions"
        params = {
            "user": wallet_address,
            "limit": limit,
            "sortBy": "timestamp",
            "sortDirection": "DESC"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                
                # Cache for 10 minutes (completed trades don't change, but new ones happen)
                if self.cache and data:
                    await self.cache.setex(cache_key, 600, json.dumps(data))
                
                return data
        except Exception as e:
            print(f"PolymarketService: Closed positions fetch error for {wallet_address}: {e}")
            return []

    async def get_batch_prices(self, token_ids: list[str]) -> dict[str, float]:
        """Fetch current mid prices for multiple tokens in one call."""
        if not token_ids:
            return {}
            
        url = f"{CLOB_API_BASE}/prices-history"
        results = {}
        
        # Polymarket CLOB /prices-history or /prices
        # For tracking efficiency, we use the mid price from /prices for multiple tokens if possible
        # Or iterate if the API doesn't support bulk token_id in one param
        
        async with httpx.AsyncClient() as client:
            # We fetch individually for now as CLOB API usually prefers one token_id per request 
            # for price history/details, but we'll optimize by running them in parallel
            tasks = []
            for tid in token_ids:
                tasks.append(client.get(f"{CLOB_API_BASE}/price", params={"token_id": tid}, timeout=5.0))
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for tid, resp in zip(token_ids, responses):
                if isinstance(resp, httpx.Response) and resp.status_code == 200:
                    try:
                        data = resp.json()
                        # data usually contains {"price": "0.55"}
                        results[tid] = float(data.get("price", 0))
                    except (ValueError, TypeError):
                        pass
        
        return results

    async def get_trades(self, wallet_address: str, limit: int = 5) -> list[dict]:
        """Fetch latest trades for a specific wallet address from Data API."""
        url = "https://data-api.polymarket.com/v1/trades"
        params = {
            "user": wallet_address,
            "limit": limit,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"PolymarketService: Trade fetch error for {wallet_address}: {e}")
            return []



# Singleton
_polymarket_service: PolymarketService | None = None


def get_polymarket_service() -> PolymarketService:
    """Get Polymarket service singleton."""
    global _polymarket_service
    if _polymarket_service is None:
        _polymarket_service = PolymarketService()
    return _polymarket_service
