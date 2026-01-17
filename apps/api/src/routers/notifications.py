"""
Foresynth API - Notifications Router

Endpoints for managing user notifications across channels.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

from src.core import get_db

router = APIRouter()


class NotificationCreate(BaseModel):
    """Request model for creating a notification."""
    title: str
    message: str
    type: Literal["price_alert", "wallet_alert", "system"]
    metadata: Optional[dict] = None


class Notification(BaseModel):
    """Notification response model."""
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    metadata: Optional[dict]
    created_at: str


@router.get("/")
async def list_notifications(
    user_id: str,  # TODO: Replace with auth dependency
    unread_only: bool = False,
    limit: int = 50,
    db = Depends(get_db)
):
    """Get all notifications for a user."""
    query = db.table("notifications").select("*").eq("user_id", user_id)
    
    if unread_only:
        query = query.eq("is_read", False)
    
    query = query.order("created_at", desc=True).limit(limit)
    response = query.execute()
    
    return {"notifications": response.data, "count": len(response.data)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification: NotificationCreate,
    user_id: str,  # TODO: Replace with auth dependency
    db = Depends(get_db)
):
    """Create a new notification."""
    data = {
        "user_id": user_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "metadata": notification.metadata,
        "is_read": False
    }
    response = db.table("notifications").insert(data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
    return response.data[0]


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    db = Depends(get_db)
):
    """Mark a notification as read."""
    response = db.table("notifications").update({"is_read": True}).eq("id", notification_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return response.data[0]


@router.post("/read-all")
async def mark_all_as_read(
    user_id: str,  # TODO: Replace with auth dependency
    db = Depends(get_db)
):
    """Mark all notifications as read for a user."""
    response = db.table("notifications").update({"is_read": True}).eq("user_id", user_id).eq("is_read", False).execute()
    
    return {"updated": len(response.data) if response.data else 0}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db = Depends(get_db)
):
    """Delete a notification."""
    response = db.table("notifications").delete().eq("id", notification_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return None


@router.get("/unread-count")
async def get_unread_count(
    user_id: str,  # TODO: Replace with auth dependency
    db = Depends(get_db)
):
    """Get count of unread notifications."""
    response = db.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("is_read", False).execute()
    
    return {"count": response.count or 0}
