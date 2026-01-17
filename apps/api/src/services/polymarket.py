"""
Foresynth API - Polymarket Service

Client for interacting with Polymarket APIs (Gamma, CLOB).
"""
import httpx
from typing import Optional
from pydantic import BaseModel

from src.core import get_cache

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


class PolymarketService:
    """
    Service for interacting with Polymarket APIs.
    
    Provides:
    - Market search and details
    - Price data
    - Orderbook data (CLOB)
    """
    
    def __init__(self):
        self.cache = get_cache()
    
    async def search_markets(
        self,
        query: str,
        limit: int = 20,
        active_only: bool = True
    ) -> list[MarketData]:
        """Search markets by keyword."""
        cache_key = f"pm_search:{query}:{limit}"
        
        # Check cache
        cached = self.cache.get(cache_key)
        if cached:
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
                active=m.get("active", True)
            ))
        
        # Cache for 5 minutes
        self.cache.setex(cache_key, 300, [m.model_dump() for m in markets])
        
        return markets
    
    async def get_market(self, market_id: str) -> Optional[MarketData]:
        """Get detailed market data by ID."""
        cache_key = f"pm_market:{market_id}"
        
        cached = self.cache.get(cache_key)
        if cached:
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
            active=m.get("active", True)
        )
        
        # Cache for 1 minute
        self.cache.setex(cache_key, 60, market.model_dump())
        
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
        
        cached = self.cache.get(cache_key)
        if cached:
            return [MarketData(**m) for m in cached]
        
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
        self.cache.setex(cache_key, 120, [m.model_dump() for m in markets])
        
        return markets


# Singleton
_polymarket_service: PolymarketService | None = None


def get_polymarket_service() -> PolymarketService:
    """Get Polymarket service singleton."""
    global _polymarket_service
    if _polymarket_service is None:
        _polymarket_service = PolymarketService()
    return _polymarket_service
