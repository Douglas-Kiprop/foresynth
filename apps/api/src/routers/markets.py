"""
Foresynth API - Markets Router

Endpoints for fetching and searching Polymarket markets.
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()

# Polymarket Gamma API base URL
GAMMA_API_BASE = "https://gamma-api.polymarket.com"


class Market(BaseModel):
    """Market data model."""
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


class MarketSearchResponse(BaseModel):
    """Response model for market search."""
    markets: list[Market]
    count: int


@router.get("/search", response_model=MarketSearchResponse)
async def search_markets(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Search for markets by keyword using the Events endpoint.
    
    Fetches active events from Polymarket Gamma API and filters locally
    to ensure 2026 data discovery and reliable search.
    """
    try:
        # Fetch a larger batch of active events to search within
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GAMMA_API_BASE}/events",
                params={
                    "closed": "false",
                    "active": "true",       # Ensure active
                    "limit": "100",         # Fetch reasonable batch
                    "order": "volume",      # Prioritize high volume
                    "ascending": "false"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        print(f"Polymarket API error: {e}")
        return MarketSearchResponse(markets=[], count=0)
    except Exception as e:
        print(f"Unexpected error: {e}")
        return MarketSearchResponse(markets=[], count=0)
    
    # Filter locally in Python
    query = q.lower()
    matches = []
    
    for m in data:
        try:
            question = m.get("question", "") or m.get("title", "")
            slug = m.get("slug", "")
            # Events might have description?
            
            # Weighted search matching
            text_corpus = f"{question} {slug}".lower()
            
            if query in text_corpus:
                # Handle mixed volume types
                vol_raw = m.get("volume", 0)
                volume = float(vol_raw) if vol_raw else 0.0

                # Handle outcomePrices (can be list or JSON string)
                prices_raw = m.get("outcomePrices")
                if isinstance(prices_raw, str):
                    try:
                        prices = json.loads(prices_raw)
                    except:
                        prices = [0.5, 0.5]
                elif isinstance(prices_raw, list):
                    prices = prices_raw
                else:
                    prices = [0.5, 0.5]

                yes_price = float(prices[0]) if prices and len(prices) > 0 else 0.5
                no_price = float(prices[1]) if prices and len(prices) > 1 else 0.5
                
                matches.append(Market(
                    id=str(m.get("id", "")), # Force ID to string
                    question=question,
                    slug=slug,
                    volume=volume,
                    liquidity=float(m.get("liquidity", 0) or 0),
                    yes_price=yes_price,
                    no_price=no_price,
                    end_date=m.get("endDate"),
                    image=m.get("image"),
                    category="Event" # Events usually have implicit category
                ))
        except Exception:
            continue
            
    # Apply limit after filtering
    return MarketSearchResponse(markets=matches[:limit], count=len(matches))


@router.get("/trending")
async def get_trending_markets(limit: int = Query(10, ge=1, le=50)):
    """Get top trending markets (events) by volume."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GAMMA_API_BASE}/events",
                params={
                    "limit": "50", 
                    "closed": "false",
                    "active": "true",
                    "order": "volume", 
                    "ascending": "false"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        print(f"Polymarket trending error: {e}")
        return {"markets": []}
    
    # Sort locally by volume (double check)
    markets = []
    for m in data:
        try:
            # Handle mixed volume types (string/number)
            vol_raw = m.get("volume", 0)
            volume = float(vol_raw) if vol_raw else 0.0

            # Handle outcomePrices (can be list or JSON string)
            prices_raw = m.get("outcomePrices")
            if isinstance(prices_raw, str):
                try:
                    prices = json.loads(prices_raw)
                except:
                    prices = [0.5, 0.5]
            elif isinstance(prices_raw, list):
                prices = prices_raw
            else:
                prices = [0.5, 0.5]

            # Ensure prices has elements
            yes_price = float(prices[0]) if prices and len(prices) > 0 else 0.5
            
            markets.append({
                "id": str(m.get("id")),
                "question": m.get("question") or m.get("title", "Untitled"),
                "volume": volume,
                "yes_price": yes_price,
            })
        except Exception as e:
            continue
            
    # Sort descending by volume
    markets.sort(key=lambda x: x["volume"], reverse=True)
    return {"markets": markets[:limit]}


@router.get("/{market_id}", response_model=Market)
async def get_market(market_id: str):
    """Get detailed market data by ID."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GAMMA_API_BASE}/markets/{market_id}",
                timeout=10.0
            )
            response.raise_for_status()
            m = response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=404, detail=f"Market not found: {str(e)}")
    
    prices = m.get("outcomePrices", [0.5, 0.5])
    return Market(
        id=m.get("id", ""),
        question=m.get("question", ""),
        slug=m.get("slug", ""),
        volume=float(m.get("volume", 0) or 0),
        liquidity=float(m.get("liquidity", 0) or 0),
        yes_price=float(prices[0]) if prices else 0.5,
        no_price=float(prices[1]) if len(prices) > 1 else 0.5,
        end_date=m.get("endDate"),
        image=m.get("image"),
        category=m.get("category")
    )
