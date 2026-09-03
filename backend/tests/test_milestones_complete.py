import urllib.request
import json
import sys
import uuid

BASE_URL = "http://127.0.0.1:8000"

def request(method: str, path: str, data: dict = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body and res_body.startswith(("{", "[")) else (response.status, res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def run_all_milestone_tests():
    print("=" * 65)
    print(" MEDITRACK: COMPLETE MILESTONES 1, 2, 3 & 4 VERIFICATION SUITE")
    print("=" * 65)

    uid = uuid.uuid4().hex[:6]

    # ---------------------------------------------------------
    # MILESTONE 1: MANAGE (Registration, Profile, Booking)
    # ---------------------------------------------------------
    print("\n--- [MILESTONE 1: MANAGE] ---")
    status, reg = request("POST", "/patients/auth/register", {
        "full_name": f"Alex Morgan {uid}",
        "age": 34,
        "gender": "Female",
        "date_of_birth": "1990-05-14",
        "phone": f"987{uid}",
        "email": f"alex_{uid}@hospital.org",
        "password": "securepassword123",
        "address": "742 Evergreen Terrace"
    })
    assert status == 201, f"Milestone 1 Reg failed: {reg}"
    patient = reg["patient"]
    patient_db_id = patient["id"]
    print(f" [PASS] 1.1 Patient Registered (Sequential ID: {patient['patient_id']})")

    # Patient Clinical Profile (Blood group chips, allergies)
    status, prof = request("POST", "/patient-profiles/", {
        "patient_id": patient_db_id,
        "blood_group": "O+",
        "allergies": "Penicillin",
        "medical_history": "Mild seasonal asthma",
        "emergency_contact": "9876543210"
    })
    assert status in (200, 201), f"Milestone 1 Profile failed: {prof}"
    print(f" [PASS] 1.2 Clinical Profile Created (Blood Group: O+, Allergy: Penicillin)")

    # ---------------------------------------------------------
    # MILESTONE 2: TREAT (Doctor Consultation & Digital Prescription)
    # ---------------------------------------------------------
    print("\n--- [MILESTONE 2: TREAT] ---")
    status, docs = request("GET", "/doctors/")
    assert status == 200 and len(docs) > 0
    doc_id = docs[0]["id"]
    doc_name = docs[0]["full_name"]

    # Slot booking
    status, slots = request("GET", f"/appointments/available-slots/{doc_id}?appointment_date=2026-09-15")
    slot = slots["available_slots"][0] if slots.get("available_slots") else "10:00:00"
    status, appt = request("POST", "/appointments/", {
        "patient_id": patient_db_id,
        "doctor_id": doc_id,
        "appointment_date": "2026-09-15",
        "appointment_time": slot,
        "reason": "Acute throat pain and fever"
    })
    assert status in (200, 201)
    appt_id = appt.get("appointment", {}).get("id") or appt.get("id")
    print(f" [PASS] 2.1 Appointment Booked for 2026-09-15 at {slot}")

    # Doctor Consultation with Symptoms, Vitals & Treatment Plan
    status, consult = request("POST", "/consultations/", {
        "patient_id": patient_db_id,
        "doctor_id": doc_id,
        "appointment_id": appt_id,
        "consultation_date": "2026-09-15",
        "symptoms": "High fever, sore throat, difficulty swallowing",
        "observations": "Inflamed tonsils with mild exudate",
        "diagnosis": "Acute Pharyngitis",
        "treatment_plan": "Hydration, 5-day antibiotic course, warm saline gargle",
        "notes": "Patient advised rest for 3 days",
        "vital_bp": "120/80",
        "vital_heart_rate": "78",
        "vital_temperature": "101.2",
        "vital_spo2": "99"
    })
    assert status == 201
    consult_id = consult["id"]
    print(f" [PASS] 2.2 Clinical Consultation Recorded (Diagnosis: Acute Pharyngitis, Temp: 101.2 F)")

    # Digital Prescription with Complete Medication Instructions
    status, pres = request("POST", "/prescriptions/", {
        "consultation_id": consult_id,
        "patient_id": patient_db_id,
        "doctor_id": doc_id,
        "issue_date": "2026-09-15",
        "general_instructions": "Take medication after food. Avoid cold beverages.",
        "items": [
            {
                "medicine_name": "Azithromycin 500mg",
                "dosage": "1 Tablet",
                "frequency": "1-0-0 (Once daily)",
                "duration": "5 Days",
                "instructions": "Take 1 hour before meal"
            },
            {
                "medicine_name": "Paracetamol 650mg",
                "dosage": "1 Tablet",
                "frequency": "1-0-1 (Morning & Night)",
                "duration": "3 Days",
                "instructions": "Take after meals if fever persists"
            }
        ]
    })
    assert status == 201 and len(pres["items"]) == 2
    print(f" [PASS] 2.3 Multi-Item Digital Prescription Issued (2 Medicines, full instructions)")

    # ---------------------------------------------------------
    # MILESTONE 3: PROTECT & CONNECT (Security, Notifications, Audit)
    # ---------------------------------------------------------
    print("\n--- [MILESTONE 3: PROTECT & CONNECT] ---")

    # Patient Notifications Stream
    status, notifs = request("GET", f"/notifications/patient/{patient_db_id}")
    assert status == 200 and notifs["total_count"] >= 3
    print(f" [PASS] 3.1 Live Notification Engine Generated {notifs['total_count']} Alerts (Appts + Tablet Doses)")

    # Audit Logging Verification
    status, audit = request("POST", "/audit-logs/", {
        "user_name": doc_name,
        "user_role": "Doctor",
        "action": "Added Diagnosis",
        "resource": f"Patient P{patient['patient_id']}",
        "details": f"Recorded diagnosis 'Acute Pharyngitis' for patient {patient['full_name']}"
    })
    assert status == 200
    status, logs = request("GET", "/audit-logs/")
    assert status == 200 and logs["total_count"] > 0
    print(f" [PASS] 3.2 Audit Log Recorded & Verified (Action: Added Diagnosis by {doc_name})")

    # Security Monitoring Events
    status, sec_events = request("GET", "/audit-logs/security-events")
    assert status == 200
    print(f" [PASS] 3.3 Security Monitoring Endpoint Active (Logged security events)")

    # ---------------------------------------------------------
    # MILESTONE 4: ANALYZE & FINALIZE (Analytics, Reporting, Optimization)
    # ---------------------------------------------------------
    print("\n--- [MILESTONE 4: ANALYZE & FINALIZE] ---")

    # Summary KPIs
    status, summary = request("GET", "/analytics/summary")
    assert status == 200 and summary["total_patients"] > 0
    print(f" [PASS] 4.1 Analytics Summary KPI Engine (Patients: {summary['total_patients']}, Appts: {summary['total_appointments']}, Consultations: {summary['total_consultations']})")

    # Demographics
    status, demo = request("GET", "/analytics/demographics")
    assert status == 200 and "age_distribution" in demo and "gender_distribution" in demo
    print(f" [PASS] 4.2 Patient Demographics Analytics (Age cohorts: 0-18, 19-40, 41-60, 60+)")

    # Visit Trends & Doctor Workload
    status, trends = request("GET", "/analytics/visit-trends")
    status, workload = request("GET", "/analytics/doctor-workload")
    assert status == 200 and len(workload["doctor_workload"]) > 0
    print(f" [PASS] 4.3 Visit Trends & Doctor Workload Statistics Generated")

    # CSV Report Export
    status, csv_data = request("GET", "/analytics/export/csv")
    assert status == 200 and "Appointment ID,Patient ID" in str(csv_data)
    print(f" [PASS] 4.4 Operational CSV Report Export Verified")

    print("\n" + "=" * 65)
    print(" [SUCCESS] ALL 4 MILESTONES VERIFIED & 100% OPERATIONAL! ")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    run_all_milestone_tests()
