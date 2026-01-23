"""
Foresynth API - Squads Router

CRUD endpoints for Smart Money target squads and tracked wallets.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from src.core import get_db, get_cache
from src.core.security import get_current_user
from src.services.polymarket import get_polymarket_service
import asyncio
import json

router = APIRouter()
pm_service = get_polymarket_service()


class AlertConfig(BaseModel):
    """Alert configuration for a tracked target."""
    min_trade_size: int = 1000
    only_buy_orders: bool = True
    asset_class_filter: list[str] = []
    channels: list[str] = ["in-app"]


class TargetCreate(BaseModel):
    """Request model for adding a target to a squad."""
    wallet_address: str
    nickname: Optional[str] = None
    alert_config: AlertConfig = AlertConfig()


class SquadCreate(BaseModel):
    """Request model for creating a squad."""
    name: str


class SquadUpdate(BaseModel):
    """Request model for updating a squad."""
    name: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_squads(
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """List all squads for a user with their targets."""
    # Get squads
    squads_response = db.table("squads").select("*").eq("user_id", user_id).execute()
    squads = squads_response.data
    
    # Get targets for each squad
    result = []
    for squad in squads:
        targets_response = db.table("tracked_targets").select("*").eq("squad_id", squad["id"]).execute()
        result.append({
            **squad,
            "targets": targets_response.data
        })
    
    return {"squads": result}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_squad(
    squad: SquadCreate,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new squad."""
    data = {
        "user_id": user_id,
        "name": squad.name,
        "is_active": True
    }
    response = db.table("squads").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create squad")
    
    return response.data[0]


@router.get("/leaderboard")
async def get_global_leaderboard(
    window: str = "monthly"
):
    """Get global trader leaderboard from Polymarket."""
    return await pm_service.get_leaderboard(timeframe=window)


@router.get("/smart-money")
async def get_smart_money_list(
    limit: int = 20,
    min_trades: int = 5
):
    """
    Get 'Smart Money' list: Top traders sorted by Win Rate.
    
    Aggregates global leaderboard with closed position history 
    to calculate win/loss metrics.
    """
    cache = get_cache()
    cache_key = f"smart_money_list:{limit}:{min_trades}"
    
    # Check cache
    if cache:
        try:
            cached = await asyncio.to_thread(cache.get, cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            print(f"SmartMoney: Cache read error: {e}")
            
    # 1. Fetch Global Leaderboard (Monthly provides recent reliable signal)
    leaderboard = await pm_service.get_leaderboard(timeframe="monthly")
    
    # 2. Extract top candidates (Limit to top 30 to manage rate limits/latency)
    candidates = leaderboard[:30] if leaderboard else []
    
    # 3. Fetch trade history for each candidate in parallel
    tasks = []
    for trader in candidates:
        address = trader.get("address") or trader.get("proxyWallet")
        if address:
            tasks.append(pm_service.get_closed_positions(address, limit=100))
        else:
            # Placeholder for missing address (shouldn't happen with valid leaderboard data)
            tasks.append(asyncio.sleep(0, result=[]))
            
    # Execute parallel fetch
    histories = await asyncio.gather(*tasks)
    
    # 4. Compute Metrics
    smart_money = []
    for i, trader in enumerate(candidates):
        history = histories[i]
        
        # Skip if no history found or fetch failed
        if not history or not isinstance(history, list):
            continue
            
        total_trades = len(history)
        if total_trades < min_trades:
            continue
            
        # Calculate Wins/Losses based on realized PnL
        wins = sum(1 for trade in history if trade.get("realizedPnl", 0) > 0)
        losses = sum(1 for trade in history if trade.get("realizedPnl", 0) <= 0)
        
        # Calculate Win Rate
        win_rate = (wins / total_trades) * 100 if total_trades > 0 else 0
        
        # Prepare trader profile
        profile = {
            "rank": trader.get("rank", i + 1),
            "address": trader.get("address") or trader.get("proxyWallet"),
            "name": trader.get("name") or trader.get("username") or "Unknown Trader",
            "profileImage": trader.get("profileImage") or trader.get("image"),
            "totalProfit": float(trader.get("pnl", 0)),  # Use leaderboard PnL
            "volume": float(trader.get("volume", 0)),
            "totalBets": total_trades, # In our sample
            "wins": wins,
            "losses": losses,
            "winRate": round(win_rate, 2),
            "tracked": False # Placeholder, client can check against their list
        }
        smart_money.append(profile)
        
    # 5. Sort by Win Rate (Descending)
    smart_money.sort(key=lambda x: x["winRate"], reverse=True)
    
    # Return requested limit
    result = smart_money[:limit]
    
    # Cache result for 10 minutes
    if cache:
        try:
            await asyncio.to_thread(cache.setex, cache_key, 600, json.dumps(result))
        except Exception as e:
            print(f"SmartMoney: Cache write error: {e}")
            
    return result


@router.get("/{squad_id}")
async def get_squad(
    squad_id: str,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get a specific squad with its targets."""
    squad_response = db.table("squads").select("*").eq("id", squad_id).execute()
    
    if not squad_response.data:
        raise HTTPException(status_code=404, detail="Squad not found")
    
    targets_response = db.table("tracked_targets").select("*").eq("squad_id", squad_id).execute()
    
    return {
        **squad_response.data[0],
        "targets": targets_response.data
    }


@router.patch("/{squad_id}")
async def update_squad(
    squad_id: str,
    update: SquadUpdate,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update a squad (name or active status)."""
    update_data = update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    response = db.table("squads").update(update_data).eq("id", squad_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Squad not found")
    
    return response.data[0]


@router.delete("/{squad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_squad(
    squad_id: str,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete a squad and all its targets."""
    response = db.table("squads").delete().eq("id", squad_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Squad not found")
    
    return None


# Target management
@router.post("/{squad_id}/targets", status_code=status.HTTP_201_CREATED)
async def add_target(
    squad_id: str,
    target: TargetCreate,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Add a wallet target to a squad."""
    # Verify squad exists
    squad_check = db.table("squads").select("id").eq("id", squad_id).execute()
    if not squad_check.data:
        raise HTTPException(status_code=404, detail="Squad not found")
    
    data = {
        "squad_id": squad_id,
        "wallet_address": target.wallet_address,
        "nickname": target.nickname,
        "alert_config": target.alert_config.model_dump()
    }
    response = db.table("tracked_targets").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to add target")
    
    return response.data[0]


@router.delete("/{squad_id}/targets/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_target(
    squad_id: str,
    target_id: str,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Remove a target from a squad."""
    response = db.table("tracked_targets").delete().eq("id", target_id).eq("squad_id", squad_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Target not found")
    
    return None


@router.patch("/{squad_id}/targets/{target_id}")
async def update_target_config(
    squad_id: str,
    target_id: str,
    config: AlertConfig,
    user_id: str = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update a target's alert configuration."""
    response = db.table("tracked_targets").update({
        "alert_config": config.model_dump()
    }).eq("id", target_id).eq("squad_id", squad_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Target not found")
    
    return response.data[0]



