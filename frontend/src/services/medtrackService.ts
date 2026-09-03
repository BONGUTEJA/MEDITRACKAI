import axios from "axios";

// On a physical device, replace this with your computer's LAN IP address.
export const API_URL = "http://127.0.0.1:8000";

const api = axios.create({ baseURL: API_URL });

export type PatientInput = {
  full_name: string;
  date_of_birth?: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
};

export type Patient = PatientInput & { id: number; patient_id: string };

export type PatientProfileInput = {
  blood_group?: string;
  allergies?: string;
  existing_diseases?: string;
  medical_history?: string;
  current_medications?: string;
  emergency_contact?: string;
  insurance_details?: string;
};

export type PatientProfile = PatientProfileInput & { id: number; patient_id: number };

export type Doctor = {
  id: number;
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
};

export type AppointmentInput = {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason?: string;
};

export const createPatient = async (data: PatientInput) =>
  (await api.post<Patient>("/patients/", data)).data;

export const getPatients = async (search?: string) =>
  (await api.get<Patient[]>("/patients/", { params: search ? { search } : undefined })).data;

export const getPatient = async (patientId: string) =>
  (await api.get<Patient>(`/patients/${patientId}`)).data;

export const updatePatient = async (patientId: string, data: Partial<PatientInput>) =>
  (await api.put<Patient>(`/patients/${patientId}`, data)).data;

export const deletePatient = async (patientId: string) =>
  (await api.delete(`/patients/${patientId}`)).data;

export const createPatientProfile = async (patientId: number, data: PatientProfileInput) =>
  (await api.post<PatientProfile>("/patient-profiles/", { patient_id: patientId, ...data })).data;

export const getPatientProfile = async (patientId: number) =>
  (await api.get<PatientProfile>(`/patient-profiles/${patientId}`)).data;

export const updatePatientProfile = async (patientId: number, data: PatientProfileInput) =>
  (await api.put<PatientProfile>(`/patient-profiles/${patientId}`, data)).data;

export type DoctorInput = {
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
};

export const getDoctors = async () => (await api.get<Doctor[]>("/doctors/")).data;
export const createDoctor = async (data: DoctorInput): Promise<Doctor> =>
  (await api.post<Doctor>("/doctors/", data)).data;
export const deleteDoctor = async (doctorId: number) =>
  (await api.delete(`/doctors/${doctorId}`)).data;

export const getAvailableSlots = async (doctorId: number, appointmentDate: string) =>
  (await api.get<{ available_slots: string[] }>(`/appointments/available-slots/${doctorId}`, {
    params: { appointment_date: appointmentDate },
  })).data;

export type AppointmentRecord = {
  id: number;
  patient_id: number;
  patient_name?: string;
  patient_identifier?: string;
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  appointment_date: string;
  appointment_time: string;
  status: "Booked" | "Cancelled" | "Completed" | string;
  reason?: string;
};

export const getAppointments = async (): Promise<AppointmentRecord[]> =>
  (await api.get<AppointmentRecord[]>("/appointments/")).data;

export const bookAppointment = async (data: AppointmentInput) =>
  (await api.post("/appointments/", data)).data;

export const getPatientAppointments = async (patientId: number): Promise<AppointmentRecord[]> =>
  (await api.get<AppointmentRecord[]>(`/appointments/patient/${patientId}`)).data;

export const cancelAppointment = async (appointmentId: number) =>
  (await api.put(`/appointments/${appointmentId}/cancel`)).data;

// ---------------------------------
// MILESTONE 2: CONSULTATIONS & PRESCRIPTIONS
// ---------------------------------

export type ConsultationInput = {
  appointment_id?: number;
  patient_id: number;
  doctor_id: number;
  consultation_date: string;
  symptoms?: string;
  diagnosis: string;
  notes?: string;
  vital_bp?: string;
  vital_heart_rate?: number;
  vital_temperature?: number;
  vital_weight?: number;
  vital_spo2?: number;
  follow_up_date?: string;
  status?: string;
};

export type Consultation = ConsultationInput & {
  id: number;
  patient_name?: string;
  patient_identifier?: string;
  doctor_name?: string;
  doctor_specialization?: string;
};

export type PrescriptionItemInput = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type PrescriptionItem = PrescriptionItemInput & {
  id: number;
  prescription_id: number;
};

export type PrescriptionInput = {
  consultation_id?: number;
  patient_id: number;
  doctor_id: number;
  issue_date: string;
  general_instructions?: string;
  items: PrescriptionItemInput[];
};

export type Prescription = {
  id: number;
  consultation_id?: number;
  patient_id: number;
  doctor_id: number;
  issue_date: string;
  general_instructions?: string;
  patient_name?: string;
  patient_identifier?: string;
  doctor_name?: string;
  doctor_specialization?: string;
  items: PrescriptionItem[];
};

export const createConsultation = async (data: ConsultationInput): Promise<Consultation> =>
  (await api.post<Consultation>("/consultations/", data)).data;

export const getConsultations = async (patientId?: number, doctorId?: number): Promise<Consultation[]> =>
  (await api.get<Consultation[]>("/consultations/", { params: { patient_id: patientId, doctor_id: doctorId } })).data;

export const getConsultation = async (id: number): Promise<Consultation> =>
  (await api.get<Consultation>(`/consultations/${id}`)).data;

export const getPatientConsultations = async (patientId: number): Promise<Consultation[]> =>
  (await api.get<Consultation[]>(`/consultations/patient/${patientId}`)).data;

export const createPrescription = async (data: PrescriptionInput): Promise<Prescription> =>
  (await api.post<Prescription>("/prescriptions/", data)).data;

export const getPrescription = async (id: number): Promise<Prescription> =>
  (await api.get<Prescription>(`/prescriptions/${id}`)).data;

export const getPatientPrescriptions = async (patientId: number): Promise<Prescription[]> =>
  (await api.get<Prescription[]>(`/prescriptions/patient/${patientId}`)).data;

export const getConsultationPrescriptions = async (consultationId: number): Promise<Prescription[]> =>
  (await api.get<Prescription[]>(`/prescriptions/consultation/${consultationId}`)).data;

// Patient Portal Authentication
export type PatientRegisterInput = PatientInput & { password: string };
export type PatientLoginInput = { email_or_id: string; password: string };
export type PatientAuthResponse = { message: string; patient: Patient };

export const registerPatientPortal = async (data: PatientRegisterInput): Promise<PatientAuthResponse> =>
  (await api.post<PatientAuthResponse>("/patients/auth/register", data)).data;

export const loginPatientPortal = async (data: PatientLoginInput): Promise<PatientAuthResponse> =>
  (await api.post<PatientAuthResponse>("/patients/auth/login", data)).data;

export const forgotPasswordPatient = async (data: { email_or_id: string; new_password: string }) =>
  (await api.post<{ message: string; patient_id: string }>("/patients/auth/forgot-password", data)).data;




