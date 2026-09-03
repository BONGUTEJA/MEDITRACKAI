from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogBase(BaseModel):
    user_id: Optional[int] = None
    user_name: str
    user_role: str
    action: str
    resource: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = "127.0.0.1"

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    total_count: int
    logs: list[AuditLogResponse]
