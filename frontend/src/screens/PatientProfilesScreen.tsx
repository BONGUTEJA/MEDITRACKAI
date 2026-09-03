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
import { deletePatient, getPatients, Patient } from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedConfirmModal from "../components/AnimatedConfirmModal";
import MedicalIcon from "../components/MedicalIcon";
import QuickFilterChips from "../components/QuickFilterChips";
import ToastManager, { ToastMessage } from "../components/ToastManager";

type Props = NativeStackScreenProps<RootStackParamList, "PatientProfiles">;

export default function PatientProfilesScreen({ navigation }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Animated Confirmation Modal State
  const [pendingDeletePatient, setPendingDeletePatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not load patients list.";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDeletePatient = (patient: Patient) => {
    setPendingDeletePatient(patient);
  };

  const executeDeletePatient = async () => {
    if (!pendingDeletePatient) return;
    const pat = pendingDeletePatient;

    try {
      setIsDeleting(true);
      setDeletingId(pat.patient_id);
      await deletePatient(pat.patient_id);
      setPendingDeletePatient(null);
      addToast("success", `Patient record ${pat.patient_id} deleted successfully.`);
      await load();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to delete patient.";
      addToast("error", msg);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const term = search.toLowerCase().trim();
    const matchSearch =
      !term ||
      p.full_name.toLowerCase().includes(term) ||
      p.patient_id.toLowerCase().includes(term) ||
      p.phone.includes(term);

    let matchCategory = true;
    if (filterCategory === "MALE") matchCategory = p.gender?.toLowerCase() === "male";
    else if (filterCategory === "FEMALE") matchCategory = p.gender?.toLowerCase() === "female";
    else if (filterCategory === "PEDIATRIC") matchCategory = p.age < 18;
    else if (filterCategory === "SENIOR") matchCategory = p.age >= 60;

    return matchSearch && matchCategory;
  });

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
            <TouchableOpacity
              style={styles.newPatientBtn}
              onPress={() => navigation.navigate("PatientRegistration")}
              activeOpacity={0.85}
            >
              <Text style={styles.newPatientBtnText}>+ Register Patient</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowBadgeText}>PATIENT RECORDS</Text>
            </View>
            <Text style={styles.title}>Patient Medical Records</Text>
            <Text style={styles.subtitle}>
              Search registered patients, review clinical histories, manage consultations, or remove outdated records.
            </Text>
          </View>

          {/* Status Feedback Banner */}
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

          {/* Search Header */}
          <View style={styles.searchCard}>
            <View style={styles.searchRow}>
              <MedicalIcon name="search" size={16} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by Patient Name, ID (e.g. 001), or Phone..."
                placeholderTextColor="#94A3B8"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.searchMetaRow}>
              <Text style={styles.countText}>
                Showing <Text style={{ fontWeight: "900", color: "#0284C7" }}>{filteredPatients.length}</Text> of {patients.length} registered patients
              </Text>
            </View>
          </View>

          {/* Quick Filter Chips */}
          <QuickFilterChips
            selectedKey={filterCategory}
            onSelect={setFilterCategory}
            options={[
              { key: "ALL", label: "All Patients", count: patients.length },
              { key: "MALE", label: "Male Patients", count: patients.filter((p) => p.gender?.toLowerCase() === "male").length },
              { key: "FEMALE", label: "Female Patients", count: patients.filter((p) => p.gender?.toLowerCase() === "female").length },
              { key: "PEDIATRIC", label: "Pediatric (<18)", count: patients.filter((p) => p.age < 18).length },
              { key: "SENIOR", label: "Seniors (60+)", count: patients.filter((p) => p.age >= 60).length },
            ]}
          />

          {/* View Mode Switcher */}
          <View style={styles.viewModeRow}>
            <Text style={styles.viewModeLabel}>DISPLAY FORMAT:</Text>
            <View style={styles.viewModeToggleGroup}>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === "table" && styles.viewModeBtnActive]}
                onPress={() => setViewMode("table")}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewModeBtnText, viewMode === "table" && styles.viewModeBtnTextActive]}>
                  📋 Dense Table
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeBtn, viewMode === "cards" && styles.viewModeBtnActive]}
                onPress={() => setViewMode("cards")}
                activeOpacity={0.8}
              >
                <Text style={[styles.viewModeBtnText, viewMode === "cards" && styles.viewModeBtnTextActive]}>
                  📇 Patient Cards
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={{ marginTop: 12, color: "#64748B", fontWeight: "600" }}>
                Loading patient records...
              </Text>
            </View>
          ) : filteredPatients.length > 0 ? (
            viewMode === "table" ? (
              /* DENSE ADMINISTRATIVE DATA TABLE */
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 1.1 }]}>PATIENT ID</Text>
                  <Text style={[styles.thCell, { flex: 2.2 }]}>FULL NAME</Text>
                  <Text style={[styles.thCell, { flex: 1.4 }]}>DEMOGRAPHICS</Text>
                  <Text style={[styles.thCell, { flex: 1.8 }]}>CONTACT</Text>
                  <Text style={[styles.thCell, { flex: 1.3 }]}>STATUS</Text>
                  <Text style={[styles.thCell, { flex: 2.2, textAlign: "right" }]}>ACTIONS</Text>
                </View>

                {filteredPatients.map((patient, idx) => {
                  const initial = patient.full_name.charAt(0).toUpperCase();
                  const isDeleting = deletingId === patient.patient_id;
                  const isEven = idx % 2 === 0;

                  return (
                    <View
                      key={patient.id}
                      style={[styles.tableRow, isEven && styles.tableRowEven]}
                    >
                      {/* 1. Patient ID */}
                      <View style={{ flex: 1.1 }}>
                        <View style={styles.tableIdBadge}>
                          <Text style={styles.tableIdBadgeText}>{patient.patient_id}</Text>
                        </View>
                      </View>

                      {/* 2. Full Name & Avatar */}
                      <View style={{ flex: 2.2, flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={styles.tableAvatar}>
                          <Text style={styles.tableAvatarText}>{initial}</Text>
                        </View>
                        <View>
                          <Text style={styles.tablePatientName}>{patient.full_name}</Text>
                          <Text style={styles.tableSubText}>Blood: O+</Text>
                        </View>
                      </View>

                      {/* 3. Demographics */}
                      <View style={{ flex: 1.4 }}>
                        <Text style={styles.tableCellText}>{patient.age} yrs</Text>
                        <Text style={styles.tableSubText}>{patient.gender}</Text>
                      </View>

                      {/* 4. Contact */}
                      <View style={{ flex: 1.8 }}>
                        <Text style={styles.tableCellText}>{patient.phone}</Text>
                        {patient.email ? (
                          <Text style={styles.tableSubText} numberOfLines={1}>
                            {patient.email}
                          </Text>
                        ) : null}
                      </View>

                      {/* 5. Status */}
                      <View style={{ flex: 1.3 }}>
                        <View style={styles.tableStatusPill}>
                          <Text style={styles.tableStatusPillText}>🟢 Active EHR</Text>
                        </View>
                      </View>

                      {/* 6. Action Buttons */}
                      <View style={{ flex: 2.2, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <TouchableOpacity
                          style={styles.tableActionPrimary}
                          onPress={() =>
                            navigation.navigate("PatientMedicalProfile", {
                              patientId: patient.patient_id,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tableActionPrimaryText}>Dossier →</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.tableActionSecondary}
                          onPress={() =>
                            navigation.navigate("Consultation", {
                              patientId: patient.id,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tableActionSecondaryText}>Consult</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.tableActionTrash}
                          onPress={() => handleDeletePatient(patient)}
                          disabled={isDeleting}
                          activeOpacity={0.7}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#94A3B8" />
                          ) : (
                            <MedicalIcon name="trash" size={13} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              /* CARD GRID VIEW */
              <View style={styles.patientGrid}>
                {filteredPatients.map((patient) => {
                  const initial = patient.full_name.charAt(0).toUpperCase();
                  const isDeleting = deletingId === patient.patient_id;

                  return (
                    <View key={patient.id} style={styles.patientCard}>
                      <View style={styles.patientCardHeader}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.nameRow}>
                            <Text style={styles.patientName}>{patient.full_name}</Text>
                            <View style={styles.idBadge}>
                              <Text style={styles.idBadgeText}>ID: {patient.patient_id}</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <Text style={styles.patientMeta}>
                              {patient.age} yrs · {patient.gender} ·
                            </Text>
                            <MedicalIcon name="phone" size={12} color="#0284C7" />
                            <Text style={styles.patientMeta}>{patient.phone}</Text>
                          </View>
                          {patient.email ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <MedicalIcon name="email" size={12} color="#0284C7" />
                              <Text style={styles.patientSubMeta}>{patient.email}</Text>
                            </View>
                          ) : null}

                          {/* Rich Context Chips */}
                          <View style={styles.richChipsRow}>
                            <View style={styles.bloodChip}>
                              <Text style={styles.bloodChipText}>🩸 Blood Group: O+</Text>
                            </View>
                            <View style={styles.allergyChip}>
                              <Text style={styles.allergyChipText}>⚠️ No Known Allergies</Text>
                            </View>
                            <View style={styles.statusChip}>
                              <Text style={styles.statusChipText}>🕒 Active EHR</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Card Actions */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.primaryActionBtn}
                          onPress={() =>
                            navigation.navigate("PatientMedicalProfile", {
                              patientId: patient.patient_id,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.primaryActionText}>View Full Profile →</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          onPress={() =>
                            navigation.navigate("Consultation", {
                              patientId: patient.id,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <MedicalIcon name="consultation" size={13} color="#0284C7" />
                            <Text style={styles.secondaryActionText}>Consult</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.subduedTrashBtn}
                          onPress={() => handleDeletePatient(patient)}
                          disabled={isDeleting}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete Patient Record"
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#94A3B8" />
                          ) : (
                            <MedicalIcon name="trash" size={15} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : (
            <View style={styles.emptyCard}>
              <MedicalIcon name="patients" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Patients Found</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `No registered patient matching "${search}".`
                  : "No registered patients yet. Onboard your first patient record."}
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
                {search ? (
                  <TouchableOpacity
                    style={styles.clearSearchBtn}
                    onPress={() => setSearch("")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearSearchBtnText}>Clear Search ✕</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => navigation.navigate("PatientRegistration")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>+ Register New Patient</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Animated Delete Confirmation Modal */}
      <AnimatedConfirmModal
        visible={!!pendingDeletePatient}
        type="danger"
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient record? This will also remove all associated appointments, consultations, and digital prescriptions."
        highlightLabel="Patient Record"
        highlightValue={
          pendingDeletePatient
            ? `${pendingDeletePatient.full_name} (ID: ${pendingDeletePatient.patient_id})`
            : undefined
        }
        confirmText="Delete Record"
        confirming={isDeleting}
        onConfirm={executeDeletePatient}
        onCancel={() => setPendingDeletePatient(null)}
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
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 1180,
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
    paddingHorizontal: 4,
  },
  backText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 15,
  },
  newPatientBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  newPatientBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  headingBox: {
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
    minWidth: 260,
  },
  backLink: {
    marginBottom: 6,
  },
  backLinkText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "800",
  },
  eyebrowBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
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
  addBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  addBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
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
    fontSize: 13,
  },
  statusSuccessText: {
    color: "#15803D",
  },
  statusErrorText: {
    color: "#B91C1C",
  },
  searchCard: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 22,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 6,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: "#627D98",
    fontSize: 16,
    fontWeight: "800",
  },
  searchMetaRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0F2FE",
    marginTop: 10,
    paddingTop: 8,
  },
  countText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingBox: {
    padding: 50,
    alignItems: "center",
  },
  patientGrid: {
    gap: 14,
  },
  patientCard: {
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
  patientCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#0284C7",
    fontSize: 22,
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  patientName: {
    color: "#0C2340",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  idBadge: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idBadgeText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "900",
  },
  patientMeta: {
    color: "#627D98",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  patientSubMeta: {
    color: "#627D98",
    fontSize: 12,
    marginTop: 2,
  },
  richChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  bloodChip: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bloodChipText: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "800",
  },
  allergyChip: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allergyChipText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "800",
  },
  statusChip: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0F2FE",
    paddingTop: 12,
    alignItems: "center",
  },
  primaryActionBtn: {
    flex: 1.5,
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryActionText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  subduedTrashBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchBtn: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearSearchBtnText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: 20,
    padding: 36,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    color: "#0C2340",
    fontSize: 18,
    fontWeight: "900",
  },
  emptySubtitle: {
    color: "#627D98",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
    maxWidth: 380,
    lineHeight: 18,
  },
  emptyAddBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },
  // View Mode Switcher
  viewModeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  viewModeLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  viewModeToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  viewModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  viewModeBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  viewModeBtnTextActive: {
    color: "#0284C7",
    fontWeight: "900",
  },
  // Dense Table Styles
  tableCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#BAE6FD",
  },
  thCell: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableRowEven: {
    backgroundColor: "#F8FAFC",
  },
  tableIdBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignSelf: "flex-start",
  },
  tableIdBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
  },
  tableAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  tableAvatarText: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "900",
  },
  tablePatientName: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
  },
  tableCellText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  tableSubText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
  tableStatusPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignSelf: "flex-start",
  },
  tableStatusPillText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  tableActionPrimary: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tableActionPrimaryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  tableActionSecondary: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tableActionSecondaryText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "700",
  },
  tableActionTrash: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
});


