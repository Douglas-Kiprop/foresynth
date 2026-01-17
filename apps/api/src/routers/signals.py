"""
Foresynth API - Signals Router (Insiders / Anomaly Radar)

Endpoints for fetching insider trading signals.
"""
from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from src.core import get_db

router = APIRouter()


class InsiderSignal(BaseModel):
    """Insider signal data model."""
    id: str
    wallet_address: str
    market_id: str
    trade_size: float
    radar_score: int
    metadata: dict
    created_at: str


class SignalFeedResponse(BaseModel):
    """Response model for signal feed."""
    signals: list[InsiderSignal]
    count: int


@router.get("/feed", response_model=SignalFeedResponse)
async def get_signal_feed(
    min_score: int = Query(0, ge=0, le=100, description="Minimum radar score"),
    max_age_days: int = Query(30, ge=1, le=365, description="Maximum wallet age in days"),
    limit: int = Query(50, ge=1, le=200),
    db = Depends(get_db)
):
    """
    Get the insider signal feed.
    
    Filters:
    - min_score: Minimum radar score (0-100)
    - max_age_days: Filter signals from wallets younger than X days
    """
    # Build query
    query = db.table("insider_signals").select("*")
    
    # Apply filters
    if min_score > 0:
        query = query.gte("radar_score", min_score)
    
    # Order by score descending, then by recency
    query = query.order("radar_score", desc=True).order("created_at", desc=True)
    query = query.limit(limit)
    
    response = query.execute()
    
    # Filter by wallet age from metadata (if available)
    signals = []
    for s in response.data:
        metadata = s.get("metadata", {})
        wallet_age = metadata.get("wallet_age_days", 0)
        
        if wallet_age <= max_age_days:
            signals.append(InsiderSignal(
                id=s["id"],
                wallet_address=s["wallet_address"],
                market_id=s["market_id"],
                trade_size=float(s.get("trade_size", 0)),
                radar_score=s.get("radar_score", 0),
                metadata=metadata,
                created_at=s["created_at"]
            ))
    
    return SignalFeedResponse(signals=signals, count=len(signals))


@router.get("/{signal_id}")
async def get_signal(
    signal_id: str,
    db = Depends(get_db)
):
    """Get a specific signal by ID."""
    response = db.table("insider_signals").select("*").eq("id", signal_id).execute()
    
    if not response.data:
        return {"error": "Signal not found"}
    
    return response.data[0]


@router.get("/wallet/{wallet_address}")
async def get_signals_by_wallet(
    wallet_address: str,
    db = Depends(get_db)
):
    """Get all signals for a specific wallet address."""
    response = db.table("insider_signals").select("*").eq("wallet_address", wallet_address).execute()
    
    return {"signals": response.data, "count": len(response.data)}
