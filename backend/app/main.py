from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, ensure_user_profile_columns
from app.models import Appointment, Doctor, Patient, PatientProfile, User, Consultation, Prescription, PrescriptionItem, Notification, AuditLog
from app.routers import appointment, auth, doctor, patient, patient_profile, consultation, prescription, notification, audit_log, analytics


Base.metadata.create_all(bind=engine)
ensure_user_profile_columns()


app = FastAPI(
    title="MediTrack API",
    description="Integrated Patient Care Management System - Milestones 1, 2, 3 & 4",
    version="3.0.0"
)


# Allow React Native / Expo frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(patient_profile.router)
app.include_router(doctor.router)
app.include_router(appointment.router)
app.include_router(consultation.router)
app.include_router(prescription.router)
app.include_router(notification.router)
app.include_router(audit_log.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "message": "MediTrack Backend is running (Milestones 1, 2, 3 & 4 Complete)"
    }

