from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Body, Depends
from pydantic import BaseModel, Field
import httpx
from datetime import datetime

from src.core.config import get_settings
from src.core.database import get_supabase

router = APIRouter()

# ── Models ─────────────────────────────────────────────────────

class AgentConfigUpdate(BaseModel):
    risk_profile: str = Field(..., pattern="^(conservative|moderate|degen)$")
    focus_sectors: List[str]
    sources: List[str]
    alert_frequency: str = "medium"  # Changed from notification_frequency to match DB
    is_active: bool = True

class AgentConfigResponse(AgentConfigUpdate):
    user_id: str
    created_at: datetime
    updated_at: datetime

class DecisionResponse(BaseModel):
    id: str
    market_question: str
    market_slug: Optional[str]
    signal: str
    confidence: float
    reasoning: str
    key_factors: List[str]
    risk_level: str
    created_at: datetime

# ── Endpoints ──────────────────────────────────────────────────

@router.get("/config/{user_id}", response_model=AgentConfigResponse)
async def get_agent_config(user_id: str):
    """Fetch the user's agent configuration."""
    db = get_supabase()
    
    # Use limit(1) instead of single() to avoid PGRST116 on no rows
    resp = db.table("agent_configs").select("*").eq("user_id", user_id).limit(1).execute()
    
    if not resp.data:
        # Return default config if none exists
        return AgentConfigResponse(
            user_id=user_id,
            risk_profile="moderate",
            focus_sectors=["politics", "crypto", "pop_culture"],
            sources=["watchlists", "news"], # Default matches user schema constraint
            alert_frequency="medium",       # Default matches user schema constraint
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
    return resp.data[0]

@router.put("/config/{user_id}", response_model=AgentConfigResponse)
async def update_agent_config(user_id: str, config: AgentConfigUpdate):
    """Update or create the user's agent configuration."""
    db = get_supabase()
    
    # Check if exists
    existing = db.table("agent_configs").select("user_id").eq("user_id", user_id).execute()
    
    data = config.model_dump()
    data["updated_at"] = datetime.now().isoformat()
    
    if existing.data:
        # Update
        resp = db.table("agent_configs").update(data).eq("user_id", user_id).execute()
    else:
        # Insert
        data["user_id"] = user_id
        resp = db.table("agent_configs").insert(data).execute()
        
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to save configuration")
        
    return resp.data[0]

@router.get("/decisions/{user_id}", response_model=List[DecisionResponse])
async def get_agent_decisions(
    user_id: str, 
    limit: int = 20
):
    """Fetch recent agent decisions for the feed."""
    db = get_supabase()
    
    resp = (
        db.table("agent_decisions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    
    return resp.data or []

@router.post("/analyze/{user_id}")
async def trigger_analysis(user_id: str):
    """
    Manually trigger an analysis run by calling the Agent Service.
    This acts as a proxy to apps/agent.
    """
    settings = get_settings()
    # Assuming Agent Service runs on port 8001 locally or defined in settings
    # For now, hardcoding localhost:8001 as per user context
    agent_service_url = "http://localhost:8001"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{agent_service_url}/analyze",
                json={"user_id": user_id, "task": "manual_trigger"},
                timeout=30.0
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Agent service unavailable: {str(e)}")
