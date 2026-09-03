from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)  # Admin, Doctor, Patient, Staff
    action = Column(String(100), nullable=False)    # Login, Viewed Patient, Added Diagnosis, Booked Appointment, etc.
    resource = Column(String(100), nullable=True)   # Patient P001, Appointment #10, etc.
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, server_default=func.now())
