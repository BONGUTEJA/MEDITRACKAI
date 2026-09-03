import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { createDoctor, deleteDoctor, Doctor, getDoctors } from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedConfirmModal from "../components/AnimatedConfirmModal";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";
import MedicalIcon from "../components/MedicalIcon";
import QuickFilterChips, { FilterChipOption } from "../components/QuickFilterChips";
import ToastManager, { ToastMessage } from "../components/ToastManager";

type Props = NativeStackScreenProps<RootStackParamList, "DoctorDirectory">;

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Gynecology",
  "ENT Specialist",
  "Ophthalmology",
];

export default function DoctorDirectoryScreen({ navigation }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Animated Modal States
  const [pendingDeleteDoctor, setPendingDeleteDoctor] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState<Doctor | null>(null);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoctors();
      setDoctors(data);
    } catch {
      setStatusBanner({ type: "error", text: "Failed to load medical specialists roster." });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, [loadDoctors])
  );

  const handleAddDoctor = async () => {
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !specialization || !cleanPhone || !cleanEmail) {
      setModalError("Please fill in all fields (Full Name, Specialization, Phone, and Email).");
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      const newDoc = await createDoctor({
        full_name: cleanName.startsWith("Dr.") ? cleanName : `Dr. ${cleanName}`,
        specialization,
        phone: cleanPhone,
        email: cleanEmail,
      });

      setShowAddModal(false);
      setFullName("");
      setPhone("");
      setEmail("");
      setSpecialization(SPECIALIZATIONS[0]);

      setCreatedDoctor(newDoc);
      loadDoctors();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to add doctor. Please try again.";
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setPendingDeleteDoctor(doctor);
  };

  const executeDeleteDoctor = async () => {
    if (!pendingDeleteDoctor) return;
    const { id: docId, full_name: docName } = pendingDeleteDoctor;

    try {
      setIsDeleting(true);
      await deleteDoctor(docId);
      setPendingDeleteDoctor(null);
      setStatusBanner({ type: "success", text: `${docName} removed from active roster.` });
      setTimeout(() => setStatusBanner(null), 3000);
      loadDoctors();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not remove doctor.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addDoctorBtn}
              onPress={() => {
                setModalError(null);
                setShowAddModal(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.addDoctorBtnText}>+ Add Specialist</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowBadgeText}>CLINICAL STAFF ROSTER</Text>
            </View>
            <Text style={styles.title}>Specialist Physician Directory</Text>
            <Text style={styles.subtitle}>
              Attending doctors, medical departments, contact channels, and live consultation scheduling status.
            </Text>
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

          {/* Overview KPI Card */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>TOTAL SPECIALISTS</Text>
              <Text style={styles.statNumber}>{doctors.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>DEPARTMENTS</Text>
              <Text style={styles.statNumber}>
                {new Set(doctors.map((d) => d.specialization)).size}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={[styles.statNumber, { color: "#34D399", fontSize: 18, marginTop: 8 }]}>
                ● Active
              </Text>
            </View>
          </View>

          {/* Search & Instant Department Filter */}
          <View style={{ marginBottom: 12 }}>
            <View style={styles.searchBar}>
              <MedicalIcon name="search" size={16} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search specialist by name or department..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                  <Text style={{ color: "#94A3B8", fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Department Quick Filter Chips */}
          <QuickFilterChips
            selectedKey={selectedDepartment}
            onSelect={setSelectedDepartment}
            options={[
              { key: "ALL", label: "All Departments", count: doctors.length },
              ...Array.from(new Set(doctors.map((d) => d.specialization))).map((spec) => ({
                key: spec,
                label: spec,
                count: doctors.filter((d) => d.specialization === spec).length,
              })),
            ]}
          />

          {/* Doctors Grid */}
          <Text style={styles.sectionHeader}>Attending Medical Practitioners</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.loadingText}>Loading physician directory...</Text>
            </View>
          ) : (
            <View style={styles.doctorGrid}>
              {doctors
                .filter((doc) => {
                  const matchSearch =
                    doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchDept = selectedDepartment === "ALL" || doc.specialization === selectedDepartment;
                  return matchSearch && matchDept;
                })
                .map((doc) => {
                const initial = doc.full_name.replace("Dr. ", "").charAt(0).toUpperCase();

                return (
                  <View key={doc.id} style={styles.doctorCard}>
                    {/* Header with Avatar and Availability */}
                    <View style={styles.docCardHeader}>
                      <View style={styles.docAvatarCircle}>
                        <Text style={styles.docAvatarText}>{initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Text style={styles.docName}>{doc.full_name}</Text>
                          <View style={styles.statusLivePill}>
                            <Text style={styles.statusLiveText}>🟢 Available Today</Text>
                          </View>
                        </View>
                        <View style={styles.specBadge}>
                          <Text style={styles.specBadgeText}>🩺 {doc.specialization}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Metadata Chips Bar */}
                    <View style={styles.metaChipsRow}>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>⭐ 10+ Yrs Exp</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>🕒 Next Slot: 09:30 AM</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>🏥 OP Suite 204</Text>
                      </View>
                    </View>

                    {/* Contact Details */}
                    <View style={styles.docContactInfo}>
                      <View style={styles.contactRow}>
                        <MedicalIcon name="phone" size={14} color="#0284C7" />
                        <Text style={styles.contactText}>{doc.phone}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <MedicalIcon name="email" size={14} color="#0284C7" />
                        <Text style={styles.contactText} numberOfLines={1}>
                          {doc.email}
                        </Text>
                      </View>
                    </View>

                    {/* Button Hierarchy Actions */}
                    <View style={styles.docActionsRow}>
                      <TouchableOpacity
                        style={styles.bookSlotBtn}
                        onPress={() => navigation.navigate("AppointmentBooking")}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <MedicalIcon name="calendar" size={14} color="white" />
                          <Text style={styles.bookSlotBtnText}>Book Appointment →</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteDocBtn}
                        onPress={() => handleDeleteDoctor(doc)}
                        activeOpacity={0.8}
                        accessibilityLabel="Delete Doctor"
                      >
                        <MedicalIcon name="trash" size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Doctor Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add Medical Specialist</Text>
                <Text style={styles.modalSubtitle}>
                  Register a doctor to the hospital consultation roster.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {modalError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>⚠️ {modalError}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Doctor Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    placeholderTextColor="#94A3B8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Medical Specialization</Text>
                  <View style={styles.specChipsRow}>
                    {SPECIALIZATIONS.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.specChip,
                          specialization === spec && styles.specChipActive,
                        ]}
                        onPress={() => setSpecialization(spec)}
                      >
                        <Text
                          style={[
                            styles.specChipText,
                            specialization === spec && styles.specChipTextActive,
                          ]}
                        >
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. dr.rajesh@meditrack.org"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveDoctorBtn, saving && styles.disabled]}
              onPress={handleAddDoctor}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveDoctorBtnText}>Add Doctor to Roster →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Animated Delete Confirmation Modal */}
      <AnimatedConfirmModal
        visible={!!pendingDeleteDoctor}
        type="danger"
        title="Remove Specialist from Roster"
        message="Are you sure you want to remove this physician from the active clinical directory? Future booking slots with this doctor will be disabled."
        highlightLabel="Specialist Name"
        highlightValue={
          pendingDeleteDoctor
            ? `${pendingDeleteDoctor.full_name} (${pendingDeleteDoctor.specialization})`
            : undefined
        }
        confirmText="Remove Doctor"
        confirming={isDeleting}
        onConfirm={executeDeleteDoctor}
        onCancel={() => setPendingDeleteDoctor(null)}
      />

      {/* Animated Add Success Modal */}
      <AnimatedSuccessModal
        visible={!!createdDoctor}
        title="Specialist Added Successfully!"
        subtitle={`${createdDoctor?.full_name} is now registered in ${createdDoctor?.specialization}. Patients and staff can now schedule consultation slots.`}
        highlightLabel="Specialist Profile"
        highlightValue={createdDoctor?.full_name}
        primaryButtonText="Done"
        onPrimaryAction={() => setCreatedDoctor(null)}
      />

      {/* Floating Toast Notification System */}
      <ToastManager toasts={toasts} onDismiss={removeToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0C2340",
    outlineWidth: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 960,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 15,
  },
  addDoctorBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  addDoctorBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  headingBox: {
    marginBottom: 20,
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
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    width: "100%",
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
  statsCard: {
    backgroundColor: "#0284C7",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  statCol: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  statLabel: {
    color: "#E0F2FE",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  statNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  sectionHeader: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },
  loadingBox: {
    padding: 50,
    alignItems: "center",
  },
  loadingText: {
    color: "#627D98",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  doctorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    width: "100%",
  },
  doctorCard: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  docCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  docAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarText: {
    color: "#0284C7",
    fontSize: 20,
    fontWeight: "900",
  },
  docName: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
  },
  specBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  specBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "800",
  },
  statusLivePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusLiveText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaChipText: {
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "700",
  },
  docContactInfo: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#E0F2FE",
    paddingTop: 10,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactIcon: {
    fontSize: 13,
  },
  contactText: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "600",
  },
  docActionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0F2FE",
    paddingTop: 12,
  },
  bookSlotBtn: {
    flex: 1,
    backgroundColor: "#0284C7",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  bookSlotBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },
  deleteDocBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  deleteDocBtnText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12, 35, 64, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#0C2340",
    fontSize: 20,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: "#334E68",
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseBtnText: {
    color: "#627D98",
    fontSize: 18,
    fontWeight: "900",
  },
  modalErrorBox: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  modalErrorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
  modalForm: {
    gap: 14,
    paddingBottom: 10,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 12,
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "600",
  },
  specChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  specChip: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  specChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  specChipText: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "700",
  },
  specChipTextActive: {
    color: "white",
    fontWeight: "800",
  },
  saveDoctorBtn: {
    backgroundColor: "#0284C7",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveDoctorBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
