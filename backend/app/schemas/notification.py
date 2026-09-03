from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    patient_id: Optional[int] = None
    title: str
    message: str
    notification_type: str = "system"  # appointment, medication, clinical, system
    priority: str = "medium"           # high, medium, low
    dosage_time: Optional[str] = None  # Morning, Afternoon, Night, or Specific Time
    medicine_name: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    unread_count: int
    total_count: int
    notifications: list[NotificationResponse]
