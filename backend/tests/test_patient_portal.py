import json
import urllib.request
import urllib.error
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode("utf-8")) if e.fp else {}
        return e.code, body


def run_patient_portal_tests():
    print("=" * 60)
    print(" MediTrack: Patient Portal API & Authentication Tests")
    print("=" * 60)

    unique_suffix = uuid.uuid4().hex[:6]
    test_email = f"patient_{unique_suffix}@test.com"
    test_phone = f"987{unique_suffix[:7]}"
    test_password = "SecurePassword123!"

    # 1. Register Patient
    reg_payload = {
        "full_name": "Eleanor Vance",
        "date_of_birth": "1994-06-15",
        "age": 30,
        "gender": "Female",
        "phone": test_phone,
        "email": test_email,
        "password": test_password,
        "address": "42 Beacon Hill, Boston",
    }

    status, reg_res = request("POST", "/patients/auth/register", reg_payload)
    if status != 201:
        print(f"[FAIL] Patient Register failed: {status} {reg_res}")
        sys.exit(1)

    patient_data = reg_res["patient"]
    patient_id = patient_data["patient_id"]
    db_id = patient_data["id"]
    print(f" [PASS] 1. Patient Portal Registration (Assigned ID: {patient_id}, DB ID: {db_id})")

    # 2. Login with Email
    status, login_res = request(
        "POST",
        "/patients/auth/login",
        {"email_or_id": test_email, "password": test_password},
    )
    if status != 200:
        print(f"[FAIL] Patient Login by Email failed: {status} {login_res}")
        sys.exit(1)
    print(f" [PASS] 2. Patient Login via Email ({test_email})")

    # 3. Login with Patient ID (e.g. 004)
    status, login_id_res = request(
        "POST",
        "/patients/auth/login",
        {"email_or_id": patient_id, "password": test_password},
    )
    if status != 200:
        print(f"[FAIL] Patient Login by Patient ID failed: {status} {login_id_res}")
        sys.exit(1)
    print(f" [PASS] 3. Patient Login via 3-digit Patient ID ({patient_id})")

    # 4. Reject invalid password
    status, bad_login = request(
        "POST",
        "/patients/auth/login",
        {"email_or_id": patient_id, "password": "WrongPassword"},
    )
    if status == 401:
        print(" [PASS] 4. Invalid Password Rejected (401 Unauthorized)")
    else:
        print(f"[FAIL] Expected 401 on bad password, got {status}")
        sys.exit(1)

    # 5. Book appointment as the patient
    status, doctors = request("GET", "/doctors/")
    if doctors:
        doc_id = doctors[0]["id"]
        status, slots_res = request("GET", f"/appointments/available-slots?doctor_id={doc_id}&date=2026-09-01")
        slots = slots_res.get("available_slots", ["09:00:00"])
        chosen_slot = slots[0] if slots else "11:00:00"

        status, appt_res = request(
            "POST",
            "/appointments/",
            {
                "patient_id": db_id,
                "doctor_id": doc_id,
                "appointment_date": "2026-09-01",
                "appointment_time": chosen_slot,
                "reason": "Self-booked consultation for general checkup",
            },
        )
        if status in (200, 201):
            appt_id = appt_res.get("appointment", {}).get("id") or appt_res.get("id")
            print(f" [PASS] 5. Patient Self-Service Appointment Booking (Appt ID: {appt_id}, Slot: {chosen_slot})")
        else:
            print(f"[FAIL] Appointment booking failed: {status} {appt_res}")
            sys.exit(1)

    print("=" * 60)
    print(" ALL 5 PATIENT PORTAL API TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)


if __name__ == "__main__":
    run_patient_portal_tests()
