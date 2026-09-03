from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List

from app.database import get_db
from app.models.notification import Notification
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.prescription import Prescription, PrescriptionItem
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationListResponse

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

# 1. GET NOTIFICATIONS FOR A PATIENT
@router.get("/patient/{patient_id}", response_model=NotificationListResponse)
def get_patient_notifications(
    patient_id: int,
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.patient_id == patient_id
    ).order_by(Notification.created_at.desc()).all()

    unread_count = sum(1 for n in notifications if not n.is_read)

    return {
        "unread_count": unread_count,
        "total_count": len(notifications),
        "notifications": notifications
    }


# 2. GET CLINICAL STAFF NOTIFICATIONS
@router.get("/staff/", response_model=NotificationListResponse)
def get_staff_notifications(
    db: Session = Depends(get_db)
):
    # Retrieve system & staff notifications
    notifications = db.query(Notification).filter(
        Notification.patient_id == None
    ).order_by(Notification.created_at.desc()).all()

    unread_count = sum(1 for n in notifications if not n.is_read)

    return {
        "unread_count": unread_count,
        "total_count": len(notifications),
        "notifications": notifications
    }


# 3. CREATE MANUAL NOTIFICATION
@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db)
):
    new_notif = Notification(
        patient_id=notification_data.patient_id,
        title=notification_data.title,
        message=notification_data.message,
        notification_type=notification_data.notification_type,
        priority=notification_data.priority,
        dosage_time=notification_data.dosage_time,
        medicine_name=notification_data.medicine_name,
        is_read=False
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif


# 4. MARK NOTIFICATION AS READ
@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


# 5. MARK ALL NOTIFICATIONS AS READ FOR PATIENT
@router.put("/patient/{patient_id}/read-all")
def mark_all_read(
    patient_id: int,
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.patient_id == patient_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# 6. SMART REMINDER SYNC (Appointments + Tablet Medication Dosages)
@router.post("/sync-reminders/{patient_id}", response_model=NotificationListResponse)
def sync_patient_reminders(
    patient_id: int,
    db: Session = Depends(get_db)
):
    today = date.today()
    today_str = today.isoformat()

    # A. Check Upcoming Appointments
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status == "Booked"
    ).all()

    for appt in appointments:
        doc = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        doc_name = doc.full_name if doc else "Doctor"
        doc_spec = doc.specialization if doc else "Specialist"

        # Check if reminder already exists for this appointment
        appt_date_str = str(appt.appointment_date)
        time_str = str(appt.appointment_time)

        existing = db.query(Notification).filter(
            Notification.patient_id == patient_id,
            Notification.notification_type == "appointment",
            Notification.title.like(f"%{appt_date_str}%")
        ).first()

        if not existing:
            is_today = appt_date_str == today_str
            title = f"📅 Appointment Reminder: {appt_date_str}"
            msg = (
                f"You have a scheduled consultation today at {time_str} with {doc_name} ({doc_spec})."
                if is_today
                else f"Upcoming appointment on {appt_date_str} at {time_str} with {doc_name} ({doc_spec})."
            )
            notif = Notification(
                patient_id=patient_id,
                title=title,
                message=msg,
                notification_type="appointment",
                priority="high" if is_today else "medium",
                is_read=False
            )
            db.add(notif)

    # B. Check Active Digital Prescriptions for Tablet Reminders
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    ).order_by(Prescription.id.desc()).limit(5).all()

    for pres in prescriptions:
        items = db.query(PrescriptionItem).filter(
            PrescriptionItem.prescription_id == pres.id
        ).all()

        for item in items:
            med_name = item.medicine_name
            freq = (item.frequency or "").lower()
            dosage = item.dosage
            inst = item.instructions or "Take as directed"

            # Parse dosage times from frequency string (e.g. 1-0-1, Morning & Night, Once daily, Thrice daily)
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
                existing_med_notif = db.query(Notification).filter(
                    Notification.patient_id == patient_id,
                    Notification.notification_type == "medication",
                    Notification.medicine_name == med_name,
                    Notification.dosage_time == dose_slot
                ).first()

                if not existing_med_notif:
                    db.add(Notification(
                        patient_id=patient_id,
                        title=f"💊 Tablet Reminder: {med_name} ({dosage})",
                        message=f"Scheduled for {dose_slot}. Dosage: {dosage} - {inst}.",
                        notification_type="medication",
                        priority="high",
                        dosage_time=dose_slot,
                        medicine_name=med_name,
                        is_read=False
                    ))

    db.commit()

    # Return refreshed notifications
    all_notifs = db.query(Notification).filter(
        Notification.patient_id == patient_id
    ).order_by(Notification.created_at.desc()).all()

    unread_count = sum(1 for n in all_notifs if not n.is_read)

    return {
        "unread_count": unread_count,
        "total_count": len(all_notifs),
        "notifications": all_notifs
    }
