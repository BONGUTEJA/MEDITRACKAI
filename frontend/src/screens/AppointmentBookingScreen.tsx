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
import { useAuth } from "../context/AuthContext";
import {
  bookAppointment,
  Doctor,
  getAvailableSlots,
  getDoctors,
  getPatients,
  Patient,
} from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";
import MedicalIcon from "../components/MedicalIcon";
import PatientCombobox from "../components/PatientCombobox";

type Props = NativeStackScreenProps<RootStackParamList, "AppointmentBooking">;

const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const todayStr = formatDate(new Date());

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = formatDate(tomorrow);

const inTwoDays = new Date();
inTwoDays.setDate(inTwoDays.getDate() + 2);
const inTwoDaysStr = formatDate(inTwoDays);

export default function AppointmentBookingScreen({ navigation, route }: Props) {
  const { patientUser, userType } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState<number | undefined>(patientUser?.id);
  const [doctorId, setDoctorId] = useState<number>();
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Modal
  const [bookedDetails, setBookedDetails] = useState<{
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([getPatients(), getDoctors()])
      .then(([savedPatients, savedDoctors]) => {
        setPatients(savedPatients);
        setDoctors(savedDoctors);

        if (patientUser) {
          setPatientId(patientUser.id);
        } else if (route.params?.patientId) {
          setPatientId(route.params.patientId);
        } else if (savedPatients.length > 0) {
          setPatientId(savedPatients[0].id);
        }

        if (savedDoctors.length > 0) setDoctorId(savedDoctors[0].id);
      })
      .catch(() => setErrorMessage("Could not load initial doctors or patients."))
      .finally(() => setPageLoading(false));
  }, [patientUser, route.params?.patientId]);

  useEffect(() => {
    if (!doctorId || !appointmentDate) return;
    setLoadingSlots(true);
    setAppointmentTime("");
    getAvailableSlots(doctorId, appointmentDate)
      .then((res) => {
        setAvailableSlots(res.available_slots || []);
      })
      .catch(() => {
        setAvailableSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [doctorId, appointmentDate]);

  const selectedPatient = patientUser || patients.find((p) => p.id === patientId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!patientId) {
        setErrorMessage("Please select a patient before continuing.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!doctorId) {
        setErrorMessage("Please select an attending specialist.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!appointmentDate || !appointmentTime) {
        setErrorMessage("Please select both a consultation date and an available time slot.");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleBook = async () => {
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      setErrorMessage("Please review all steps and select patient, doctor, and slot.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await bookAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason.trim() || undefined,
      });

      setBookedDetails({
        patientName: selectedPatient?.full_name || "Patient",
        doctorName: selectedDoctor?.full_name || "Doctor",
        date: appointmentDate,
        time: appointmentTime,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not book appointment. Please try another slot.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading scheduling matrix & providers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowBadgeText}>CLINICAL SCHEDULING</Text>
            </View>
            <Text style={styles.title}>Book Consultation Slot</Text>
            <Text style={styles.subtitle}>
              Schedule specialist doctor appointments with real-time slot synchronization.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* 🚀 PROGRESS STEPPER */}
          <View style={styles.stepperContainer}>
            {[
              { num: 1, label: "Patient" },
              { num: 2, label: "Specialist" },
              { num: 3, label: "Schedule" },
              { num: 4, label: "Confirm" },
            ].map((s, idx) => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <React.Fragment key={s.num}>
                  {idx > 0 && (
                    <View style={[styles.stepperLine, isPast && styles.stepperLineActive]} />
                  )}
                  <TouchableOpacity
                    style={styles.stepperItem}
                    onPress={() => {
                      if (isPast) setCurrentStep(s.num as any);
                    }}
                    disabled={!isPast}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.stepperCircle,
                        isCurrent && styles.stepperCircleCurrent,
                        isPast && styles.stepperCirclePast,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepperNumber,
                          (isCurrent || isPast) && styles.stepperNumberActive,
                        ]}
                      >
                        {isPast ? "✓" : s.num}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepperLabel,
                        isCurrent && styles.stepperLabelCurrent,
                        isPast && styles.stepperLabelPast,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          {/* STEP 1: PATIENT SELECTION */}
          {currentStep === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionHeader}>Select Intake Patient</Text>
              <Text style={styles.sectionDesc}>
                Search by name, unique patient ID, or mobile number across active records.
              </Text>

              <PatientCombobox
                patients={patients}
                selectedPatientId={patientId}
                onSelectPatient={(p) => setPatientId(p.id)}
                disabled={Boolean(patientUser)}
              />

              <View style={styles.stepBtnRow}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Continue to Specialist →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: DOCTOR SELECTION */}
          {currentStep === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionHeader}>Choose Attending Specialist</Text>
              <Text style={styles.sectionDesc}>
                Select the physician or department best suited for the patient's symptoms.
              </Text>

              <View style={styles.doctorGrid}>
                {doctors.map((d) => {
                  const isSelected = doctorId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => setDoctorId(d.id)}
                      style={[styles.doctorCard, isSelected && styles.doctorCardActive]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.doctorCardHeader}>
                        <View style={[styles.doctorAvatarCircle, isSelected && styles.doctorAvatarCircleActive]}>
                          <MedicalIcon name="doctor" size={24} color={isSelected ? "white" : "#0284C7"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Text style={[styles.doctorName, isSelected && styles.doctorNameActive]}>
                              {d.full_name}
                            </Text>
                            <View style={styles.availPill}>
                              <Text style={styles.availPillText}>🟢 Available</Text>
                            </View>
                          </View>
                          <Text style={[styles.doctorSpec, isSelected && styles.doctorSpecActive]}>
                            🩺 {d.specialization} · 🏥 OP Wing
                          </Text>
                        </View>
                        {isSelected && <Text style={styles.doctorSelectedCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.stepBtnRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>← Back to Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Continue to Schedule →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: DATE & TIME SLOTS */}
          {currentStep === 3 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionHeader}>Select Consultation Schedule</Text>
              <Text style={styles.sectionDesc}>
                Pick a target consultation date and an available clinical shift time slot.
              </Text>

              <Text style={styles.fieldLabel}>Target Date</Text>
              <View style={styles.dateChipRow}>
                <TouchableOpacity
                  style={[
                    styles.quickDateChip,
                    appointmentDate === todayStr && styles.quickDateChipActive,
                  ]}
                  onPress={() => setAppointmentDate(todayStr)}
                >
                  <Text
                    style={[
                      styles.quickDateText,
                      appointmentDate === todayStr && styles.quickDateTextActive,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickDateChip,
                    appointmentDate === tomorrowStr && styles.quickDateChipActive,
                  ]}
                  onPress={() => setAppointmentDate(tomorrowStr)}
                >
                  <Text
                    style={[
                      styles.quickDateText,
                      appointmentDate === tomorrowStr && styles.quickDateTextActive,
                    ]}
                  >
                    Tomorrow
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickDateChip,
                    appointmentDate === inTwoDaysStr && styles.quickDateChipActive,
                  ]}
                  onPress={() => setAppointmentDate(inTwoDaysStr)}
                >
                  <Text
                    style={[
                      styles.quickDateText,
                      appointmentDate === inTwoDaysStr && styles.quickDateTextActive,
                    ]}
                  >
                    In 2 Days
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.dateInput}
                value={appointmentDate}
                onChangeText={setAppointmentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
              />

              {/* Live Slots */}
              <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                Available Consultation Time Slots
              </Text>
              {loadingSlots ? (
                <View style={styles.slotsLoading}>
                  <ActivityIndicator size="small" color="#0284C7" />
                  <Text style={styles.slotsLoadingText}>⏳ Checking live clinic schedule...</Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlotsBox}>
                  <Text style={styles.noSlotsText}>📅 No slots available on this date. Please pick another date.</Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {/* Morning Slots */}
                  {availableSlots.filter((s) => parseInt(s.split(":")[0], 10) < 12).length > 0 && (
                    <View>
                      <Text style={styles.slotGroupTitle}>☀️ Morning Slots (09:00 - 12:00)</Text>
                      <View style={styles.slotGrid}>
                        {availableSlots
                          .filter((s) => parseInt(s.split(":")[0], 10) < 12)
                          .map((slot) => {
                            const isSelected = appointmentTime === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                onPress={() => setAppointmentTime(slot)}
                                style={[styles.slotChip, isSelected && styles.slotChipActive]}
                                activeOpacity={0.7}
                              >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <MedicalIcon name="clock" size={14} color={isSelected ? "white" : "#0284C7"} />
                                  <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                                    {slot}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    </View>
                  )}

                  {/* Afternoon Slots */}
                  {availableSlots.filter((s) => parseInt(s.split(":")[0], 10) >= 12).length > 0 && (
                    <View>
                      <Text style={styles.slotGroupTitle}>🌤️ Afternoon Slots (13:00 - 17:00)</Text>
                      <View style={styles.slotGrid}>
                        {availableSlots
                          .filter((s) => parseInt(s.split(":")[0], 10) >= 12)
                          .map((slot) => {
                            const isSelected = appointmentTime === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                onPress={() => setAppointmentTime(slot)}
                                style={[styles.slotChip, isSelected && styles.slotChipActive]}
                                activeOpacity={0.7}
                              >
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <MedicalIcon name="clock" size={14} color={isSelected ? "white" : "#0284C7"} />
                                  <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                                    {slot}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Reason */}
              <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                Reason for Visit / Chief Symptoms (Optional)
              </Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Follow-up consultation, chest tightness, routine blood check"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
              />

              <View style={styles.stepBtnRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setCurrentStep(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>← Back to Specialist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleNextStep}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Review & Confirm →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {currentStep === 4 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionHeader}>Review Appointment Details</Text>
              <Text style={styles.sectionDesc}>
                Confirm all patient and scheduling data before securing the consultation slot.
              </Text>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Patient:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedPatient?.full_name} (ID: {selectedPatient?.patient_id})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Specialist:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedDoctor?.full_name} ({selectedDoctor?.specialization})
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Date & Time:</Text>
                  <Text style={styles.summaryValHighlight}>
                    📅 {appointmentDate} at 🕒 {appointmentTime}
                  </Text>
                </View>
                {reason.trim().length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Reason:</Text>
                    <Text style={styles.summaryVal}>{reason.trim()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.stepBtnRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setCurrentStep(3)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>← Change Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
                  onPress={handleBook}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Confirm Booking ✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      {bookedDetails && (
        <AnimatedSuccessModal
          visible={Boolean(bookedDetails)}
          title="Appointment Confirmed!"
          subtitle={`Successfully scheduled appointment with ${bookedDetails.doctorName}.`}
          highlightLabel="Confirmed Slot"
          highlightValue={`${bookedDetails.date} at ${bookedDetails.time}`}
          primaryButtonText="View in Dashboard"
          onPrimaryAction={() => {
            setBookedDetails(null);
            navigation.navigate("Dashboard");
          }}
          secondaryButtonText="Book Another Slot"
          onSecondaryAction={() => {
            setBookedDetails(null);
            setCurrentStep(1);
            setAppointmentTime("");
            setReason("");
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 820,
  },
  topBar: {
    marginBottom: 12,
  },
  backBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  backText: {
    color: "#0284C7",
    fontWeight: "700",
    fontSize: 13,
  },
  headingBox: {
    marginBottom: 18,
  },
  eyebrowBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 6,
  },
  eyebrowBadgeText: {
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0C2340",
  },
  subtitle: {
    fontSize: 13,
    color: "#334155",
    marginTop: 4,
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "700",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 18,
  },
  stepperItem: {
    alignItems: "center",
    gap: 4,
  },
  stepperCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCircleCurrent: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  stepperCirclePast: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepperNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  stepperNumberActive: {
    color: "#FFFFFF",
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  stepperLabelCurrent: {
    color: "#0284C7",
    fontWeight: "800",
  },
  stepperLabelPast: {
    color: "#10B981",
    fontWeight: "700",
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
    marginBottom: 18,
  },
  stepperLineActive: {
    backgroundColor: "#10B981",
  },
  stepCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0C2340",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#475569",
    marginTop: 3,
    marginBottom: 16,
    fontWeight: "500",
  },
  stepBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "700",
  },
  doctorGrid: {
    gap: 10,
  },
  doctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  doctorCardActive: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF",
  },
  doctorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  doctorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  doctorAvatarCircleActive: {
    backgroundColor: "#0284C7",
  },
  doctorName: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
  },
  doctorNameActive: {
    color: "#0284C7",
  },
  doctorSpec: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  doctorSpecActive: {
    color: "#0369A1",
  },
  availPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availPillText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  doctorSelectedCheck: {
    color: "#0284C7",
    fontSize: 18,
    fontWeight: "900",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0C2340",
    marginBottom: 8,
  },
  dateChipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickDateChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickDateChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  quickDateText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "700",
  },
  quickDateTextActive: {
    color: "#FFFFFF",
  },
  dateInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 14,
    height: 44,
    color: "#0C2340",
    fontWeight: "700",
  },
  slotsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  slotsLoadingText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "600",
  },
  noSlotsBox: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 10,
  },
  noSlotsText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "600",
  },
  slotGroupTitle: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  slotChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  slotText: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "700",
  },
  slotTextActive: {
    color: "#FFFFFF",
  },
  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    padding: 12,
    color: "#0C2340",
    fontWeight: "600",
    fontSize: 13,
    textAlignVertical: "top",
  },
  summaryBox: {
    backgroundColor: "#F0F7FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E0F2FE",
  },
  summaryKey: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryVal: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryValHighlight: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "900",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F7FF",
    gap: 12,
  },
  loadingText: {
    color: "#0284C7",
    fontWeight: "700",
    fontSize: 14,
  },
});
