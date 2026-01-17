"""
Foresynth API - Squads Router

CRUD endpoints for Smart Money target squads and tracked wallets.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from src.core import get_db

router = APIRouter()


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
    user_id: str,  # TODO: Replace with auth dependency
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
    user_id: str,  # TODO: Replace with auth dependency
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


@router.get("/{squad_id}")
async def get_squad(
    squad_id: str,
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
    db = Depends(get_db)
):
    """Update a target's alert configuration."""
    response = db.table("tracked_targets").update({
        "alert_config": config.model_dump()
    }).eq("id", target_id).eq("squad_id", squad_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Target not found")
    
    return response.data[0]
