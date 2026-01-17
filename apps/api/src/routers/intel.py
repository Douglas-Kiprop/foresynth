"""
Foresynth API - Intel Router (News Aggregation)

Endpoints for fetching news/intel feed.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()

# CryptoPanic API for crypto news (free tier available)
CRYPTOPANIC_API = "https://cryptopanic.com/api/v1/posts/"


class IntelItem(BaseModel):
    """Intel/news item model."""
    id: str
    source: str
    title: str
    url: str
    published_at: str
    domain: Optional[str] = None
    kind: Optional[str] = None  # news, media


class IntelFeedResponse(BaseModel):
    """Response model for intel feed."""
    items: list[IntelItem]
    count: int


@router.get("/feed", response_model=IntelFeedResponse)
async def get_intel_feed(
    filter: str = Query("all", description="Filter: all, rising, hot, bullish, bearish"),
    kind: str = Query("all", description="Kind: all, news, media"),
    limit: int = Query(30, ge=1, le=100),
):
    """
    Get aggregated news/intel feed.
    
    Currently sources from CryptoPanic API (free public endpoint).
    """
    # Build params
    params = {"public": "true"}
    if filter != "all":
        params["filter"] = filter
    if kind != "all":
        params["kind"] = kind
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                CRYPTOPANIC_API,
                params=params,
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        print(f"CryptoPanic API error: {e}")
        # Return empty on error (graceful degradation)
        return IntelFeedResponse(items=[], count=0)
    except Exception as e:
        print(f"Unexpected error fetching intel: {e}")
        return IntelFeedResponse(items=[], count=0)
    
    # Transform response
    items = []
    for post in data.get("results", [])[:limit]:
        try:
            source_info = post.get("source", {})
            source_title = source_info.get("title", "Unknown") if isinstance(source_info, dict) else "Unknown"
            
            items.append(IntelItem(
                id=str(post.get("id", "")),
                source=source_title,
                title=post.get("title", ""),
                url=post.get("url", ""),
                published_at=post.get("published_at", ""),
                domain=post.get("domain", ""),
                kind=post.get("kind", "")
            ))
        except Exception as e:
            print(f"Error parsing intel item: {e}")
            continue
    
    return IntelFeedResponse(items=items, count=len(items))


@router.get("/sources")
async def get_sources():
    """Get list of supported news sources."""
    return {
        "sources": [
            {"id": "cryptopanic", "name": "CryptoPanic", "type": "aggregator"},
            {"id": "polymarket", "name": "Polymarket News", "type": "platform"},
        ],
        "filters": ["all", "rising", "hot", "bullish", "bearish"],
        "kinds": ["all", "news", "media"]
    }
