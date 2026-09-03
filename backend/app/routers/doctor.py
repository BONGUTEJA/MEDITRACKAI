from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate
from app.routers.audit_log import log_activity


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


# CREATE DOCTOR
@router.post("/")
def create_doctor(
    doctor: DoctorCreate,
    db: Session = Depends(get_db)
):

    existing_doctor = db.query(Doctor).filter(
        Doctor.email == doctor.email
    ).first()

    if existing_doctor:
        raise HTTPException(
            status_code=400,
            detail="Doctor with this email already exists"
        )

    new_doctor = Doctor(
        full_name=doctor.full_name,
        specialization=doctor.specialization,
        phone=doctor.phone,
        email=doctor.email
    )

    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    # Record Audit Log Event
    log_activity(
        db=db,
        user_name="Medical Admin",
        user_role="Administrator",
        action="Registered Doctor",
        resource=f"Doctor {new_doctor.full_name}",
        details=f"Added specialist {new_doctor.full_name} ({new_doctor.specialization}) to active medical roster.",
    )

    return new_doctor


# GET ALL DOCTORS
@router.get("/")
def get_doctors(
    db: Session = Depends(get_db)
):

    doctors = db.query(Doctor).all()

    return doctors


# GET DOCTOR BY ID
@router.get("/{doctor_id}")
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db)
):

    doctor = db.query(Doctor).filter(
        Doctor.id == doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return doctor


# DELETE DOCTOR
@router.delete("/{doctor_id}")
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doc_name = doctor.full_name
    doc_spec = doctor.specialization

    db.delete(doctor)
    db.commit()

    # Record Audit Log Event
    log_activity(
        db=db,
        user_name="Medical Admin",
        user_role="Administrator",
        action="Deleted Doctor",
        resource=f"Doctor {doc_name}",
        details=f"Removed {doc_name} ({doc_spec}) from hospital specialist directory.",
    )

    return {"message": "Doctor deleted successfully"}