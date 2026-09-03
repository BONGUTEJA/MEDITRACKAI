from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse, AuditLogListResponse

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs & Security Monitoring"]
)

def log_activity(
    db: Session,
    user_name: str,
    user_role: str,
    action: str,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    user_id: Optional[int] = None,
    ip_address: str = "127.0.0.1"
):
    try:
        audit = AuditLog(
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
    except Exception:
        db.rollback()
        return None


@router.get("/", response_model=AuditLogListResponse)
def get_audit_logs(
    user_name: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if user_name:
        query = query.filter(AuditLog.user_name.ilike(f"%{user_name}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    total = db.query(AuditLog).count()

    return {
        "total_count": total,
        "logs": logs
    }


@router.get("/security-events", response_model=AuditLogListResponse)
def get_security_events(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    security_actions = [
        "Login Failed", "Unauthorized Access", "Permission Denied",
        "Invalid Password", "Security Alert", "User Registered"
    ]
    query = db.query(AuditLog).filter(
        AuditLog.action.in_(security_actions)
    )
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    total = query.count()

    return {
        "total_count": total,
        "logs": logs
    }


@router.post("/", response_model=AuditLogResponse)
def create_audit_log(
    log_data: AuditLogCreate,
    db: Session = Depends(get_db)
):
    audit = log_activity(
        db=db,
        user_name=log_data.user_name,
        user_role=log_data.user_role,
        action=log_data.action,
        resource=log_data.resource,
        details=log_data.details,
        user_id=log_data.user_id,
        ip_address=log_data.ip_address or "127.0.0.1"
    )
    if not audit:
        raise HTTPException(status_code=500, detail="Failed to create audit log")
    return audit
