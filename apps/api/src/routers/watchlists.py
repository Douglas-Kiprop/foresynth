"""
Foresynth API - Watchlists Router

CRUD endpoints for user watchlists.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from src.core import get_db

router = APIRouter()


class WatchlistCreate(BaseModel):
    """Request model for creating a watchlist."""
    name: str
    market_ids: list[str] = []


class WatchlistUpdate(BaseModel):
    """Request model for updating a watchlist."""
    name: Optional[str] = None
    market_ids: Optional[list[str]] = None


class Watchlist(BaseModel):
    """Watchlist response model."""
    id: str
    user_id: str
    name: str
    market_ids: list[str]
    created_at: str


@router.get("/")
async def list_watchlists(
    user_id: str,  # TODO: Replace with auth dependency
    db = Depends(get_db)
):
    """List all watchlists for a user."""
    response = db.table("watchlists").select("*").eq("user_id", user_id).execute()
    return {"watchlists": response.data}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_watchlist(
    watchlist: WatchlistCreate,
    user_id: str,  # TODO: Replace with auth dependency
    db = Depends(get_db)
):
    """Create a new watchlist."""
    data = {
        "user_id": user_id,
        "name": watchlist.name,
        "market_ids": watchlist.market_ids
    }
    response = db.table("watchlists").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create watchlist")
    
    return response.data[0]


@router.get("/{watchlist_id}")
async def get_watchlist(
    watchlist_id: str,
    db = Depends(get_db)
):
    """Get a specific watchlist by ID."""
    response = db.table("watchlists").select("*").eq("id", watchlist_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    return response.data[0]


@router.patch("/{watchlist_id}")
async def update_watchlist(
    watchlist_id: str,
    update: WatchlistUpdate,
    db = Depends(get_db)
):
    """Update a watchlist."""
    update_data = update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    response = db.table("watchlists").update(update_data).eq("id", watchlist_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    return response.data[0]


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist(
    watchlist_id: str,
    db = Depends(get_db)
):
    """Delete a watchlist."""
    response = db.table("watchlists").delete().eq("id", watchlist_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    return None


@router.post("/{watchlist_id}/markets/{market_id}")
async def add_market_to_watchlist(
    watchlist_id: str,
    market_id: str,
    db = Depends(get_db)
):
    """Add a market to a watchlist."""
    # Get current watchlist
    response = db.table("watchlists").select("market_ids").eq("id", watchlist_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    current_markets = response.data[0].get("market_ids", [])
    
    if market_id in current_markets:
        return {"message": "Market already in watchlist"}
    
    # Update with new market
    new_markets = current_markets + [market_id]
    update_response = db.table("watchlists").update({"market_ids": new_markets}).eq("id", watchlist_id).execute()
    
    return update_response.data[0]


@router.delete("/{watchlist_id}/markets/{market_id}")
async def remove_market_from_watchlist(
    watchlist_id: str,
    market_id: str,
    db = Depends(get_db)
):
    """Remove a market from a watchlist."""
    # Get current watchlist
    response = db.table("watchlists").select("market_ids").eq("id", watchlist_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    
    current_markets = response.data[0].get("market_ids", [])
    
    if market_id not in current_markets:
        return {"message": "Market not in watchlist"}
    
    # Update without market
    new_markets = [m for m in current_markets if m != market_id]
    update_response = db.table("watchlists").update({"market_ids": new_markets}).eq("id", watchlist_id).execute()
    
    return update_response.data[0]
