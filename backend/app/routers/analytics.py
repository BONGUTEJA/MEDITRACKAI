from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from typing import Optional
import csv
import io

from app.database import get_db
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.consultation import Consultation
from app.models.prescription import Prescription

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & Reporting"]
)


def get_cutoff_date(days: Optional[int]):
    if days and days > 0:
        return date.today() - timedelta(days=days)
    return None


# 1. SUMMARY DASHBOARD KPIS
@router.get("/summary")
def get_analytics_summary(
    days: Optional[int] = Query(None, description="Filter metrics by past N days"),
    db: Session = Depends(get_db)
):
    cutoff = get_cutoff_date(days)
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()

    today_str = date.today().isoformat()
    today_appointments = db.query(Appointment).filter(
        Appointment.appointment_date == today_str
    ).count()

    if cutoff:
        total_appointments = db.query(Appointment).filter(Appointment.appointment_date >= cutoff).count()
        completed_appointments = db.query(Appointment).filter(
            Appointment.status == "Completed",
            Appointment.appointment_date >= cutoff
        ).count()
        cancelled_appointments = db.query(Appointment).filter(
            Appointment.status == "Cancelled",
            Appointment.appointment_date >= cutoff
        ).count()
        pending_appointments = db.query(Appointment).filter(
            Appointment.status == "Booked",
            Appointment.appointment_date >= cutoff
        ).count()
        total_consultations = db.query(Consultation).filter(Consultation.consultation_date >= cutoff).count()
        total_prescriptions = db.query(Prescription).filter(Prescription.issue_date >= cutoff).count()
    else:
        total_appointments = db.query(Appointment).count()
        completed_appointments = db.query(Appointment).filter(Appointment.status == "Completed").count()
        cancelled_appointments = db.query(Appointment).filter(Appointment.status == "Cancelled").count()
        pending_appointments = db.query(Appointment).filter(Appointment.status == "Booked").count()
        total_consultations = db.query(Consultation).count()
        total_prescriptions = db.query(Prescription).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "total_consultations": total_consultations,
        "total_prescriptions": total_prescriptions,
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "pending_appointments": pending_appointments,
    }


# 2. PATIENT DEMOGRAPHICS ANALYTICS
@router.get("/demographics")
def get_patient_demographics(
    days: Optional[int] = Query(None, description="Filter demographics by past N days"),
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).all()
    total = len(patients)

    # Age Groups: 0-18, 19-40, 41-60, 60+
    age_0_18 = sum(1 for p in patients if (p.age or 0) <= 18)
    age_19_40 = sum(1 for p in patients if 19 <= (p.age or 0) <= 40)
    age_41_60 = sum(1 for p in patients if 41 <= (p.age or 0) <= 60)
    age_60_plus = sum(1 for p in patients if (p.age or 0) > 60)

    # Gender breakdown
    male_count = sum(1 for p in patients if (p.gender or "").lower() == "male")
    female_count = sum(1 for p in patients if (p.gender or "").lower() == "female")
    other_gender = total - male_count - female_count

    return {
        "total_patients": total,
        "age_distribution": {
            "0-18": age_0_18,
            "19-40": age_19_40,
            "41-60": age_41_60,
            "60+": age_60_plus,
        },
        "gender_distribution": {
            "Male": male_count,
            "Female": female_count,
            "Other": other_gender,
        }
    }


# 3. VISIT TRENDS BY DAY OF WEEK
@router.get("/visit-trends")
def get_visit_trends(
    days: Optional[int] = Query(None, description="Filter trends by past N days"),
    db: Session = Depends(get_db)
):
    cutoff = get_cutoff_date(days)
    if cutoff:
        appointments = db.query(Appointment).filter(Appointment.appointment_date >= cutoff).all()
    else:
        appointments = db.query(Appointment).all()

    day_counts = {
        "Monday": 0, "Tuesday": 0, "Wednesday": 0,
        "Thursday": 0, "Friday": 0, "Saturday": 0, "Sunday": 0
    }
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for appt in appointments:
        if appt.appointment_date:
            try:
                # Parse date object or string
                d = appt.appointment_date if isinstance(appt.appointment_date, date) else date.fromisoformat(str(appt.appointment_date)[:10])
                day_name = day_names[d.weekday()]
                day_counts[day_name] += 1
            except Exception:
                pass

    return {
        "visit_trends": day_counts
    }


# 4. DOCTOR WORKLOAD ANALYTICS
@router.get("/doctor-workload")
def get_doctor_workload(
    days: Optional[int] = Query(None, description="Filter workload by past N days"),
    db: Session = Depends(get_db)
):
    cutoff = get_cutoff_date(days)
    doctors = db.query(Doctor).all()
    workload = []

    for doc in doctors:
        if cutoff:
            consults_count = db.query(Consultation).filter(
                Consultation.doctor_id == doc.id,
                Consultation.consultation_date >= cutoff
            ).count()
            appts_count = db.query(Appointment).filter(
                Appointment.doctor_id == doc.id,
                Appointment.appointment_date >= cutoff
            ).count()
        else:
            consults_count = db.query(Consultation).filter(Consultation.doctor_id == doc.id).count()
            appts_count = db.query(Appointment).filter(Appointment.doctor_id == doc.id).count()

        workload.append({
            "doctor_id": doc.id,
            "doctor_name": doc.full_name,
            "specialization": doc.specialization,
            "consultations_count": consults_count,
            "appointments_count": appts_count
        })

    return {
        "doctor_workload": sorted(workload, key=lambda x: x["consultations_count"], reverse=True)
    }


# 5. CSV REPORT EXPORT
@router.get("/export/csv")
def export_csv_report(db: Session = Depends(get_db)):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    # Write Header
    writer.writerow(["Appointment ID", "Patient ID", "Patient Name", "Doctor Name", "Specialization", "Date", "Time", "Status", "Reason"])

    for appt in appointments:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()

        writer.writerow([
            appt.id,
            patient.patient_id if patient else "",
            patient.full_name if patient else "Unknown",
            doctor.full_name if doctor else "Unknown",
            doctor.specialization if doctor else "",
            str(appt.appointment_date),
            str(appt.appointment_time),
            appt.status,
            appt.reason or ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=meditrack_appointments_report_{date.today().isoformat()}.csv"}
    )
