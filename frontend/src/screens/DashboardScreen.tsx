import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import {
  AppointmentRecord,
  Consultation,
  getAppointments,
  getConsultations,
  getDoctors,
  getPatients,
  Patient,
} from "../services/medtrackService";
import {
  getStaffNotifications,
  markAllPatientNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "../services/notificationService";
import NotificationCenterModal from "../components/NotificationCenterModal";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedConfirmModal from "../components/AnimatedConfirmModal";
import MedicalIcon from "../components/MedicalIcon";
import { SkeletonKpiCard } from "../components/SkeletonLoader";
import ThemeToggleBtn from "../components/ThemeToggleBtn";
import DashboardCharts from "../components/DashboardCharts";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
  const [stats, setStats] = useState({
    patientsCount: 0,
    doctorsCount: 0,
    consultationsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Active Shift Workspace Data
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<AppointmentRecord[]>([]);
  const [quickSearch, setQuickSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Global Keyboard Shortcuts (Web): Press / or Ctrl+K to search
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleKeyDown = (e: any) => {
        const activeTag = document.activeElement?.tagName;
        if (
          (e.key === "/" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")
        ) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [patientsRes, doctorsRes, consultsRes, apptsRes, notifRes] = await Promise.allSettled([
        getPatients(),
        getDoctors(),
        getConsultations(),
        getAppointments(),
        getStaffNotifications(),
      ]);

      const pList = patientsRes.status === "fulfilled" ? patientsRes.value : [];
      const dCount = doctorsRes.status === "fulfilled" ? doctorsRes.value.length : 0;
      const cList = consultsRes.status === "fulfilled" ? consultsRes.value : [];
      const aList = apptsRes.status === "fulfilled" ? apptsRes.value : [];

      setPatientsList(pList);
      setRecentConsultations(cList);
      setAppointmentsList(aList);

      setStats({
        patientsCount: pList.length,
        doctorsCount: dCount,
        consultationsCount: cList.length,
      });

      if (notifRes.status === "fulfilled") {
        setNotifications(notifRes.value.notifications);
        setUnreadNotifs(notifRes.value.unread_count);
      }
    } catch {
      // Handled silently
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardStats();
    }, [loadDashboardStats])
  );

  if (!user) {
    navigation.replace("Login");
    return null;
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigation.replace("Login");
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    loadDashboardStats();
  };

  const initial = user.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.containerMaxWidth}>
          {/* Top Clinical Header Bar */}
          <View style={styles.header}>
            <View>
              <View style={styles.brandRow}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>MEDCARE AI CLINICAL</Text>
                </View>
                <View style={styles.systemStatus}>
                  <View style={styles.statusDot} />
                  <Text style={styles.systemStatusText}>System Live</Text>
                </View>
              </View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Theme Toggle Button */}
              <ThemeToggleBtn variant="icon" />

              {/* Notification Bell */}
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => setShowNotifModal(true)}
                activeOpacity={0.8}
              >
                <MedicalIcon name="bell" size={20} color="#0284C7" />
                {unreadNotifs > 0 && (
                  <View style={styles.notifDot}>
                    <Text style={styles.notifDotText}>{unreadNotifs}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowProfileMenu(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Patient Search (1-Step Dossier Lookup) */}
          <View style={styles.quickSearchCard}>
            <View style={styles.quickSearchRow}>
              <MedicalIcon name="search" size={16} />
              <TextInput
                ref={searchInputRef}
                style={styles.quickSearchInput}
                placeholder="Quick Search Patient (Name, ID e.g. 001, or Phone)..."
                placeholderTextColor="#94A3B8"
                value={quickSearch}
                onChangeText={setQuickSearch}
              />
              {Platform.OS === "web" && (
                <View style={styles.kbdBadge}>
                  <Text style={styles.kbdText}>Ctrl + K</Text>
                </View>
              )}
              {quickSearch.length > 0 && (
                <TouchableOpacity onPress={() => setQuickSearch("")} style={{ padding: 4 }}>
                  <Text style={{ color: "#94A3B8", fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {quickSearch.trim().length > 0 && (
              <View style={styles.quickSearchResults}>
                {patientsList
                  .filter(
                    (p) =>
                      p.full_name.toLowerCase().includes(quickSearch.toLowerCase()) ||
                      p.patient_id.toLowerCase().includes(quickSearch.toLowerCase()) ||
                      p.phone.includes(quickSearch)
                  )
                  .slice(0, 5)
                  .map((pat) => (
                    <TouchableOpacity
                      key={pat.id}
                      style={styles.quickSearchItem}
                      onPress={() => {
                        setQuickSearch("");
                        navigation.navigate("PatientMedicalProfile", { patientId: pat.patient_id });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quickSearchItemName}>{pat.full_name}</Text>
                        <Text style={styles.quickSearchItemMeta}>
                          ID: {pat.patient_id} · {pat.age} yrs · {pat.gender} · {pat.phone}
                        </Text>
                      </View>
                      <Text style={styles.quickSearchItemAction}>View Record →</Text>
                    </TouchableOpacity>
                  ))}
                {patientsList.filter(
                  (p) =>
                    p.full_name.toLowerCase().includes(quickSearch.toLowerCase()) ||
                    p.patient_id.toLowerCase().includes(quickSearch.toLowerCase()) ||
                    p.phone.includes(quickSearch)
                ).length === 0 && (
                  <View style={styles.quickSearchEmpty}>
                    <Text style={styles.quickSearchEmptyText}>No matching patients found.</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Hero Clinical Workstation Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroPill}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MedicalIcon name="hospital" size={14} color="#E0F2FE" />
                  <Text style={styles.heroPillText}>Integrated Clinical Management</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Clinical Excellence & Patient Care</Text>
              <Text style={styles.heroBody}>
                Streamline hospital intake, schedule consultation slots, track clinical vitals, and issue digital prescriptions seamlessly.
              </Text>
              <View style={styles.heroButtonRow}>
                <TouchableOpacity
                  style={styles.heroPrimaryBtn}
                  onPress={() => navigation.navigate("PatientRegistration")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroPrimaryBtnText}>+ Register New Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() => navigation.navigate("Consultation")}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MedicalIcon name="consultation" size={15} color="white" />
                    <Text style={styles.heroSecondaryBtnText}>Start Consultation</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Live Clinical KPI Statistics */}
          <Text style={styles.sectionTitle}>Hospital Metrics Overview</Text>
          {loadingStats ? (
            <View style={styles.kpiGrid}>
              <SkeletonKpiCard />
              <SkeletonKpiCard />
              <SkeletonKpiCard />
            </View>
          ) : (
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiIconBox}>
                  <MedicalIcon name="patients" size={48} />
                </View>
                <Text style={styles.kpiNumber}>{stats.patientsCount}</Text>
                <Text style={styles.kpiLabel}>Total Patients</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiIconBox}>
                  <MedicalIcon name="consultation" size={48} />
                </View>
                <Text style={styles.kpiNumber}>{stats.consultationsCount}</Text>
                <Text style={styles.kpiLabel}>Consultations Done</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiIconBox}>
                  <MedicalIcon name="doctor" size={48} />
                </View>
                <Text style={styles.kpiNumber}>{stats.doctorsCount}</Text>
                <Text style={styles.kpiLabel}>Active Specialists</Text>
              </View>
            </View>
          )}

          {/* 🚀 Phase 3: Dashboard Clinical Data Visualization Charts */}
          <DashboardCharts
            patientsCount={stats.patientsCount}
            consultationsCount={stats.consultationsCount}
            doctorsCount={stats.doctorsCount}
          />

          {/* Module Action Grid */}
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
            Clinical Management Modules
          </Text>
          <View style={styles.grid}>
            {/* 1. Register Patient */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("PatientRegistration")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="register" size={48} />
              </View>
              <Text style={styles.tileTitle}>Register Patient</Text>
              <Text style={styles.tileSubtitle}>
                Onboard new patients, generate unique medical ID, and record basic profile info.
              </Text>
            </TouchableOpacity>

            {/* 2. Patient Records */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("PatientProfiles")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="records" size={48} />
              </View>
              <Text style={styles.tileTitle}>Patient Records & Dossiers</Text>
              <Text style={styles.tileSubtitle}>
                Search patient directory, review complete medical histories, and manage profiles.
              </Text>
            </TouchableOpacity>

            {/* 3. Schedule Appointment */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("AppointmentBooking")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="calendar" size={48} />
              </View>
              <Text style={styles.tileTitle}>Book Appointment Slot</Text>
              <Text style={styles.tileSubtitle}>
                Select doctors, verify live available slots, and schedule visits.
              </Text>
            </TouchableOpacity>

            {/* 4. Consultation & Rx */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("Consultation")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="consultation" size={48} />
              </View>
              <Text style={styles.tileTitle}>Consultation & Prescriptions</Text>
              <Text style={styles.tileSubtitle}>
                Record vitals (BP, SpO2, Pulse), enter diagnoses, and issue medication lists.
              </Text>
            </TouchableOpacity>

            {/* 5. Doctor Directory */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("DoctorDirectory")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="doctor" size={48} />
              </View>
              <Text style={styles.tileTitle}>Specialist Directory</Text>
              <Text style={styles.tileSubtitle}>
                Manage attending physicians, departmental specialties, and consultation availability.
              </Text>
            </TouchableOpacity>

            {/* 6. Hospital Analytics */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("Analytics")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="analytics" size={48} />
              </View>
              <Text style={styles.tileTitle}>Hospital Analytics & Reports</Text>
              <Text style={styles.tileSubtitle}>
                Executive KPIs, age & gender demographics, physician workload, and 1-click CSV/PDF exports.
              </Text>
            </TouchableOpacity>

            {/* 7. Security Audit Trail */}
            <TouchableOpacity
              style={styles.tile}
              onPress={() => navigation.navigate("AuditLogs")}
              activeOpacity={0.7}
            >
              <View style={styles.tileIconContainer}>
                <MedicalIcon name="security" size={48} />
              </View>
              <Text style={styles.tileTitle}>System Audit Trail & Security</Text>
              <Text style={styles.tileSubtitle}>
                Full immutable event audit trail, practitioner actions, IP tracking, and security controls monitoring.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Sign Out Footer */}
          <View style={styles.footerBox}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MedicalIcon name="logout" size={16} color="#DC2626" />
                <Text style={styles.logoutText}>Sign Out of Workstation</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        notifications={notifications}
        unreadCount={unreadNotifs}
        onMarkRead={handleMarkRead}
        onMarkAllRead={async () => {
          await markAllPatientNotificationsRead(user.id);
          loadDashboardStats();
        }}
      />

      {/* Animated Sign Out Confirmation Modal */}
      <AnimatedConfirmModal
        visible={showLogoutConfirm}
        type="warning"
        title="Sign Out of Workstation"
        message="Are you sure you want to end your active clinical session? You will need to log back in to access patient records."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Sticky Header Profile Dropdown Modal */}
      <Modal
        visible={showProfileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileDropdownMenu}>
            <View style={styles.profileDropdownHeader}>
              <View style={styles.dropdownAvatarCircle}>
                <Text style={styles.dropdownAvatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownUserName}>{user.name}</Text>
                <Text style={styles.dropdownUserRole}>Staff Physician / Administrator</Text>
                <Text style={styles.dropdownUserEmail}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate("Profile");
              }}
              activeOpacity={0.7}
            >
              <MedicalIcon name="user" size={16} color="#0284C7" />
              <Text style={styles.dropdownItemText}>My Profile & Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate("AuditLogs");
              }}
              activeOpacity={0.7}
            >
              <MedicalIcon name="security" size={16} color="#0284C7" />
              <Text style={styles.dropdownItemText}>System Audit & Traceability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                navigation.navigate("Analytics");
              }}
              activeOpacity={0.7}
            >
              <MedicalIcon name="analytics" size={16} color="#0284C7" />
              <Text style={styles.dropdownItemText}>Hospital Reports & Exports</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* Dark Mode Toggle In Profile Menu */}
            <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <ThemeToggleBtn variant="full" />
            </View>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={[styles.dropdownItem, { paddingVertical: 10 }]}
              onPress={() => {
                setShowProfileMenu(false);
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <MedicalIcon name="logout" size={16} color="#DC2626" />
              <Text style={[styles.dropdownItemText, { color: "#DC2626", fontWeight: "800" }]}>
                Sign Out of Workstation
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  glowTopRight: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(56, 189, 248, 0.25)", // Radiant Sky Blue Glow
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(14, 165, 233, 0.18)", // Cyan Glow
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  brandBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  brandBadgeText: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  systemStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  systemStatusText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
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
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#0284C7",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  notifBtnEmoji: {
    fontSize: 18,
  },
  notifDot: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifDotText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  heroCard: {
    borderRadius: 22,
    padding: 26,
    marginBottom: 24,
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  heroContent: {
    gap: 8,
  },
  heroPill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  heroPillText: {
    color: "#E0F2FE",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  heroBody: {
    color: "#E0F2FE",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 680,
    opacity: 0.95,
  },
  heroButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  heroPrimaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  heroPrimaryBtnText: {
    color: "#0284C7",
    fontWeight: "900",
    fontSize: 13,
  },
  heroSecondaryBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroSecondaryBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0C2340",
    marginBottom: 14,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  kpiIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  kpiEmoji: {
    fontSize: 18,
  },
  kpiNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0C2340",
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#627D98",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 30,
  },
  tile: {
    width: "48%",
    minWidth: 260,
    flexGrow: 1,
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  tileIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0C2340",
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#334E68",
  },
  footerBox: {
    alignItems: "center",
    marginTop: 10,
  },
  logoutBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
  },
  // Quick Patient Search Bar Styles
  quickSearchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    padding: 12,
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    zIndex: 10,
  },
  quickSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  quickSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0C2340",
    fontWeight: "700",
  },
  kbdBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  kbdText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },
  quickSearchResults: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F9FF",
    paddingTop: 6,
    gap: 4,
  },
  quickSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  quickSearchItemName: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  quickSearchItemMeta: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  quickSearchItemAction: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  quickSearchEmpty: {
    padding: 8,
    alignItems: "center",
  },
  quickSearchEmptyText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  // Shift Queue Styles
  shiftQueueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    padding: 18,
    marginBottom: 24,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  shiftQueueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  shiftQueueTitle: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
  },
  shiftQueueSubtitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  newConsultQuickBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newConsultQuickBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  queueList: {
    gap: 8,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  queueAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  queueAvatarText: {
    color: "#0284C7",
    fontSize: 16,
    fontWeight: "900",
  },
  queuePatientName: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  queueStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  queuePillCompleted: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  queuePillPending: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  queueStatusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
  queuePillTextCompleted: {
    color: "#166534",
  },
  queuePillTextPending: {
    color: "#92400E",
  },
  queueDoctorText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  queueActionBtn: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  queueActionBtnText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "800",
  },
  queueStartConsultBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  queueStartConsultBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyQueueBox: {
    padding: 24,
    alignItems: "center",
  },
  emptyQueueTitle: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyQueueSubtitle: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 400,
  },
  emptyQueueBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyQueueBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  // Modal Backdrop & Profile Dropdown Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 24,
  },
  profileDropdownMenu: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  dropdownAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  dropdownUserName: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "900",
  },
  dropdownUserRole: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  dropdownUserEmail: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 1,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  dropdownItemText: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "700",
  },
});
