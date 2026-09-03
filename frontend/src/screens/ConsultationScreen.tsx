import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import {
  createConsultation,
  createPrescription,
  Doctor,
  getDoctors,
  getPatients,
  Patient,
  PrescriptionItemInput,
} from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";
import PatientCombobox from "../components/PatientCombobox";

type Props = NativeStackScreenProps<RootStackParamList, "Consultation">;

const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = formatDate(new Date());

const defaultMedicine: PrescriptionItemInput = {
  medicine_name: "",
  dosage: "1 Tablet",
  frequency: "1-0-1 (Twice Daily)",
  duration: "5 Days",
  instructions: "After food",
};

export const COMMON_MEDS = [
  { name: "Paracetamol 500mg", dosage: "1 Tablet", frequency: "1-0-1", duration: "5 Days", instructions: "After Meals" },
  { name: "Amoxicillin 500mg", dosage: "1 Capsule", frequency: "1-0-1", duration: "7 Days", instructions: "With Water" },
  { name: "Pantoprazole 40mg", dosage: "1 Tablet", frequency: "1-0-0", duration: "10 Days", instructions: "Before Breakfast" },
  { name: "Cetirizine 10mg", dosage: "1 Tablet", frequency: "0-0-1", duration: "5 Days", instructions: "At Bedtime" },
  { name: "Metformin 500mg", dosage: "1 Tablet", frequency: "1-0-1", duration: "30 Days", instructions: "With Meals" },
  { name: "Ibuprofen 400mg", dosage: "1 Tablet", frequency: "1-0-1", duration: "3 Days", instructions: "SOS After Meals" },
];

