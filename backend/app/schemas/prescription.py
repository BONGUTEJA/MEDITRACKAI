from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionItemCreate(PrescriptionItemBase):
    pass


class PrescriptionItemResponse(PrescriptionItemBase):
    id: int
    prescription_id: int

    class Config:
        from_attributes = True


class PrescriptionBase(BaseModel):
    consultation_id: Optional[int] = None
    patient_id: int
    doctor_id: int
    issue_date: date
    general_instructions: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    items: List[PrescriptionItemCreate]


class PrescriptionResponse(PrescriptionBase):
    id: int
    patient_name: Optional[str] = None
    patient_identifier: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    items: List[PrescriptionItemResponse] = []

    class Config:
        from_attributes = True