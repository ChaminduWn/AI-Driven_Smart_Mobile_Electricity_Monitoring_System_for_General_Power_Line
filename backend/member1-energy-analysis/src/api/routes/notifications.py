from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.models.user import User, Notification
from src.api.routes.auth import get_user_from_token

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[dict])
def get_notifications(
    current_user: User = Depends(get_user_from_token),
    db: Session = Depends(get_db),
    unread_only: bool = False
):
    """Get all notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        } for n in notifications
    ]

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"success": True}

@router.put("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()
    
    return {"success": True}

def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info"):
    """Helper to create a notification (Server Side)"""
    new_notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )
    db.add(new_notif)
    db.commit()
    return new_notif