export default function ConsultationScreen({ navigation, route }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState<number>();
  const [doctorId, setDoctorId] = useState<number>();
  const [appointmentId] = useState<number | undefined>(
    route.params?.appointmentId
  );
  const [consultationDate, setConsultationDate] = useState(todayStr);

  // Clinical Observations
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Vital Signs
  const [vitalBp, setVitalBp] = useState("");
  const [vitalHr, setVitalHr] = useState("");
  const [vitalTemp, setVitalTemp] = useState("");
  const [vitalWeight, setVitalWeight] = useState("");
  const [vitalSpo2, setVitalSpo2] = useState("");

  // Prescription
  const [includePrescription, setIncludePrescription] = useState(true);
  const [medicines, setMedicines] = useState<PrescriptionItemInput[]>([
    { ...defaultMedicine, medicine_name: "" },
  ]);
  const [generalInstructions, setGeneralInstructions] = useState("");

  const addPresetMedicine = (preset: (typeof COMMON_MEDS)[0]) => {
    // If the first row is empty, fill it; otherwise append a new row
    setMedicines((prev) => {
      if (prev.length === 1 && !prev[0].medicine_name.trim()) {
        return [{
          medicine_name: preset.name,
          dosage: preset.dosage,
          frequency: preset.frequency,
          duration: preset.duration,
          instructions: preset.instructions,
        }];
      }
      return [
        ...prev,
        {
          medicine_name: preset.name,
          dosage: preset.dosage,
          frequency: preset.frequency,
          duration: preset.duration,
          instructions: preset.instructions,
        },
      ];
    });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    patientName: string;
    doctorName: string;
    diagnosis: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([getPatients(), getDoctors()])
      .then(([savedPatients, savedDoctors]) => {
        setPatients(savedPatients);
        setDoctors(savedDoctors);

        if (route.params?.patientId) {
          const match = savedPatients.find(
            (p) => p.id === route.params?.patientId || p.patient_id === String(route.params?.patientId)
          );
          if (match) setPatientId(match.id);
        } else if (savedPatients.length > 0) {
          setPatientId(savedPatients[0].id);
        }

        if (savedDoctors.length > 0) {
          setDoctorId(savedDoctors[0].id);
        }
      })
      .catch(() => setErrorMessage("Could not load patients or doctors roster."))
      .finally(() => setLoading(false));
  }, [route.params?.patientId]);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const addMedicineRow = () => {
    setMedicines([...medicines, { ...defaultMedicine, medicine_name: "" }]);
  };

  const removeMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof PrescriptionItemInput, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSubmit = async () => {
    if (!patientId || !doctorId || !diagnosis.trim()) {
      setErrorMessage("Please select a patient, doctor, and enter a primary diagnosis.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const consultation = await createConsultation({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        consultation_date: consultationDate,
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        follow_up_date: followUpDate.trim() || undefined,
        vital_bp: vitalBp.trim() || undefined,
        vital_heart_rate: vitalHr ? Number(vitalHr) : undefined,
        vital_temperature: vitalTemp ? Number(vitalTemp) : undefined,
        vital_weight: vitalWeight ? Number(vitalWeight) : undefined,
        vital_spo2: vitalSpo2 ? Number(vitalSpo2) : undefined,
      });

      const validMeds = medicines.filter((m) => m.medicine_name.trim() !== "");
      if (includePrescription && validMeds.length > 0) {
        await createPrescription({
          consultation_id: consultation.id,
          patient_id: patientId,
          doctor_id: doctorId,
          issue_date: consultationDate,
          general_instructions: generalInstructions.trim() || undefined,
          items: validMeds,
        });
      }

      setSuccessDetails({
        patientName: selectedPatient?.full_name || "Patient",
        doctorName: selectedDoctor?.full_name || "Doctor",
        diagnosis: diagnosis.trim(),
      });
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not record consultation. Please try again.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading clinical records and forms...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.containerMaxWidth}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowBadgeText}>CLINICAL WORKSTATION</Text>
            </View>
            <Text style={styles.title}>Patient Consultation & Prescription</Text>
            <Text style={styles.subtitle}>
              Record vital observations, medical diagnosis, and dispatch digital pharmacy prescriptions.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* 1. Patient & Doctor Selection */}
          <Text style={styles.sectionHeader}>1. Patient & Attending Physician</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Select Patient</Text>
              <PatientCombobox
                patients={patients}
                selectedPatientId={patientId}
                onSelectPatient={(p) => setPatientId(p.id)}
              />
            </View>

            <View style={[styles.field, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Attending Doctor</Text>
              <View style={styles.optionsList}>
                {doctors.map((d) => {
                  const isSelected = doctorId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.chipOption, isSelected && styles.chipOptionActive]}
                      onPress={() => setDoctorId(d.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {d.full_name} · {d.specialization}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* 2. Patient Vitals */}
          <Text style={styles.sectionHeader}>2. Vital Signs (Clinical Intake)</Text>
          <View style={styles.card}>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalField}>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="120/80 mmHg"
                  placeholderTextColor="#94A3B8"
                  value={vitalBp}
                  onChangeText={setVitalBp}
                />
              </View>

              <View style={styles.vitalField}>
                <Text style={styles.vitalLabel}>Heart Rate (BPM)</Text>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="72 bpm"
                  placeholderTextColor="#94A3B8"
                  value={vitalHr}
                  onChangeText={setVitalHr}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.vitalField}>
                <Text style={styles.vitalLabel}>Temperature (°F)</Text>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="98.6 °F"
                  placeholderTextColor="#94A3B8"
                  value={vitalTemp}
                  onChangeText={setVitalTemp}
                />
              </View>

              <View style={styles.vitalField}>
                <Text style={styles.vitalLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="65 kg"
                  placeholderTextColor="#94A3B8"
                  value={vitalWeight}
                  onChangeText={setVitalWeight}
                />
              </View>

              <View style={styles.vitalField}>
                <Text style={styles.vitalLabel}>SpO2 (%)</Text>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="99%"
                  placeholderTextColor="#94A3B8"
                  value={vitalSpo2}
                  onChangeText={setVitalSpo2}
                />
              </View>
            </View>
          </View>

          {/* 3. Symptoms & Diagnosis */}
          <Text style={styles.sectionHeader}>3. Clinical Findings & Diagnosis</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Reported Symptoms</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Chief complaints reported by the patient..."
                placeholderTextColor="#94A3B8"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
              />
            </View>

            <View style={[styles.field, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Primary Clinical Diagnosis *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Acute Bronchitis, Type 2 Diabetes, Tension Headache..."
                placeholderTextColor="#94A3B8"
                value={diagnosis}
                onChangeText={setDiagnosis}
              />
            </View>

            <View style={[styles.field, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Clinical Notes & Advice</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Doctor's notes, lifestyle recommendations, test orders..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={[styles.field, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Follow-up Date (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g. 2026-09-15)"
                placeholderTextColor="#94A3B8"
                value={followUpDate}
                onChangeText={setFollowUpDate}
              />
            </View>
          </View>

          {/* 4. Digital Prescription */}
          <View style={styles.prescriptionHeaderRow}>
            <Text style={styles.sectionHeader}>4. Digital Medication Prescription</Text>
            <TouchableOpacity
              onPress={() => setIncludePrescription(!includePrescription)}
              style={styles.togglePrescriptionBtn}
            >
              <Text style={styles.togglePrescriptionText}>
                {includePrescription ? "✓ Included" : "+ Add Prescription"}
              </Text>
            </TouchableOpacity>
          </View>

          {includePrescription && (
            <View style={styles.card}>
              {/* Quick Medicine Presets Bar */}
              <View style={styles.presetsBox}>
                <Text style={styles.presetsTitle}>⚡ Fast-Track Rx Presets (1-Tap Add):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {COMMON_MEDS.map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.presetChip}
                      onPress={() => addPresetMedicine(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetChipText}>+ {p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {medicines.map((med, index) => (
                <View key={index} style={styles.medicineRowBox}>
                  <View style={styles.medHeaderRow}>
                    <Text style={styles.medIndexLabel}>Medication #{index + 1}</Text>
                    {medicines.length > 1 && (
                      <TouchableOpacity onPress={() => removeMedicineRow(index)}>
                        <Text style={styles.removeMedText}>✕ Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Medicine Name (e.g. Paracetamol 500mg, Amoxicillin)..."
                    placeholderTextColor="#94A3B8"
                    value={med.medicine_name}
                    onChangeText={(val) => updateMedicine(index, "medicine_name", val)}
                  />

                  <View style={styles.medFieldsGrid}>
                    <TextInput
                      style={styles.medSubInput}
                      placeholder="Dosage (e.g. 1 Tab)"
                      placeholderTextColor="#94A3B8"
                      value={med.dosage}
                      onChangeText={(val) => updateMedicine(index, "dosage", val)}
                    />
                    <TextInput
                      style={styles.medSubInput}
                      placeholder="Frequency (1-0-1)"
                      placeholderTextColor="#94A3B8"
                      value={med.frequency}
                      onChangeText={(val) => updateMedicine(index, "frequency", val)}
                    />
                    <TextInput
                      style={styles.medSubInput}
                      placeholder="Duration (5 Days)"
                      placeholderTextColor="#94A3B8"
                      value={med.duration}
                      onChangeText={(val) => updateMedicine(index, "duration", val)}
                    />
                  </View>

                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder="Instructions (e.g. After meals with warm water)"
                    placeholderTextColor="#94A3B8"
                    value={med.instructions}
                    onChangeText={(val) => updateMedicine(index, "instructions", val)}
                  />
                </View>
              ))}

              <TouchableOpacity onPress={addMedicineRow} style={styles.addMedBtn}>
                <Text style={styles.addMedBtnText}>+ Add Another Medication</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, styles.multiline, { marginTop: 14 }]}
                placeholder="General prescription instructions, dietary restrictions..."
                placeholderTextColor="#94A3B8"
                value={generalInstructions}
                onChangeText={setGeneralInstructions}
                multiline
              />
            </View>
          )}

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.disabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Complete Consultation & Issue Prescription →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Animated Success Modal */}
      <AnimatedSuccessModal
        visible={!!successDetails}
        title="Consultation Recorded!"
        subtitle={`Clinical diagnosis and prescription saved for ${successDetails?.patientName} under ${successDetails?.doctorName}.`}
        highlightLabel="Primary Diagnosis"
        highlightValue={successDetails?.diagnosis}
        primaryButtonText="View Medical Record →"
        onPrimaryAction={() => {
          setSuccessDetails(null);
          if (selectedPatient) {
            navigation.navigate("PatientMedicalProfile", { patientId: selectedPatient.patient_id });
          } else {
            navigation.navigate("Dashboard");
          }
        }}
        secondaryButtonText="Dashboard"
        onSecondaryAction={() => {
          setSuccessDetails(null);
          navigation.navigate("Dashboard");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
  },
  loadingText: {
    marginTop: 12,
    color: "#334E68",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 70,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 860,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 15,
  },
  headingBox: {
    marginBottom: 18,
  },
  eyebrowBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  eyebrowBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: "#0C2340",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: "#334E68",
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    color: "#B91C1C",
    fontWeight: "800",
    fontSize: 14,
  },
  sectionHeader: {
    color: "#0C2340",
    fontWeight: "800",
    fontSize: 15,
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 18,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  field: {
    marginBottom: 6,
  },
  fieldLabel: {
    color: "#0C2340",
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 8,
  },
  optionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipOption: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipOptionActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  chipText: {
    color: "#334E68",
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: {
    color: "white",
    fontWeight: "900",
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  vitalField: {
    width: "48%",
    minWidth: 130,
    flexGrow: 1,
  },
  vitalLabel: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  vitalInput: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 10,
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 12,
    color: "#0C2340",
    fontSize: 14,
  },
  multiline: {
    minHeight: 75,
  },
  prescriptionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  togglePrescriptionBtn: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  togglePrescriptionText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  medicineRowBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 12,
  },
  medHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  medIndexLabel: {
    color: "#0284C7",
    fontWeight: "900",
    fontSize: 13,
  },
  removeMedText: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 12,
  },
  medFieldsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  medSubInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 8,
    padding: 9,
    fontSize: 12,
    color: "#0C2340",
  },
  addMedBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginTop: 4,
  },
  addMedBtnText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  presetsBox: {
    marginBottom: 14,
    backgroundColor: "#F0F9FF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  presetsTitle: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#0284C7",
  },
  presetChipText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "800",
  },
});
