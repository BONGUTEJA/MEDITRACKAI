from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.patient import Patient
from app.schemas.patient import (
    PatientAuthResponse,
    PatientCreate,
    PatientLogin,
    PatientRegister,
    PatientResponse,
    PatientUpdate,
    PatientForgotPassword,
)
from app.utils.security import get_password_hash, verify_password
from app.routers.audit_log import log_activity

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/auth/register", response_model=PatientAuthResponse, status_code=status.HTTP_201_CREATED)
def register_patient_portal(request: PatientRegister, db: Session = Depends(get_db)):
    clean_email = str(request.email).strip().lower()
    clean_phone = request.phone.strip()

    if db.query(Patient).filter(Patient.phone == clean_phone).first():
        raise HTTPException(status_code=400, detail="A patient with this phone number is already registered")
    if db.query(Patient).filter(Patient.email == clean_email).first():
        raise HTTPException(status_code=400, detail="A patient with this email is already registered")

    last_patient = db.query(Patient).order_by(Patient.id.desc()).first()
    patient_id = f"{(last_patient.id if last_patient else 0) + 1:03d}"

    patient = Patient(
        patient_id=patient_id,
        full_name=request.full_name.strip(),
        date_of_birth=request.date_of_birth,
        age=request.age,
        gender=request.gender.strip(),
        phone=clean_phone,
        email=clean_email,
        address=request.address.strip() if request.address else None,
        password_hash=get_password_hash(request.password),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_activity(
        db=db,
        user_name=patient.full_name,
        user_role="Patient",
        action="Patient Portal Registration",
        resource=f"Patient {patient.full_name} ({patient.patient_id})",
        details=f"Patient self-registered on portal with email {clean_email}.",
    )

    return {
        "message": "Patient registered successfully",
        "patient": patient,
    }


@router.post("/auth/login", response_model=PatientAuthResponse)
def login_patient_portal(request: PatientLogin, db: Session = Depends(get_db)):
    identifier = request.email_or_id.strip()
    
    # Try finding patient by email or sequential patient_id (case insensitive)
    patient = (
        db.query(Patient)
        .filter(
            (Patient.email.ilike(identifier))
            | (Patient.patient_id.ilike(identifier))
            | (Patient.phone == identifier)
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No patient account found with this Email or Patient ID",
        )

    if not patient.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is not set for this patient. Please register your account on the Patient Portal.",
        )

    if not verify_password(request.password, patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    log_activity(
        db=db,
        user_name=patient.full_name,
        user_role="Patient",
        action="Patient Login",
        resource=f"Portal Session ({patient.patient_id})",
        details="Patient authenticated successfully into patient portal.",
    )

    return {
        "message": "Login successful",
        "patient": patient,
    }


@router.post("/auth/forgot-password")
def forgot_password_patient(request: PatientForgotPassword, db: Session = Depends(get_db)):
    identifier = request.email_or_id.strip()
    patient = (
        db.query(Patient)
        .filter(
            (Patient.email.ilike(identifier))
            | (Patient.patient_id.ilike(identifier))
            | (Patient.phone == identifier)
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient account found with this Email or Patient ID",
        )

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long",
        )

    patient.password_hash = get_password_hash(request.new_password)
    db.commit()

    return {
        "message": "Password reset successfully. You can now log in with your new password.",
        "patient_id": patient.patient_id,
    }



@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(request: PatientCreate, db: Session = Depends(get_db)):
    if db.query(Patient).filter(Patient.phone == request.phone).first():
        raise HTTPException(status_code=400, detail="Patient with this phone number already exists")
    if request.email and db.query(Patient).filter(Patient.email == request.email).first():
        raise HTTPException(status_code=400, detail="Patient with this email already exists")

    last_patient = db.query(Patient).order_by(Patient.id.desc()).first()
    patient_id = f"{(last_patient.id if last_patient else 0) + 1:03d}"
    patient = Patient(patient_id=patient_id, **request.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_activity(
        db=db,
        user_name="Medical Admin",
        user_role="Administrator",
        action="Registered Patient",
        resource=f"Patient {patient.full_name} ({patient.patient_id})",
        details=f"Onboarded patient {patient.full_name}, Age: {patient.age}, Gender: {patient.gender}, Phone: {patient.phone}.",
    )

    return patient


@router.get("/", response_model=list[PatientResponse])
def list_patients(search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Patient)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Patient.full_name.ilike(term)
            | Patient.patient_id.ilike(term)
            | Patient.phone.ilike(term)
        )
    return query.order_by(Patient.id.desc()).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: str, request: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = request.model_dump(exclude_unset=True)
    if "phone" in update_data and db.query(Patient).filter(
        Patient.phone == update_data["phone"], Patient.id != patient.id
    ).first():
        raise HTTPException(status_code=400, detail="Patient with this phone number already exists")
    if "email" in update_data and update_data["email"] and db.query(Patient).filter(
        Patient.email == update_data["email"], Patient.id != patient.id
    ).first():
        raise HTTPException(status_code=400, detail="Patient with this email already exists")

    for field, value in update_data.items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    # Support lookup by sequential patient_id (e.g. "008") or integer id
    patient = (
        db.query(Patient)
        .filter(
            (Patient.patient_id == patient_id)
            | (Patient.id == (int(patient_id) if patient_id.isdigit() else -1))
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from app.models.appointment import Appointment
    from app.models.consultation import Consultation
    from app.models.prescription import Prescription, PrescriptionItem
    from app.models.patient_profile import PatientProfile
    from app.models.notification import Notification

    # Find all consultations and appointments belonging to this patient
    patient_consults = db.query(Consultation).filter(Consultation.patient_id == patient.id).all()
    patient_consult_ids = [c.id for c in patient_consults]

    patient_appts = db.query(Appointment).filter(Appointment.patient_id == patient.id).all()
    patient_appt_ids = [a.id for a in patient_appts]

    # 1. Delete notifications
    db.query(Notification).filter(Notification.patient_id == patient.id).delete(synchronize_session=False)

    # 2. Delete prescription items & prescriptions
    if patient_consult_ids:
        pres_query = db.query(Prescription).filter(
            (Prescription.patient_id == patient.id) | (Prescription.consultation_id.in_(patient_consult_ids))
        )
    else:
        pres_query = db.query(Prescription).filter(Prescription.patient_id == patient.id)

    prescriptions = pres_query.all()
    pres_ids = [p.id for p in prescriptions]
    if pres_ids:
        db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id.in_(pres_ids)).delete(synchronize_session=False)
    
    for p in prescriptions:
        db.delete(p)
    db.flush()

    # 3. Disconnect consultations from appointments to clear foreign key constraints
    if patient_appt_ids:
        db.query(Consultation).filter(Consultation.appointment_id.in_(patient_appt_ids)).update(
            {"appointment_id": None}, synchronize_session=False
        )
        db.flush()

    # 4. Delete consultations of this patient
    db.query(Consultation).filter(Consultation.patient_id == patient.id).delete(synchronize_session=False)
    db.flush()

    # 5. Delete appointments of this patient
    db.query(Appointment).filter(Appointment.patient_id == patient.id).delete(synchronize_session=False)
    db.flush()

    # 6. Delete patient profile
    db.query(PatientProfile).filter(PatientProfile.patient_id == patient.id).delete(synchronize_session=False)
    db.flush()

    pat_name = patient.full_name
    pat_id = patient.patient_id

    # 7. Delete patient
    db.delete(patient)
    db.commit()

    log_activity(
        db=db,
        user_name="Medical Admin",
        user_role="Administrator",
        action="Deleted Patient Record",
        resource=f"Patient {pat_name} ({pat_id})",
        details=f"Permanently purged medical records and EHR dossier for {pat_name} (ID: {pat_id}).",
    )

    return {
        "message": f"Patient {pat_name} (ID: {pat_id}) and all associated records deleted successfully",
        "deleted_patient_id": pat_id,
    }


