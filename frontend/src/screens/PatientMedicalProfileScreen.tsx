import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import {
  AppointmentRecord,
  cancelAppointment,
  Consultation,
  createPatientProfile,
  getPatient,
  getPatientAppointments,
  getPatientConsultations,
  getPatientPrescriptions,
  getPatientProfile,
  Patient,
  PatientProfileInput,
  Prescription,
  updatePatientProfile,
} from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedConfirmModal from "../components/AnimatedConfirmModal";
import MedicalIcon from "../components/MedicalIcon";
import VitalsStatusChip from "../components/VitalsStatusChip";
import ClinicalSummaryModal from "../components/ClinicalSummaryModal";
import VitalsTrendVisualizer from "../components/VitalsTrendVisualizer";

type Props = NativeStackScreenProps<RootStackParamList, "PatientMedicalProfile">;

const emptyProfile: PatientProfileInput = {
  blood_group: "",
  allergies: "",
  existing_diseases: "",
  medical_history: "",
  current_medications: "",
  emergency_contact: "",
  insurance_details: "",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientMedicalProfileScreen({ navigation, route }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [profile, setProfile] = useState<PatientProfileInput>(emptyProfile);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingCancelApptId, setPendingCancelApptId] = useState<number | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "prescriptions" | "appointments">("overview");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const selectedPatient = await getPatient(route.params.patientId);
      setPatient(selectedPatient);

      const [profileRes, apptsRes, consultsRes, presRes] = await Promise.allSettled([
        getPatientProfile(selectedPatient.id),
        getPatientAppointments(selectedPatient.id),
        getPatientConsultations(selectedPatient.id),
        getPatientPrescriptions(selectedPatient.id),
      ]);

      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      else setProfile(emptyProfile);

      if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value);
      else setAppointments([]);

      if (consultsRes.status === "fulfilled") setConsultations(consultsRes.value);
      else setConsultations([]);

      if (presRes.status === "fulfilled") setPrescriptions(presRes.value);
      else setPrescriptions([]);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not load patient details.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }, [route.params.patientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const setField = (field: keyof PatientProfileInput, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));

  const save = async () => {
    if (!patient) return;
    try {
      setSaving(true);
      const cleaned: PatientProfileInput = Object.fromEntries(
        Object.entries(emptyProfile).map(([key]) => [
          key,
          profile[key as keyof PatientProfileInput]?.trim() || undefined,
        ])
      );
      try {
        await updatePatientProfile(patient.id, cleaned);
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
        await createPatientProfile(patient.id, cleaned);
      }
      setIsEditingMedical(false);
      setStatusBanner({ type: "success", text: "Medical profile updated successfully!" });
      setTimeout(() => setStatusBanner(null), 3500);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Please check medical details and try again.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAppointment = (appointmentId: number) => {
    setPendingCancelApptId(appointmentId);
  };

  const executeCancelAppointment = async () => {
    if (!pendingCancelApptId) return;
    const appointmentId = pendingCancelApptId;

    try {
      setCancellingId(appointmentId);
      await cancelAppointment(appointmentId);
      setPendingCancelApptId(null);
      if (patient) {
        const freshAppts = await getPatientAppointments(patient.id);
        setAppointments(freshAppts);
      }
      setStatusBanner({ type: "success", text: "Appointment cancelled successfully." });
      setTimeout(() => setStatusBanner(null), 3000);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to cancel appointment.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={{ marginTop: 12, color: "#64748B", fontWeight: "600" }}>
          Loading complete patient dossier...
        </Text>
      </View>
    );
  }

  if (!patient) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.back}>← Back to Patients</Text>
            </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: "#0284C7" }]}
              onPress={() => setShowSummaryModal(true)}
            >
              <Text style={[styles.headerActionBtnText, { color: "white" }]}>📄 Export Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerConsultBtn}
              onPress={() => navigation.navigate("Consultation", { patientId: patient.id })}
            >
              <Text style={styles.headerConsultBtnText}>+ Consult & Prescribe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate("AppointmentBooking")}
            >
              <Text style={styles.headerActionBtnText}>+ Book Appt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Notification */}
        {statusBanner && (
          <View
            style={[
              styles.statusBanner,
              statusBanner.type === "success" ? styles.statusSuccess : styles.statusError,
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                statusBanner.type === "success" ? styles.statusSuccessText : styles.statusErrorText,
              ]}
            >
              {statusBanner.type === "success" ? "✓ " : "⚠️ "}
              {statusBanner.text}
            </Text>
          </View>
        )}

        {/* SECTION 1: Patient Header Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{patient.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroName}>{patient.full_name}</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>ID: {patient.patient_id}</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>
              {patient.gender} · {patient.age} years old · DOB: {patient.date_of_birth || "N/A"}
            </Text>
          </View>
        </View>

        {/* Segmented Clinical Tab Switcher */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === "overview" && styles.tabNavBtnActive]}
            onPress={() => setActiveTab("overview")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MedicalIcon name="records" size={15} />
              <Text style={[styles.tabNavBtnText, activeTab === "overview" && styles.tabNavBtnTextActive]}>
                Overview & Vitals
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === "prescriptions" && styles.tabNavBtnActive]}
            onPress={() => setActiveTab("prescriptions")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MedicalIcon name="pills" size={15} />
              <Text style={[styles.tabNavBtnText, activeTab === "prescriptions" && styles.tabNavBtnTextActive]}>
                Prescriptions ({prescriptions.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavBtn, activeTab === "appointments" && styles.tabNavBtnActive]}
            onPress={() => setActiveTab("appointments")}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MedicalIcon name="calendar" size={15} />
              <Text style={[styles.tabNavBtnText, activeTab === "appointments" && styles.tabNavBtnTextActive]}>
                Appointments ({appointments.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TAB 1: Clinical Overview & Vitals */}
        {activeTab === "overview" && (
          <>
            <View style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <MedicalIcon name="user" size={18} color="#0284C7" />
                <Text style={styles.cardHeader}>Personal & Contact Details</Text>
              </View>
              <View style={styles.detailsGrid}>
                <DetailItem label="Full Name" value={patient.full_name} />
                <DetailItem label="Patient ID" value={patient.patient_id} highlight />
                <DetailItem label="Age" value={`${patient.age} years`} />
                <DetailItem label="Gender" value={patient.gender} />
                <DetailItem label="Date of Birth" value={patient.date_of_birth || "Not specified"} />
                <DetailItem label="Phone Number" value={patient.phone} />
                <DetailItem label="Email Address" value={patient.email || "None recorded"} />
                <DetailItem label="Residential Address" value={patient.address || "None recorded"} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MedicalIcon name="consultation" size={18} color="#0284C7" />
                  <Text style={styles.cardHeader}>Clinical & Medical Profile</Text>
                </View>
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setIsEditingMedical(!isEditingMedical)}
                >
                  <Text style={styles.editToggleText}>
                    {isEditingMedical ? "Cancel Edit" : "Edit Details"}
                  </Text>
                </TouchableOpacity>
              </View>

              {isEditingMedical ? (
                <View style={styles.editForm}>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Blood Group</Text>
                    <View style={styles.bloodGroupOptions}>
                      {BLOOD_GROUPS.map((bg) => (
                        <TouchableOpacity
                          key={bg}
                          onPress={() => setField("blood_group", bg)}
                          style={[
                            styles.bloodOptionChip,
                            profile.blood_group === bg && styles.bloodOptionChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.bloodOptionText,
                              profile.blood_group === bg && styles.bloodOptionTextActive,
                            ]}
                          >
                            {bg}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <Field
                    label="Known Allergies"
                    value={profile.allergies ?? ""}
                    onChangeText={(v) => setField("allergies", v)}
                    placeholder="e.g. Penicillin, Peanuts, Latex"
                    multiline
                  />
                  <Field
                    label="Existing Diseases / Chronic Illness"
                    value={profile.existing_diseases ?? ""}
                    onChangeText={(v) => setField("existing_diseases", v)}
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    multiline
                  />
                  <Field
                    label="Current Medications"
                    value={profile.current_medications ?? ""}
                    onChangeText={(v) => setField("current_medications", v)}
                    placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                    multiline
                  />
                  <Field
                    label="Past Medical History & Surgeries"
                    value={profile.medical_history ?? ""}
                    onChangeText={(v) => setField("medical_history", v)}
                    placeholder="e.g. Appendectomy 2018, Knee Surgery 2021"
                    multiline
                  />
                  <Field
                    label="Emergency Contact (Name & Phone)"
                    value={profile.emergency_contact ?? ""}
                    onChangeText={(v) => setField("emergency_contact", v)}
                    placeholder="e.g. John Doe (Spouse) - +1 555-987-6543"
                  />
                  <Field
                    label="Insurance / Policy Number"
                    value={profile.insurance_details ?? ""}
                    onChangeText={(v) => setField("insurance_details", v)}
                    placeholder="e.g. Blue Cross Policy #BC987654321"
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.disabled]}
                    onPress={save}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Medical Details</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.detailsGrid}>
                  <DetailItem label="Blood Group" value={profile.blood_group || "None"} />
                  <DetailItem label="Known Allergies" value={profile.allergies || "None reported"} isWarning={!!profile.allergies} />
                  <DetailItem label="Existing Diseases" value={profile.existing_diseases || "None reported"} />
                  <DetailItem label="Current Medications" value={profile.current_medications || "None"} />
                  <DetailItem label="Past Medical History" value={profile.medical_history || "None recorded"} />
                  <DetailItem label="Emergency Contact" value={profile.emergency_contact || "None provided"} />
                  <DetailItem label="Insurance Information" value={profile.insurance_details || "None provided"} />
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MedicalIcon name="records" size={18} color="#0284C7" />
                  <Text style={styles.cardHeader}>
                    Consultations & Clinical Vitals ({consultations.length})
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookSmallBtn}
                  onPress={() => navigation.navigate("Consultation", { patientId: patient.id })}
                >
                  <Text style={styles.bookSmallBtnText}>+ New Consultation</Text>
                </TouchableOpacity>
              </View>

              {/* Clinical Vitals Trend Trajectory */}
              <VitalsTrendVisualizer records={consultations} />

              {consultations.length > 0 ? (
                consultations.map((c) => (
                  <View key={`c-${c.id}`} style={styles.consultationCard}>
                    <View style={styles.consultationHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.consultDoctorName}>{c.doctor_name}</Text>
                        <Text style={styles.consultDoctorSpec}>{c.doctor_specialization}</Text>
                      </View>
                      <View style={styles.consultDateBadge}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <MedicalIcon name="calendar" size={12} color="#0284C7" />
                          <Text style={styles.consultDateText}>{c.consultation_date}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.diagnosisBox}>
                      <Text style={styles.diagnosisLabel}>DIAGNOSIS</Text>
                      <Text style={styles.diagnosisValue}>{c.diagnosis}</Text>
                    </View>

                    {(c.vital_bp || c.vital_heart_rate || c.vital_temperature || c.vital_weight || c.vital_spo2) && (
                      <View style={styles.vitalsPillRow}>
                        {c.vital_bp ? <VitalsStatusChip label="BP" value={c.vital_bp} /> : null}
                        {c.vital_heart_rate ? <VitalsStatusChip label="Pulse" value={`${c.vital_heart_rate} bpm`} /> : null}
                        {c.vital_temperature ? <VitalsStatusChip label="Temp" value={`${c.vital_temperature}°F`} /> : null}
                        {c.vital_weight ? <VitalsStatusChip label="Weight" value={`${c.vital_weight} kg`} /> : null}
                        {c.vital_spo2 ? <VitalsStatusChip label="SpO2" value={`${c.vital_spo2}%`} /> : null}
                      </View>
                    )}

                    {c.symptoms ? (
                      <Text style={styles.consultDetailText}>
                        <Text style={{ fontWeight: "700" }}>Symptoms: </Text>
                        {c.symptoms}
                      </Text>
                    ) : null}

                    {c.notes ? (
                      <Text style={styles.consultDetailText}>
                        <Text style={{ fontWeight: "700" }}>Clinical Notes: </Text>
                        {c.notes}
                      </Text>
                    ) : null}

                    {c.follow_up_date ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
                        <MedicalIcon name="calendar" size={14} color="#0284C7" />
                        <Text style={styles.followUpText}>
                          Follow-up scheduled for: <Text style={{ fontWeight: "800" }}>{c.follow_up_date}</Text>
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MedicalIcon name="consultation" size={32} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Consultations Recorded</Text>
                  <Text style={styles.emptySubtitle}>
                    Record clinical vitals and diagnosis through a doctor consultation.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => navigation.navigate("Consultation", { patientId: patient.id })}
                  >
                    <Text style={styles.emptyActionBtnText}>Record Consultation</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* TAB 2: Prescription Cabinet */}
        {activeTab === "prescriptions" && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MedicalIcon name="pills" size={18} color="#0284C7" />
                <Text style={styles.cardHeader}>
                  Digital Prescriptions ({prescriptions.length})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bookSmallBtn}
                onPress={() => setShowSummaryModal(true)}
              >
                <Text style={styles.bookSmallBtnText}>🖨️ Export Summary</Text>
              </TouchableOpacity>
            </View>

            {prescriptions.length > 0 ? (
              prescriptions.map((pres) => (
                <View key={`pres-${pres.id}`} style={styles.prescriptionCardBox}>
                  <View style={styles.prescriptionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presDoctorText}>{pres.doctor_name}</Text>
                      <Text style={styles.presDoctorSpec}>{pres.doctor_specialization}</Text>
                    </View>
                    <Text style={styles.presDateText}>Issued: {pres.issue_date}</Text>
                  </View>

                  <View style={styles.medicinesTable}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCol, { flex: 2 }]}>Medicine & Strength</Text>
                      <Text style={[styles.tableHeaderCol, { flex: 1.2 }]}>Dosage</Text>
                      <Text style={[styles.tableHeaderCol, { flex: 1.5 }]}>Frequency</Text>
                      <Text style={[styles.tableHeaderCol, { flex: 1 }]}>Duration</Text>
                    </View>

                    {pres.items.map((item) => (
                      <View key={`item-${item.id}`} style={styles.tableRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.medNameText}>{item.medicine_name}</Text>
                          {item.instructions ? (
                            <Text style={styles.medInstText}>{item.instructions}</Text>
                          ) : null}
                        </View>
                        <Text style={[styles.tableColText, { flex: 1.2 }]}>{item.dosage}</Text>
                        <Text style={[styles.tableColText, { flex: 1.5 }]}>{item.frequency}</Text>
                        <Text style={[styles.tableColText, { flex: 1 }]}>{item.duration}</Text>
                      </View>
                    ))}
                  </View>

                  {pres.general_instructions ? (
                    <View style={styles.generalInstBox}>
                      <Text style={styles.generalInstLabel}>Instructions / Dietary Advice:</Text>
                      <Text style={styles.generalInstText}>{pres.general_instructions}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MedicalIcon name="pills" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Prescriptions Issued</Text>
                <Text style={styles.emptySubtitle}>
                  Prescriptions generated during consultations will appear here with dosage schedules.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: Appointments Timeline */}
        {activeTab === "appointments" && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MedicalIcon name="calendar" size={18} color="#0284C7" />
                <Text style={styles.cardHeader}>
                  Appointments History ({appointments.length})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bookSmallBtn}
                onPress={() => navigation.navigate("AppointmentBooking")}
              >
                <Text style={styles.bookSmallBtnText}>+ Book New</Text>
              </TouchableOpacity>
            </View>

            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <View key={`appt-${appt.id}`} style={styles.appointmentBox}>
                  <View style={styles.appointmentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>{appt.doctor_name}</Text>
                      <Text style={styles.doctorSpec}>{appt.doctor_specialization}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        appt.status === "Booked"
                          ? styles.statusBooked
                          : appt.status === "Completed"
                          ? styles.statusCompleted
                          : styles.statusCancelled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          appt.status === "Booked"
                            ? styles.statusBookedText
                            : appt.status === "Completed"
                            ? styles.statusCompletedText
                            : styles.statusCancelledText,
                        ]}
                      >
                        {appt.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Slot:</Text>
                    <Text style={styles.timeValue}>
                      {appt.appointment_date} at {appt.appointment_time}
                    </Text>
                  </View>

                  {appt.reason ? (
                    <Text style={styles.reasonText}>Reason: {appt.reason}</Text>
                  ) : null}

                  {appt.status === "Booked" ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setPendingCancelApptId(appt.id)}
                      disabled={cancellingId === appt.id}
                    >
                      {cancellingId === appt.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MedicalIcon name="calendar" size={32} color="#94A3B8" />
                <Text style={styles.emptyApptTitle}>No Appointments Booked</Text>
                <Text style={styles.emptyApptSubtitle}>
                  Schedule patient appointments with available medical specialists.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate("AppointmentBooking")}
                >
                  <Text style={styles.emptyActionBtnText}>+ Book Appointment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        </View>
      </ScrollView>

      {/* Animated Appointment Cancel Modal */}
      <AnimatedConfirmModal
        visible={!!pendingCancelApptId}
        type="warning"
        title="Cancel Patient Appointment"
        message="Are you sure you want to cancel this scheduled consultation? The slot will be released back to the clinical directory."
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        confirming={cancellingId !== null}
        onConfirm={executeCancelAppointment}
        onCancel={() => setPendingCancelApptId(null)}
      />

      {/* 1-Tap Clinical Health Summary Export Modal */}
      <ClinicalSummaryModal
        visible={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        patientName={patient.full_name}
        patientId={patient.patient_id}
        age={patient.age}
        gender={patient.gender}
        bloodGroup={profile.blood_group}
        allergies={profile.allergies}
        diseases={profile.existing_diseases}
        medications={prescriptions.flatMap((p) => p.items)}
        consultations={consultations}
        emergencyContact={profile.emergency_contact}
      />
    </SafeAreaView>
  );
}

function VitalsChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.vitalsChip}>
      <Text style={styles.vitalsChipLabel}>{label}</Text>
      <Text style={styles.vitalsChipValue}>{value}</Text>
    </View>
  );
}

function DetailItem({
  label,
  value,
  highlight = false,
  isWarning = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isWarning?: boolean;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailHighlight, isWarning && { color: "#DC2626", fontWeight: "800" }]}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F7FF" },
  content: { padding: 20, paddingBottom: 60, alignItems: "center" },
  containerMaxWidth: { width: "100%", maxWidth: 960 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F7FF" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  backBtn: { paddingVertical: 6 },
  back: { color: "#0284C7", fontWeight: "800", fontSize: 15 },
  headerActionBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  headerActionBtnText: { color: "white", fontWeight: "800", fontSize: 13 },
  headerConsultBtn: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0284C7",
  },
  headerConsultBtnText: { color: "#0284C7", fontWeight: "800", fontSize: 13 },
  statusBanner: { padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  statusSuccess: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  statusError: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  statusBannerText: { fontWeight: "700", fontSize: 14 },
  statusSuccessText: { color: "#166534" },
  statusErrorText: { color: "#991B1B" },
  heroCard: {
    backgroundColor: "#0284C7",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  heroAvatarText: { color: "#0284C7", fontSize: 26, fontWeight: "900" },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  heroName: { color: "white", fontSize: 22, fontWeight: "900" },
  idBadge: { backgroundColor: "#FFFFFF30", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  idBadgeText: { color: "white", fontWeight: "900", fontSize: 13 },
  heroSubtitle: { color: "#E0F2FE", fontSize: 13, marginTop: 4, fontWeight: "600" },
  tabNavRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  tabNavBtn: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  tabNavBtnActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
    shadowOpacity: 0.2,
    elevation: 3,
  },
  tabNavBtnText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "800",
  },
  tabNavBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  cardHeader: { color: "#0C2340", fontSize: 17, fontWeight: "900" },
  editToggleBtn: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  editToggleText: { color: "#0284C7", fontWeight: "800", fontSize: 13 },
  detailsGrid: { gap: 12 },
  detailItem: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  detailLabel: { color: "#627D98", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  detailValue: { color: "#0C2340", fontSize: 15, fontWeight: "600", marginTop: 3 },
  detailHighlight: { color: "#0284C7", fontWeight: "900" },
  bloodGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  bloodBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  bloodBadgeText: { color: "#DC2626", fontWeight: "900", fontSize: 15 },
  bloodGroupOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  bloodOptionChip: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  bloodOptionChipActive: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  bloodOptionText: {
    color: "#334E68",
    fontWeight: "800",
    fontSize: 14,
  },
  bloodOptionTextActive: {
    color: "white",
    fontWeight: "900",
  },
  editForm: { gap: 14 },
  field: { marginBottom: 4 },
  fieldLabel: { color: "#0C2340", fontWeight: "800", marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 12,
    color: "#0C2340",
    fontSize: 14,
  },
  multiline: { minHeight: 75 },
  saveBtn: {
    backgroundColor: "#0284C7",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
  disabled: { opacity: 0.6 },
  bookSmallBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookSmallBtnText: { color: "white", fontWeight: "800", fontSize: 12 },
  consultationCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 14,
  },
  consultationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  consultDoctorName: { color: "#0C2340", fontSize: 16, fontWeight: "800" },
  consultDoctorSpec: { color: "#0284C7", fontSize: 13, fontWeight: "700", marginTop: 2 },
  consultDateBadge: { backgroundColor: "#E0F2FE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  consultDateText: { color: "#0369A1", fontSize: 12, fontWeight: "700" },
  diagnosisBox: {
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#0284C7",
    marginBottom: 10,
  },
  diagnosisLabel: { color: "#0369A1", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  diagnosisValue: { color: "#0C2340", fontSize: 15, fontWeight: "800", marginTop: 2 },
  vitalsPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  vitalsChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    gap: 4,
  },
  vitalsChipLabel: { color: "#627D98", fontWeight: "800", fontSize: 12 },
  vitalsChipValue: { color: "#0C2340", fontWeight: "800", fontSize: 12 },
  consultDetailText: { color: "#334E68", fontSize: 13, lineHeight: 18, marginBottom: 6 },
  followUpText: { color: "#0284C7", fontSize: 13, fontWeight: "600", marginTop: 4 },
  prescriptionCardBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 14,
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#BAE6FD",
    paddingBottom: 8,
  },
  presDoctorText: { color: "#0C2340", fontSize: 15, fontWeight: "800" },
  presDoctorSpec: { color: "#0284C7", fontSize: 12, fontWeight: "700" },
  presDateText: { color: "#627D98", fontSize: 12, fontWeight: "600" },
  medicinesTable: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#BAE6FD", overflow: "hidden" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#BAE6FD",
  },
  tableHeaderCol: { color: "#0C2340", fontWeight: "800", fontSize: 12 },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F9FF",
    alignItems: "center",
  },
  medNameText: { color: "#0C2340", fontWeight: "800", fontSize: 13 },
  medInstText: { color: "#0284C7", fontSize: 11, fontWeight: "600", marginTop: 2 },
  tableColText: { color: "#334E68", fontSize: 12, fontWeight: "600" },
  generalInstBox: {
    marginTop: 10,
    backgroundColor: "#E0F2FE",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  generalInstLabel: { color: "#0369A1", fontWeight: "800", fontSize: 11 },
  generalInstText: { color: "#0C2340", fontSize: 12, marginTop: 2 },
  appointmentBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  doctorName: { color: "#0C2340", fontSize: 15, fontWeight: "800" },
  doctorSpec: { color: "#0284C7", fontSize: 12, fontWeight: "700", marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  statusBooked: { backgroundColor: "#DCFCE7" },
  statusCompleted: { backgroundColor: "#E0E7FF" },
  statusCancelled: { backgroundColor: "#FEE2E2" },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  statusBookedText: { color: "#15803D" },
  statusCompletedText: { color: "#4338CA" },
  statusCancelledText: { color: "#B91C1C" },
  appointmentDetails: { gap: 4 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIcon: { fontSize: 13, marginRight: 6 },
  infoText: { color: "#334E68", fontSize: 13 },
  cancelBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "#DC2626", fontWeight: "800", fontSize: 12 },
  startConsultBtn: {
    backgroundColor: "#0284C7",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  startConsultBtnText: { color: "white", fontWeight: "800", fontSize: 12 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  timeLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  timeValue: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
  },
  reasonText: {
    color: "#334E68",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 6,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 14,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: "#0C2340", fontSize: 15, fontWeight: "800" },
  emptySubtitle: {
    color: "#627D98",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  emptyActionBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyActionBtnText: { color: "white", fontWeight: "800", fontSize: 13 },
  emptyApptBox: { padding: 20, alignItems: "center" },
  emptyApptEmoji: { fontSize: 32, marginBottom: 8 },
  emptyApptTitle: { color: "#0C2340", fontSize: 15, fontWeight: "800" },
  emptyApptSubtitle: {
    color: "#627D98",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  emptyBookBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBookBtnText: { color: "white", fontWeight: "800", fontSize: 13 },
});
