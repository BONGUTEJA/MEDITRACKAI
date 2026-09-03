import json
import urllib.request
import urllib.error
import sys

BASE_URL = 'http://127.0.0.1:8000'

def request(method, path, data=None):
    url = f'{BASE_URL}{path}'
    headers = {'Content-Type': 'application/json'}
    req_data = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode('utf-8'))
            return status, body
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode('utf-8')) if e.fp else {}
        return e.code, body


def run_all_tests():
    print('======================================================')
    print(' MediTrack Milestone 2: Consultation & Prescription API Tests')
    print('======================================================')
    passed = 0

    # 1. Test Server Root
    status, res = request('GET', '/')
    assert status == 200, f'Expected 200, got {status}'
    print(' [PASS] 1. Backend Server Root Health Check')
    passed += 1

    # Fetch existing patient and doctor
    _, patients = request('GET', '/patients/')
    _, doctors = request('GET', '/doctors/')
    assert len(patients) > 0, 'No patients found'
    assert len(doctors) > 0, 'No doctors found'
    test_patient = patients[0]
    test_doctor = doctors[0]
    print(f'   -> Testing with Patient ID: {test_patient["patient_id"]} ({test_patient["full_name"]}), Doctor: {test_doctor["full_name"]}')

    # 2. Test Consultation Creation with Vital Signs
    consultation_payload = {
        'patient_id': test_patient['id'],
        'doctor_id': test_doctor['id'],
        'consultation_date': '2026-08-25',
        'symptoms': 'Persistent sore throat, fever of 100.4 F, mild dry cough for 3 days',
        'diagnosis': 'Acute Viral Pharyngitis with upper respiratory tract irritation',
        'notes': 'Throat appears erythematous. Chest clear on auscultation. Advised warm saline gargles.',
        'vital_bp': '120/80 mmHg',
        'vital_heart_rate': 76,
        'vital_temperature': 99.8,
        'vital_weight': 68.5,
        'vital_spo2': 99,
        'follow_up_date': '2026-09-01',
        'status': 'Completed'
    }
    status, consultation_res = request('POST', '/consultations/', consultation_payload)
    assert status == 201, f'Expected 201, got {status}: {consultation_res}'
    assert consultation_res['id'] > 0
    assert consultation_res['diagnosis'] == consultation_payload['diagnosis']
    assert consultation_res['vital_bp'] == '120/80 mmHg'
    assert consultation_res['vital_spo2'] == 99
    consultation_id = consultation_res['id']
    print(f' [PASS] 2. Create Consultation with Full Clinical Vitals (Consultation ID: {consultation_id})')
    passed += 1

    # 3. Test Appointment Completion Flow
    appt_payload = {
        'patient_id': test_patient['id'],
        'doctor_id': test_doctor['id'],
        'appointment_date': '2026-08-29',
        'appointment_time': '14:00',
        'reason': 'Follow-up clinical assessment'
    }
    status, appt_res = request('POST', '/appointments/', appt_payload)
    assert status == 200, f'Expected 200 for appointment booking, got {status}: {appt_res}'
    appt_id = appt_res['appointment']['id']
    assert appt_res['appointment']['status'] == 'Booked'
    
    # Create consultation linked to appointment
    linked_consultation = {
        'appointment_id': appt_id,
        'patient_id': test_patient['id'],
        'doctor_id': test_doctor['id'],
        'consultation_date': '2026-08-29',
        'diagnosis': 'Routine follow-up normal examination',
        'notes': 'Patient recovering well',
        'status': 'Completed'
    }
    status, linked_res = request('POST', '/consultations/', linked_consultation)
    assert status == 201, f'Expected 201, got {status}'
    
    # Verify appointment status was updated to Completed
    _, all_appts = request('GET', f'/appointments/patient/{test_patient["id"]}')
    linked_appt = next((a for a in all_appts if a['id'] == appt_id), None)
    assert linked_appt is not None and linked_appt['status'] == 'Completed', f'Expected Completed, got {linked_appt}'
    print(f' [PASS] 3. Automatic Appointment Completion on Consultation Link (Appt ID: {appt_id} -> Status: Completed)')
    passed += 1

    # 4. Test Prescription Creation with Multi-Item Medications
    prescription_payload = {
        'consultation_id': consultation_id,
        'patient_id': test_patient['id'],
        'doctor_id': test_doctor['id'],
        'issue_date': '2026-08-25',
        'general_instructions': 'Take medicines strictly after meals. Drink at least 2.5 liters of water daily.',
        'items': [
            {
                'medicine_name': 'Amoxicillin 500mg',
                'dosage': '1 Capsule',
                'frequency': '1-0-1 (Twice Daily)',
                'duration': '5 Days',
                'instructions': 'Take after food with warm water'
            },
            {
                'medicine_name': 'Paracetamol 650mg',
                'dosage': '1 Tablet',
                'frequency': '1-1-1 (Thrice Daily SOS)',
                'duration': '3 Days',
                'instructions': 'Take if fever rises above 99.5 F'
            },
            {
               'medicine_name': 'Cetirizine 10mg',
                'dosage': '1 Tablet',
                'frequency': '0-0-1 (At Bedtime)',
                'duration': '5 Days',
                'instructions': 'May cause mild drowsiness'
            }
        ]
    }
    status, pres_res = request('POST', '/prescriptions/', prescription_payload)
    assert status == 201, f'Expected 201, got {status}: {pres_res}'
    assert pres_res['id'] > 0
    assert len(pres_res['items']) == 3
    assert pres_res['items'][0]['medicine_name'] == 'Amoxicillin 500mg'
    prescription_id = pres_res['id']
    print(f' [PASS] 4. Create Multi-Item Digital Prescription (Prescription ID: {prescription_id}, 3 Medications)')
    passed += 1

    # 5. Test Prescription Retrieval
    status, single_pres = request('GET', f'/prescriptions/{prescription_id}')
    assert status == 200
    assert single_pres['patient_name'] == test_patient['full_name']
    assert single_pres['doctor_name'] == test_doctor['full_name']
    assert len(single_pres['items']) == 3

    status, patient_prescriptions = request('GET', f'/prescriptions/patient/{test_patient["id"]}')
    assert status == 200
    assert any(p['id'] == prescription_id for p in patient_prescriptions)

    status, consultation_prescriptions = request('GET', f'/prescriptions/consultation/{consultation_id}')
    assert status == 200
    assert any(p['id'] == prescription_id for p in consultation_prescriptions)
    print(f' [PASS] 5. Prescription Retrieval (By Prescription ID, Patient History, & Consultation ID)')
    passed += 1

    # 6. Test Error Handling and 404 Validation
    status, _ = request('POST', '/consultations/', {'patient_id': 999999, 'doctor_id': 1, 'consultation_date': '2026-08-25', 'diagnosis': 'Test'})
    assert status == 404, f'Expected 404 for invalid patient, got {status}'

    status, _ = request('POST', '/prescriptions/', {'patient_id': 999999, 'doctor_id': 1, 'issue_date': '2026-08-25', 'items': []})
    assert status == 404, f'Expected 404 for invalid patient prescription, got {status}'

    status, _ = request('GET', '/consultations/999999')
    assert status == 404, f'Expected 404 for missing consultation, got {status}'

    status, _ = request('GET', '/prescriptions/999999')
    assert status == 404, f'Expected 404 for missing prescription, got {status}'
    print(' [PASS] 6. Error Handling & Relational Validation (404 on invalid IDs)')
    passed += 1

    print('======================================================')
    print(f' ALL {passed} MILESTONE 2 API TESTS PASSED SUCCESSFULLY! ')
    print('======================================================')

if __name__ == '__main__':
    run_all_tests()
