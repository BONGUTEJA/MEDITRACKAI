from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import date, time

from app.database import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.routers.audit_log import log_activity

from app.schemas.appointment import AppointmentCreate


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


# ---------------------------------
# BOOK APPOINTMENT
# ---------------------------------

@router.post("/")
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = db.query(Patient).filter(
        Patient.id == appointment.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Check doctor
    doctor = db.query(Doctor).filter(
        Doctor.id == appointment.doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # Check slot availability
    existing_appointment = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.appointment_time == appointment.appointment_time,
    ).first()

    if existing_appointment:
        if existing_appointment.status == "Booked":
            raise HTTPException(
                status_code=400,
                detail="This appointment slot is already booked"
            )
        # If the slot was previously cancelled, reuse and reactivate the appointment record
        existing_appointment.patient_id = appointment.patient_id
        existing_appointment.reason = appointment.reason
        existing_appointment.status = "Booked"
        db.commit()
        db.refresh(existing_appointment)

        # Create notification
        notif = Notification(
            patient_id=appointment.patient_id,
            title=f"📅 Appointment Confirmed: {appointment.appointment_date}",
            message=f"Consultation with {doctor.full_name} ({doctor.specialization}) confirmed for {appointment.appointment_date} at {appointment.appointment_time}.",
            notification_type="appointment",
            priority="high",
            is_read=False
        )
        db.add(notif)
        db.commit()

        return {
            "message": "Appointment booked successfully",
            "appointment": existing_appointment
        }

    # Create appointment
    new_appointment = Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        reason=appointment.reason,
        status="Booked"
    )

    try:
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)

        # Create confirmation notification
        notif = Notification(
            patient_id=appointment.patient_id,
            title=f"📅 Appointment Confirmed: {appointment.appointment_date}",
            message=f"Consultation with {doctor.full_name} ({doctor.specialization}) confirmed for {appointment.appointment_date} at {appointment.appointment_time}.",
            notification_type="appointment",
            priority="high",
            is_read=False
        )
        db.add(notif)
        db.commit()

        # Record Audit Event
        log_activity(
            db=db,
            user_name=patient.full_name,
            user_role="Patient",
            action="Booked Appointment",
            resource=f"Appointment #{new_appointment.id}",
            details=f"Booked clinical slot with {doctor.full_name} ({doctor.specialization}) for {appointment.appointment_date} at {appointment.appointment_time}.",
        )

        return {
            "message": "Appointment booked successfully",
            "appointment": new_appointment
        }

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="This appointment slot is already booked"
        )



# ---------------------------------
# GET ALL APPOINTMENTS
# ---------------------------------

@router.get("/")
def get_appointments(
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).all()

    result = []
    for appt in appointments:
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        result.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "patient_name": patient.full_name if patient else "Patient",
            "patient_identifier": patient.patient_id if patient else "",
            "doctor_id": appt.doctor_id,
            "doctor_name": doctor.full_name if doctor else "Doctor",
            "doctor_specialization": doctor.specialization if doctor else "General",
            "appointment_date": str(appt.appointment_date),
            "appointment_time": str(appt.appointment_time)[:5],
            "status": appt.status,
            "reason": appt.reason,
        })

    return result


@router.get("/available-slots/{doctor_id}")
def get_available_slots(
    doctor_id: int,
    appointment_date: date,
    db: Session = Depends(get_db)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    standard_slots = [time(hour=hour) for hour in range(9, 17)]
    booked_slots = {
        appointment.appointment_time
        for appointment in db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status == "Booked"
        ).all()
    }

    return {
        "doctor_id": doctor_id,
        "appointment_date": appointment_date,
        "available_slots": [
            slot.strftime("%H:%M")
            for slot in standard_slots
            if slot not in booked_slots
        ]
    }


# ---------------------------------
# GET PATIENT APPOINTMENT HISTORY
# ---------------------------------

@router.get("/patient/{patient_id}")
def get_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db)
):

    patient = db.query(Patient).filter(
        Patient.id == patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id
    ).order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).all()

    result = []
    for appt in appointments:
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        result.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "doctor_id": appt.doctor_id,
            "doctor_name": doctor.full_name if doctor else "Doctor",
            "doctor_specialization": doctor.specialization if doctor else "General",
            "appointment_date": str(appt.appointment_date),
            "appointment_time": str(appt.appointment_time)[:5],
            "status": appt.status,
            "reason": appt.reason,
        })

    return result


@router.get("/doctor/{doctor_id}")
def get_doctor_appointments(
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

    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id
    ).all()

    return appointments


# ---------------------------------
# CANCEL APPOINTMENT
# ---------------------------------

@router.put("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db)
):

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    if appointment.status == "Cancelled":
        raise HTTPException(
            status_code=400,
            detail="Appointment is already cancelled"
        )

    appointment.status = "Cancelled"

    db.commit()

    db.refresh(appointment)

    return {
        "message": "Appointment cancelled successfully",
        "appointment": appointment
    }
