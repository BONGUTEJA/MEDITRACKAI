from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.consultation import Consultation
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
)
from app.routers.audit_log import log_activity

router = APIRouter(
    prefix='/consultations',
    tags=['Consultations']
)


def enrich_consultation(c: Consultation, db: Session) -> dict:
    patient = db.query(Patient).filter(Patient.id == c.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == c.doctor_id).first()
    return {
        'id': c.id,
        'appointment_id': c.appointment_id,
        'patient_id': c.patient_id,
        'doctor_id': c.doctor_id,
        'patient_name': patient.full_name if patient else 'Patient',
        'patient_identifier': patient.patient_id if patient else '',
        'doctor_name': doctor.full_name if doctor else 'Doctor',
        'doctor_specialization': doctor.specialization if doctor else 'General',
        'consultation_date': c.consultation_date,
        'symptoms': c.symptoms,
        'diagnosis': c.diagnosis,
        'notes': c.notes,
        'vital_bp': c.vital_bp,
        'vital_heart_rate': c.vital_heart_rate,
        'vital_temperature': c.vital_temperature,
        'vital_weight': c.vital_weight,
        'vital_spo2': c.vital_spo2,
        'follow_up_date': c.follow_up_date,
        'status': c.status,
    }


@router.post('/', response_model=ConsultationResponse, status_code=201)
def create_consultation(
    request: ConsultationCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    doctor = db.query(Doctor).filter(Doctor.id == request.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail='Doctor not found')

    # If linked to an appointment, verify and mark appointment as Completed
    if request.appointment_id:
        appointment = db.query(Appointment).filter(Appointment.id == request.appointment_id).first()
        if appointment:
            appointment.status = 'Completed'

    new_consultation = Consultation(**request.model_dump())
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    # Record Audit Event
    log_activity(
        db=db,
        user_name=doctor.full_name,
        user_role="Doctor",
        action="Completed Consultation",
        resource=f"Consultation #{new_consultation.id} ({patient.full_name})",
        details=f"Recorded diagnosis '{new_consultation.diagnosis}' for patient {patient.full_name} ({patient.patient_id}).",
    )

    return enrich_consultation(new_consultation, db)


@router.get('/', response_model=List[ConsultationResponse])
def list_consultations(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Consultation)
    if patient_id:
        query = query.filter(Consultation.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Consultation.doctor_id == doctor_id)

    consultations = query.order_by(Consultation.consultation_date.desc(), Consultation.id.desc()).all()
    return [enrich_consultation(c, db) for c in consultations]


@router.get('/{consultation_id}', response_model=ConsultationResponse)
def get_consultation(
    consultation_id: int,
    db: Session = Depends(get_db)
):
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail='Consultation not found')
    return enrich_consultation(c, db)


@router.put('/{consultation_id}', response_model=ConsultationResponse)
def update_consultation(
    consultation_id: int,
    request: ConsultationUpdate,
    db: Session = Depends(get_db)
):
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail='Consultation not found')

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(c, key, value)

    db.commit()
    db.refresh(c)
    return enrich_consultation(c, db)


@router.get('/patient/{patient_id}', response_model=List[ConsultationResponse])
def get_patient_consultations(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id
    ).order_by(Consultation.consultation_date.desc(), Consultation.id.desc()).all()

    return [enrich_consultation(c, db) for c in consultations]