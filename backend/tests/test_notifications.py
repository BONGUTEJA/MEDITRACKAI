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
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw": err_body}

def run_tests():
    print("=" * 60)
    print(" MediTrack: Appointment & Tablet Notification Tests")
    print("=" * 60)

    # 1. Register test patient
    uid = uuid.uuid4().hex[:6]
    status, reg_res = request("POST", "/patients/auth/register", {
        "full_name": f"Notification Test Patient {uid}",
        "age": 28,
        "gender": "Female",
        "date_of_birth": "1996-03-12",
        "phone": f"988{uid}",
        "email": f"notif_test_{uid}@test.com",
        "password": "password123"
    })
    assert status == 201, f"Failed patient reg: {reg_res}"
    patient_id = reg_res["patient"]["id"]
    print(f" [PASS] 1. Created Test Patient (ID: {patient_id})")

    # 2. Get active doctors
    status, doctors = request("GET", "/doctors/")
    assert status == 200 and len(doctors) > 0
    doc_id = doctors[0]["id"]

    # 3. Book an appointment -> verifies automatic appointment notification
    status, slots_res = request("GET", f"/appointments/available-slots/{doc_id}?appointment_date=2026-09-10")
    slot = slots_res["available_slots"][0] if slots_res.get("available_slots") else "11:00:00"
    status, appt_res = request("POST", "/appointments/", {
        "patient_id": patient_id,
        "doctor_id": doc_id,
        "appointment_date": "2026-09-10",
        "appointment_time": slot,
        "reason": "Routine health checkup"
    })
    assert status in (200, 201), f"Failed booking: {appt_res}"
    print(f" [PASS] 2. Booked Appointment on 2026-09-10 at {slot}")

    # 4. Issue a Digital Prescription -> verifies automatic tablet dose notifications
    status, pres_res = request("POST", "/prescriptions/", {
        "patient_id": patient_id,
        "doctor_id": doc_id,
        "issue_date": "2026-09-10",
        "general_instructions": "Drink plenty of water and complete the full antibiotic course.",
        "items": [
            {
                "medicine_name": "Amoxicillin 500mg",
                "dosage": "1 Capsule",
                "frequency": "1-0-1 (Morning & Night)",
                "duration": "5 Days",
                "instructions": "Take after meals"
            },
            {
                "medicine_name": "Paracetamol 650mg",
                "dosage": "1 Tablet",
                "frequency": "0-1-0 (Afternoon)",
                "duration": "3 Days",
                "instructions": "Take if fever persists"
            }
        ]
    })
    assert status == 201, f"Failed prescription creation: {pres_res}"
    print(f" [PASS] 3. Issued Digital Prescription with 2 Medicines (Morning, Afternoon, Night doses)")

    # 5. Fetch Patient Notifications
    status, notif_list = request("GET", f"/notifications/patient/{patient_id}")
    assert status == 200, f"Failed to get notifications: {notif_list}"
    notifs = notif_list["notifications"]
    print(f" [PASS] 4. Fetched Notifications Stream (Total: {notif_list['total_count']}, Unread: {notif_list['unread_count']})")
    assert notif_list["total_count"] >= 3, f"Expected at least 3 notifications, got {notif_list['total_count']}"

    # Verify types
    types = [n["notification_type"] for n in notifs]
    assert "appointment" in types, "Missing appointment notification"
    assert "medication" in types, "Missing medication tablet notification"

    # 6. Mark single notification as read
    first_id = notifs[0]["id"]
    status, read_res = request("PUT", f"/notifications/{first_id}/read")
    assert status == 200 and read_res["is_read"] is True
    print(f" [PASS] 5. Marked Notification #{first_id} as Read")

    # 7. Mark all notifications as read
    status, read_all_res = request("PUT", f"/notifications/patient/{patient_id}/read-all")
    assert status == 200
    status, fresh_list = request("GET", f"/notifications/patient/{patient_id}")
    assert fresh_list["unread_count"] == 0
    print(f" [PASS] 6. Marked All Notifications as Read (Unread count now: 0)")

    # 8. Test Smart Sync Reminders endpoint
    status, sync_res = request("POST", f"/notifications/sync-reminders/{patient_id}")
    assert status == 200
    print(f" [PASS] 7. Smart Reminder Sync Engine executed successfully")

    print("=" * 60)
    print(" ALL 7 NOTIFICATION & ALERT TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
