from pydantic import BaseModel, ConfigDict
from typing import Optional


class PatientProfileCreate(BaseModel):

    patient_id: int

    blood_group: Optional[str] = None

    allergies: Optional[str] = None

    existing_diseases: Optional[str] = None

    medical_history: Optional[str] = None

    current_medications: Optional[str] = None

    emergency_contact: Optional[str] = None

    insurance_details: Optional[str] = None


class PatientProfileUpdate(BaseModel):

    blood_group: Optional[str] = None

    allergies: Optional[str] = None

    existing_diseases: Optional[str] = None

    medical_history: Optional[str] = None

    current_medications: Optional[str] = None

    emergency_contact: Optional[str] = None

    insurance_details: Optional[str] = None


class PatientProfileResponse(PatientProfileCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
