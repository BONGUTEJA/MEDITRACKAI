from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.models.patient_profile import PatientProfile
from app.routers.audit_log import log_activity

from app.schemas.patient_profile import (
    PatientProfileCreate,
    PatientProfileResponse,
    PatientProfileUpdate

)

router = APIRouter(
    prefix="/patient-profiles",
    tags=["Patient Profile"]
)


# CREATE PATIENT PROFILE
@router.post("/", response_model=PatientProfileResponse)
def create_patient_profile(
    profile: PatientProfileCreate,
    db: Session = Depends(get_db)
):

    patient = db.query(Patient).filter(
        Patient.id == profile.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    existing_profile = db.query(PatientProfile).filter(
        PatientProfile.patient_id == profile.patient_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Patient profile already exists"
        )

    new_profile = PatientProfile(
        **profile.model_dump()
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    # Record Audit Event
    log_activity(
        db=db,
        user_name=patient.full_name,
        user_role="Patient",
        action="Created Medical Dossier",
        resource=f"Profile for {patient.full_name} ({patient.patient_id})",
        details=f"Established initial clinical history, allergies, and emergency coordinates.",
    )

    return new_profile


# GET PATIENT PROFILE
@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(PatientProfile).filter(
        PatientProfile.patient_id == patient_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return profile


# UPDATE PATIENT PROFILE
@router.put("/{patient_id}", response_model=PatientProfileResponse)
def update_patient_profile(
    patient_id: int,
    profile_data: PatientProfileUpdate,
    db: Session = Depends(get_db)
):

    profile = db.query(PatientProfile).filter(
        PatientProfile.patient_id == patient_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    pat_name = patient.full_name if patient else f"Patient #{patient_id}"
    pat_id_str = patient.patient_id if patient else str(patient_id)

    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            profile,
            key,
            value
        )

    db.commit()
    db.refresh(profile)

    # Record Audit Event
    updated_fields = ", ".join(update_data.keys())
    log_activity(
        db=db,
        user_name="Medical Practitioner",
        user_role="Staff",
        action="Updated Medical Dossier",
        resource=f"EHR {pat_name} ({pat_id_str})",
        details=f"Updated clinical fields ({updated_fields}) in patient dossier.",
    )

    return profile
