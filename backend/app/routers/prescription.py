from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.consultation import Consultation
from app.models.prescription import Prescription, PrescriptionItem
from app.models.notification import Notification
from app.routers.audit_log import log_activity
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
)

router = APIRouter(
    prefix='/prescriptions',
    tags=['Prescriptions']
)


def enrich_prescription(prescription: Prescription, db: Session) -> PrescriptionResponse:
    items = db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id == prescription.id).all()
    patient = db.query(Patient).filter(Patient.id == prescription.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == prescription.doctor_id).first()

    return PrescriptionResponse(
        id=prescription.id,
        consultation_id=prescription.consultation_id,
        patient_id=prescription.patient_id,
        doctor_id=prescription.doctor_id,
        issue_date=prescription.issue_date,
        general_instructions=prescription.general_instructions,
        patient_name=patient.full_name if patient else None,
        patient_identifier=patient.patient_id if patient else None,
        doctor_name=doctor.full_name if doctor else None,
        doctor_specialization=doctor.specialization if doctor else None,
        items=items,
    )


@router.post('/', response_model=PrescriptionResponse, status_code=201)
def create_prescription(
    request: PrescriptionCreate,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    doctor = db.query(Doctor).filter(Doctor.id == request.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail='Doctor not found')

    if request.consultation_id:
        consultation = db.query(Consultation).filter(Consultation.id == request.consultation_id).first()
        if not consultation:
            raise HTTPException(status_code=404, detail='Consultation not found')

    new_prescription = Prescription(
        consultation_id=request.consultation_id,
        patient_id=request.patient_id,
        doctor_id=request.doctor_id,
        issue_date=request.issue_date,
        general_instructions=request.general_instructions,
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    # Add medication items & tablet notifications
    for item_data in request.items:
        item = PrescriptionItem(
            prescription_id=new_prescription.id,
            medicine_name=item_data.medicine_name,
            dosage=item_data.dosage,
            frequency=item_data.frequency,
            duration=item_data.duration,
            instructions=item_data.instructions,
        )
        db.add(item)

        # Create scheduled tablet reminders
        freq = (item_data.frequency or "").lower()
        times_to_alert = []
        if "1-0-1" in freq or ("morning" in freq and "night" in freq) or "twice daily" in freq:
            times_to_alert = ["Morning ☀️ (8:00 AM)", "Night 🌙 (8:00 PM)"]
        elif "1-1-1" in freq or "thrice daily" in freq or "every 8 hours" in freq:
            times_to_alert = ["Morning ☀️ (8:00 AM)", "Afternoon 🌤️ (1:00 PM)", "Night 🌙 (8:00 PM)"]
        elif "0-1-0" in freq or "afternoon" in freq:
            times_to_alert = ["Afternoon 🌤️ (1:00 PM)"]
        elif "0-0-1" in freq or "night" in freq or "before bed" in freq:
            times_to_alert = ["Night 🌙 (8:00 PM)"]
        elif "1-0-0" in freq or "morning" in freq or "once daily" in freq:
            times_to_alert = ["Morning ☀️ (8:00 AM)"]
        else:
            times_to_alert = ["Daily Dose (Morning ☀️)"]

        for dose_slot in times_to_alert:
            db.add(Notification(
                patient_id=request.patient_id,
                title=f"💊 Tablet Reminder: {item_data.medicine_name} ({item_data.dosage})",
                message=f"Take for {dose_slot}. Dosage: {item_data.dosage} - {item_data.instructions or 'Take as prescribed by doctor.'}",
                notification_type="medication",
                priority="high",
                dosage_time=dose_slot,
                medicine_name=item_data.medicine_name,
                is_read=False
            ))

    db.commit()
    db.refresh(new_prescription)

    # Record Audit Event
    med_names = ", ".join([it.medicine_name for it in request.items])
    log_activity(
        db=db,
        user_name=doctor.full_name,
        user_role="Doctor",
        action="Issued Digital Prescription",
        resource=f"Rx #{new_prescription.id} ({patient.full_name})",
        details=f"Prescribed medications ({med_names}) for patient {patient.full_name} ({patient.patient_id}).",
    )

    return enrich_prescription(new_prescription, db)


@router.get('/', response_model=List[PrescriptionResponse])
def list_prescriptions(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Prescription)
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)

    prescriptions = query.order_by(Prescription.issue_date.desc(), Prescription.id.desc()).all()
    return [enrich_prescription(p, db) for p in prescriptions]


@router.get('/{prescription_id}', response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db)
):
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail='Prescription not found')
    return enrich_prescription(p, db)


@router.get('/patient/{patient_id}', response_model=List[PrescriptionResponse])
def get_patient_prescriptions(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')

    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    ).order_by(Prescription.issue_date.desc(), Prescription.id.desc()).all()

    return [enrich_prescription(p, db) for p in prescriptions]


@router.get('/consultation/{consultation_id}', response_model=List[PrescriptionResponse])
def get_consultation_prescriptions(
    consultation_id: int,
    db: Session = Depends(get_db)
):
    prescriptions = db.query(Prescription).filter(
        Prescription.consultation_id == consultation_id
    ).all()
    return [enrich_prescription(p, db) for p in prescriptions]