"""
Foresynth API - Intel Router (News Aggregation)

Endpoints for fetching news/intel feed.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
import httpx

from src.services.intel import IntelService

router = APIRouter()
intel_service = IntelService()


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
    Get aggregated news/intel feed from multiple sources:
    CryptoPanic, GDELT, and major RSS feeds.
    """
    items_raw = await intel_service.get_aggregated_feed(limit=limit)
    
    items = []
    for p in items_raw:
        items.append(IntelItem(
            id=p.get("id", ""),
            source=p.get("source", "Unknown"),
            title=p.get("title", ""),
            url=p.get("url", ""),
            published_at=p.get("published_at", ""),
            domain=p.get("domain", ""),
            kind=p.get("kind", "news")
        ))
    
    return IntelFeedResponse(items=items, count=len(items))


@router.get("/sources")
async def get_sources():
    """Get list of supported news sources."""
    return {
        "sources": [
            {"id": "cryptopanic", "name": "CryptoPanic", "type": "aggregator"},
            {"id": "gdelt", "name": "GDELT Project", "type": "event-db"},
            {"id": "rss", "name": "Global RSS Feeds", "type": "news-media"},
        ],
        "filters": ["all", "rising", "hot", "bullish", "bearish"],
        "kinds": ["all", "news", "media"]
    }
