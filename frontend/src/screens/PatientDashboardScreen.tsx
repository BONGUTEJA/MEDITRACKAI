import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import {
  AppointmentRecord,
  cancelAppointment,
  Consultation,
  getPatient,
  getPatientAppointments,
  getPatientConsultations,
  getPatientPrescriptions,
  getPatientProfile,
  PatientProfile,
  Prescription,
} from "../services/medtrackService";
import {
  getPatientNotifications,
  markAllPatientNotificationsRead,
  markNotificationRead,
  NotificationItem,
  syncPatientReminders,
} from "../services/notificationService";
import NotificationCenterModal from "../components/NotificationCenterModal";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedConfirmModal from "../components/AnimatedConfirmModal";
import MedicalIcon from "../components/MedicalIcon";
import ClinicalSummaryModal from "../components/ClinicalSummaryModal";
import { SkeletonListItem } from "../components/SkeletonLoader";

type Props = NativeStackScreenProps<RootStackParamList, "PatientDashboard">;

export default function PatientDashboardScreen({ navigation }: Props) {
  const { patientUser, logout, updatePatient } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Animated Modal States
  const [pendingCancelApptId, setPendingCancelApptId] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const loadPatientData = useCallback(async () => {
    if (!patientUser) return;
    try {
      setLoading(true);
      const [freshPatient, profileRes, apptsRes, consultsRes, presRes, notifRes] = await Promise.allSettled([
        getPatient(patientUser.patient_id),
        getPatientProfile(patientUser.id),
        getPatientAppointments(patientUser.id),
        getPatientConsultations(patientUser.id),
        getPatientPrescriptions(patientUser.id),
        syncPatientReminders(patientUser.id),
      ]);

      if (freshPatient.status === "fulfilled") {
        updatePatient(freshPatient.value);
      }
      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value);
      if (consultsRes.status === "fulfilled") setConsultations(consultsRes.value);
      if (presRes.status === "fulfilled") setPrescriptions(presRes.value);
      if (notifRes.status === "fulfilled") {
        setNotifications(notifRes.value.notifications);
        setUnreadNotifs(notifRes.value.unread_count);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [patientUser?.id, patientUser?.patient_id, updatePatient]);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [loadPatientData])
  );

  if (!patientUser) {
    navigation.replace("Login");
    return null;
  }

  const handleCancelAppointment = (appointmentId: number) => {
    setPendingCancelApptId(appointmentId);
  };

  const executeCancelAppointment = async () => {
    if (!pendingCancelApptId || !patientUser) return;
    const apptId = pendingCancelApptId;

    try {
      setCancellingId(apptId);
      await cancelAppointment(apptId);
      setPendingCancelApptId(null);
      const freshAppts = await getPatientAppointments(patientUser.id);
      setAppointments(freshAppts);
      setStatusBanner({ type: "success", text: "Appointment cancelled successfully." });
      setTimeout(() => setStatusBanner(null), 3000);
      loadPatientData();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to cancel appointment.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setCancellingId(null);
    }
  };

  const handleMarkNotifRead = async (id: number) => {
    await markNotificationRead(id);
    loadPatientData();
  };

  const handleMarkAllNotifsRead = async () => {
    if (patientUser) {
      await markAllPatientNotificationsRead(patientUser.id);
      loadPatientData();
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigation.replace("Login");
  };

  const initial = patientUser.full_name?.charAt(0).toUpperCase() || "P";
  const upcomingCount = appointments.filter((a) => a.status === "Booked").length;
  const tabletAlerts = notifications.filter((n) => n.notification_type === "medication");

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>PATIENT HEALTH PORTAL</Text>
              </View>
              <Text style={styles.greeting}>Welcome,</Text>
              <Text style={styles.userName}>{patientUser.full_name}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Notification Bell */}
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => setShowNotifModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.notifBtnEmoji}>🔔</Text>
                {unreadNotifs > 0 && (
                  <View style={styles.notifDot}>
                    <Text style={styles.notifDotText}>{unreadNotifs}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Banner */}
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

          {/* Patient Digital Health ID Card */}
          <View style={styles.healthIdCard}>
            <View style={styles.healthIdHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.idRow}>
                  <Text style={styles.healthIdName}>{patientUser.full_name}</Text>
                  <View style={styles.idPill}>
                    <Text style={styles.idPillText}>ID: {patientUser.patient_id}</Text>
                  </View>
                </View>
                <Text style={styles.healthIdMeta}>
                  {patientUser.gender} · {patientUser.age} yrs · DOB: {patientUser.date_of_birth || "N/A"}
                </Text>
                <Text style={styles.healthIdContact}>
                  Phone: {patientUser.phone} {patientUser.email ? `· Email: ${patientUser.email}` : ""}
                </Text>

                {/* 1-Tap Summary Export Action */}
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                    marginTop: 8,
                  }}
                  onPress={() => setShowSummaryModal(true)}
                  activeOpacity={0.8}
                >
                  <MedicalIcon name="document" size={14} />
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>
                    1-Tap Health Summary Export
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Health Stats */}
            <View style={styles.healthIdFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>BLOOD GROUP</Text>
                <Text style={styles.footerValue}>{profile?.blood_group || "Not Set"}</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>ACTIVE BOOKINGS</Text>
                <Text style={[styles.footerValue, { color: "#BAE6FD" }]}>{upcomingCount}</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>PRESCRIPTIONS</Text>
                <Text style={styles.footerValue}>{prescriptions.length}</Text>
              </View>
            </View>
          </View>

          {/* SECTION: Today's Medication & Tablet Schedule Widget */}
          {tabletAlerts.length > 0 && (
            <View style={styles.medWidgetCard}>
              <View style={styles.medWidgetHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MedicalIcon name="pills" size={20} color="#0284C7" />
                  <Text style={styles.medWidgetTitle}>Today's Tablet Medication Schedule</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifModal(true)}>
                  <Text style={styles.medWidgetViewAll}>View All →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.doseGrid}>
                {tabletAlerts.slice(0, 3).map((item) => (
                  <View key={item.id} style={[styles.doseCard, item.is_read && styles.doseCardTaken]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doseTimeText}>{item.dosage_time || "Daily Dose"}</Text>
                      <Text style={styles.doseMedName}>{item.medicine_name || item.title}</Text>
                      <Text style={styles.doseInstructions}>{item.message}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.doseActionBtn, item.is_read && styles.doseActionBtnTaken]}
                      onPress={() => handleMarkNotifRead(item.id)}
                      disabled={item.is_read}
                    >
                      <Text style={[styles.doseActionBtnText, item.is_read && styles.doseActionBtnTextTaken]}>
                        {item.is_read ? "✓ Taken" : "Mark Taken"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Primary Action Button: Book Appointment */}
          <TouchableOpacity
            style={styles.bookActionBtn}
            onPress={() => navigation.navigate("AppointmentBooking")}
            activeOpacity={0.85}
          >
            <View style={styles.bookActionContent}>
              <MedicalIcon name="calendar" size={26} color="white" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bookActionTitle}>Book New Consultation Slot</Text>
                <Text style={styles.bookActionSubtitle}>
                  Choose a doctor, select date, and reserve your consultation time slot.
                </Text>
              </View>
              <Text style={styles.bookActionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* SECTION 1: My Scheduled Appointments */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MedicalIcon name="calendar" size={18} color="#0284C7" />
                <Text style={styles.sectionTitle}>
                  My Appointments ({appointments.length})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.smallBookBtn}
                onPress={() => navigation.navigate("AppointmentBooking")}
              >
                <Text style={styles.smallBookBtnText}>+ Book Slot</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ gap: 10, paddingVertical: 10 }}>
                <SkeletonListItem />
                <SkeletonListItem />
              </View>
            ) : appointments.length > 0 ? (
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

                  <View style={styles.infoRow}>
                    <MedicalIcon name="clock" size={14} color="#0284C7" />
                    <Text style={styles.infoText}>
                      <Text style={{ fontWeight: "700" }}>{appt.appointment_date}</Text> at{" "}
                      <Text style={{ fontWeight: "700" }}>{appt.appointment_time}</Text>
                    </Text>
                  </View>

                  {appt.reason ? (
                    <View style={styles.infoRow}>
                      <MedicalIcon name="document" size={14} color="#0284C7" />
                      <Text style={styles.infoText}>Reason: {appt.reason}</Text>
                    </View>
                  ) : null}

                  {appt.status === "Booked" && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelAppointment(appt.id)}
                      disabled={cancellingId === appt.id}
                    >
                      {cancellingId === appt.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <MedicalIcon name="calendar" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Appointments Scheduled</Text>
                <Text style={styles.emptySubtitle}>
                  You do not have any upcoming doctor appointments booked.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBookBtn}
                  onPress={() => navigation.navigate("AppointmentBooking")}
                >
                  <Text style={styles.emptyBookBtnText}>Book Your First Slot</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SECTION 2: My Prescriptions */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <MedicalIcon name="pills" size={18} color="#0284C7" />
              <Text style={styles.sectionTitle}>
                My Prescriptions ({prescriptions.length})
              </Text>
            </View>

            {prescriptions.length > 0 ? (
              prescriptions.map((pres) => (
                <View key={`pres-${pres.id}`} style={styles.prescriptionBox}>
                  <View style={styles.presHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.presDoctor}>{pres.doctor_name}</Text>
                      <Text style={styles.presSpec}>{pres.doctor_specialization}</Text>
                    </View>
                    <Text style={styles.presDate}>Issued: {pres.issue_date}</Text>
                  </View>

                  {/* Medicines */}
                  <View style={styles.medTable}>
                    <View style={styles.medTableHeader}>
                      <Text style={[styles.medHeadCol, { flex: 2 }]}>Medicine</Text>
                      <Text style={[styles.medHeadCol, { flex: 1.2 }]}>Dosage</Text>
                      <Text style={[styles.medHeadCol, { flex: 1.5 }]}>Frequency</Text>
                      <Text style={[styles.medHeadCol, { flex: 1 }]}>Duration</Text>
                    </View>
                    {pres.items.map((item) => (
                      <View key={`item-${item.id}`} style={styles.medTableRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.medName}>{item.medicine_name}</Text>
                          {item.instructions ? (
                            <Text style={styles.medInst}>{item.instructions}</Text>
                          ) : null}
                        </View>
                        <Text style={[styles.medCell, { flex: 1.2 }]}>{item.dosage}</Text>
                        <Text style={[styles.medCell, { flex: 1.5 }]}>{item.frequency}</Text>
                        <Text style={[styles.medCell, { flex: 1 }]}>{item.duration}</Text>
                      </View>
                    ))}
                  </View>

                  {pres.general_instructions ? (
                    <View style={styles.adviceBox}>
                      <Text style={styles.adviceLabel}>Doctor's Advice:</Text>
                      <Text style={styles.adviceText}>{pres.general_instructions}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <MedicalIcon name="pills" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Prescriptions Recorded</Text>
                <Text style={styles.emptySubtitle}>
                  Prescriptions issued by your consulting doctor will be digitally saved here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBookBtn}
                  onPress={() => navigation.navigate("AppointmentBooking")}
                >
                  <Text style={styles.emptyBookBtnText}>Book Doctor Consultation</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SECTION 3: My Consultations & Clinical Vitals */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <MedicalIcon name="records" size={18} color="#0284C7" />
              <Text style={styles.sectionTitle}>
                Consultation & Vitals History ({consultations.length})
              </Text>
            </View>

            {consultations.length > 0 ? (
              consultations.map((c) => (
                <View key={`c-${c.id}`} style={styles.consultBox}>
                  <View style={styles.consultHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.consultDoc}>{c.doctor_name}</Text>
                      <Text style={styles.consultSpec}>{c.doctor_specialization}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <MedicalIcon name="calendar" size={13} color="#627D98" />
                      <Text style={styles.consultDate}>{c.consultation_date}</Text>
                    </View>
                  </View>

                  <View style={styles.diagBox}>
                    <Text style={styles.diagLabel}>DIAGNOSIS</Text>
                    <Text style={styles.diagValue}>{c.diagnosis}</Text>
                  </View>

                  {/* Vitals */}
                  {(c.vital_bp || c.vital_heart_rate || c.vital_temperature || c.vital_weight || c.vital_spo2) && (
                    <View style={styles.vitalsRow}>
                      {c.vital_bp ? <VitalPill label="BP" value={c.vital_bp} /> : null}
                      {c.vital_heart_rate ? <VitalPill label="Pulse" value={`${c.vital_heart_rate} bpm`} /> : null}
                      {c.vital_temperature ? <VitalPill label="Temp" value={`${c.vital_temperature}°F`} /> : null}
                      {c.vital_weight ? <VitalPill label="Weight" value={`${c.vital_weight} kg`} /> : null}
                      {c.vital_spo2 ? <VitalPill label="SpO2" value={`${c.vital_spo2}%`} /> : null}
                    </View>
                  )}

                  {c.notes ? (
                    <Text style={styles.consultNotes}>
                      <Text style={{ fontWeight: "700" }}>Clinical Notes: </Text>
                      {c.notes}
                    </Text>
                  ) : null}

                  {c.follow_up_date ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
                      <MedicalIcon name="calendar" size={14} color="#0284C7" />
                      <Text style={styles.followUp}>
                        Follow-up scheduled on: <Text style={{ fontWeight: "800" }}>{c.follow_up_date}</Text>
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <MedicalIcon name="consultation" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Consultations on Record</Text>
                <Text style={styles.emptySubtitle}>
                  Clinical diagnoses and vitals will appear here after your doctor consultation.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        unreadCount={unreadNotifs}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />

      {/* Animated Appointment Cancel Modal */}
      <AnimatedConfirmModal
        visible={!!pendingCancelApptId}
        type="warning"
        title="Cancel Appointment Slot"
        message="Are you sure you want to cancel this scheduled consultation? This slot will be released back to the clinical schedule."
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        confirming={cancellingId !== null}
        onConfirm={executeCancelAppointment}
        onCancel={() => setPendingCancelApptId(null)}
      />

      {/* Animated Logout Modal */}
      <AnimatedConfirmModal
        visible={showLogoutConfirm}
        type="info"
        title="Log Out of Patient Portal"
        message="Are you sure you want to log out of your MEDCARE AI patient account?"
        confirmText="Log Out"
        cancelText="Stay Logged In"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* 1-Tap Clinical Health Summary Export Modal */}
      <ClinicalSummaryModal
        visible={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        patientName={patientUser.full_name}
        patientId={patientUser.patient_id}
        age={patientUser.age}
        gender={patientUser.gender}
        bloodGroup={profile?.blood_group}
        allergies={profile?.allergies}
        diseases={profile?.existing_diseases}
        medications={prescriptions.flatMap((p) => p.items)}
        consultations={consultations}
        emergencyContact={profile?.emergency_contact}
      />
    </SafeAreaView>
  );
}

function VitalPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.vitalPill}>
      <Text style={styles.vitalPillLabel}>{label}</Text>
      <Text style={styles.vitalPillVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 860,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  brandBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  greeting: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "600",
  },
  userName: {
    color: "#0C2340",
    fontSize: 24,
    fontWeight: "900",
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    position: "relative",
    shadowColor: "#0284C7",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  notifBtnEmoji: {
    fontSize: 20,
  },
  notifDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notifDotText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  signOutBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  signOutBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 13,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  statusError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  statusBannerText: {
    fontWeight: "700",
    fontSize: 14,
  },
  statusSuccessText: {
    color: "#15803D",
  },
  statusErrorText: {
    color: "#B91C1C",
  },
  healthIdCard: {
    backgroundColor: "#0284C7",
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  healthIdHeader: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#0284C7",
    fontSize: 26,
    fontWeight: "900",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  healthIdName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  idPill: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idPillText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },
  healthIdMeta: {
    color: "#E0F2FE",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "600",
  },
  healthIdContact: {
    color: "#E0F2FE",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  healthIdFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
    marginTop: 16,
    paddingTop: 14,
    justifyContent: "space-around",
  },
  footerItem: {
    alignItems: "center",
  },
  footerLabel: {
    color: "#E0F2FE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  footerValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  medWidgetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  medWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  medWidgetTitle: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "900",
  },
  medWidgetViewAll: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  doseGrid: {
    gap: 10,
  },
  doseCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  doseCardTaken: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  doseTimeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  doseMedName: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  doseInstructions: {
    color: "#627D98",
    fontSize: 12,
    marginTop: 2,
  },
  doseActionBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doseActionBtnTaken: {
    backgroundColor: "#E2E8F0",
  },
  doseActionBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  doseActionBtnTextTaken: {
    color: "#64748B",
  },
  bookActionBtn: {
    backgroundColor: "#0284C7",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  bookActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bookActionIcon: {
    fontSize: 28,
  },
  bookActionTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },
  bookActionSubtitle: {
    color: "#E0F2FE",
    fontSize: 12,
    marginTop: 2,
  },
  bookActionArrow: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#0C2340",
    fontSize: 17,
    fontWeight: "900",
  },
  smallBookBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBookBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },
  appointmentBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  doctorName: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
  },
  doctorSpec: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBooked: {
    backgroundColor: "#DCFCE7",
  },
  statusCompleted: {
    backgroundColor: "#E0E7FF",
  },
  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusBookedText: {
    color: "#15803D",
  },
  statusCompletedText: {
    color: "#4338CA",
  },
  statusCancelledText: {
    color: "#B91C1C",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  infoText: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "600",
  },
  reasonBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  reasonText: {
    color: "#334E68",
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
  },
  prescriptionBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 10,
  },
  presHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  presDoctor: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
  },
  presSpec: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
  },
  presDate: {
    color: "#627D98",
    fontSize: 12,
  },
  medTable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    overflow: "hidden",
  },
  medTableHeader: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: 8,
  },
  medHeadCol: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 11,
  },
  medTableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0F2FE",
    alignItems: "center",
  },
  medName: {
    color: "#0C2340",
    fontWeight: "800",
    fontSize: 12,
  },
  medInst: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "600",
  },
  medCell: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "600",
  },
  adviceBox: {
    backgroundColor: "#E0F2FE",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  adviceLabel: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
  },
  adviceText: {
    color: "#0C2340",
    fontSize: 12,
    marginTop: 2,
  },
  consultBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 12,
  },
  consultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  consultDoc: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
  },
  consultSpec: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
  },
  consultDate: {
    color: "#627D98",
    fontSize: 12,
    fontWeight: "600",
  },
  diagBox: {
    backgroundColor: "#E0F2FE",
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0284C7",
    marginBottom: 8,
  },
  diagLabel: {
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "800",
  },
  diagValue: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  vitalsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  vitalPill: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: "row",
    gap: 4,
  },
  vitalPillLabel: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "800",
  },
  vitalPillVal: {
    color: "#0C2340",
    fontSize: 11,
    fontWeight: "800",
  },
  consultNotes: {
    color: "#334E68",
    fontSize: 12,
    lineHeight: 16,
  },
  followUp: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: "#627D98",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  emptyBookBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBookBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
});


