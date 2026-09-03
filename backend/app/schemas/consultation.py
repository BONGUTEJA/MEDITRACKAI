from datetime import date
from typing import Optional
from pydantic import BaseModel


class ConsultationBase(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: int
    doctor_id: int
    consultation_date: date
    symptoms: Optional[str] = None
    diagnosis: str
    notes: Optional[str] = None

    vital_bp: Optional[str] = None
    vital_heart_rate: Optional[int] = None
    vital_temperature: Optional[float] = None
    vital_weight: Optional[float] = None
    vital_spo2: Optional[int] = None

    follow_up_date: Optional[date] = None
    status: Optional[str] = 'Completed'


class ConsultationCreate(ConsultationBase):
    pass


class ConsultationUpdate(BaseModel):
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    vital_bp: Optional[str] = None
    vital_heart_rate: Optional[int] = None
    vital_temperature: Optional[float] = None
    vital_weight: Optional[float] = None
    vital_spo2: Optional[int] = None
    follow_up_date: Optional[date] = None
    status: Optional[str] = None


class ConsultationResponse(ConsultationBase):
    id: int
    patient_name: Optional[str] = None
    patient_identifier: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None

    class Config:
        from_attributes = True