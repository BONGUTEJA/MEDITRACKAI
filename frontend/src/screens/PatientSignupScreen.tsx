import React, { useMemo, useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import { registerPatientPortal } from "../services/medtrackService";
import { useAuth } from "../context/AuthContext";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";
import MedicalIcon from "../components/MedicalIcon";

type Props = NativeStackScreenProps<RootStackParamList, "PatientSignup">;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const genderOptions = ["Male", "Female", "Other"];

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDateString = (value: string) => new Date(`${value}T12:00:00`);

export default function PatientSignupScreen({ navigation }: Props) {
  const { loginPatient } = useAuth();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Animated Success State
  const [createdPatient, setCreatedPatient] = useState<{ id: string; name: string; patientObj: any } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openCalendar = () => {
    const selected = dateOfBirth ? fromDateString(dateOfBirth) : new Date();
    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setShowCalendar(true);
  };

  const handleSignup = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const parsedAge = Number(age);

    if (!cleanName || !age || !gender || !dateOfBirth || !cleanPhone || !cleanEmail || !password) {
      const msg = "Please fill in all required fields (Name, Age, DOB, Gender, Phone, Email, Password).";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Required Fields", msg);
      return;
    }

    if (!Number.isInteger(parsedAge) || parsedAge < 0) {
      const msg = "Please enter a valid age.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Invalid Age", msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Weak Password", msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match. Please verify.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Password Mismatch", msg);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await registerPatientPortal({
        full_name: cleanName,
        age: parsedAge,
        gender,
        date_of_birth: dateOfBirth,
        phone: cleanPhone,
        email: cleanEmail,
        password,
        address: address.trim() || undefined,
      });

      // Trigger animated success modal
      setCreatedPatient({
        id: response.patient.patient_id,
        name: response.patient.full_name,
        patientObj: response.patient,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed. Please check details and try again.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.authCard}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PATIENT PORTAL</Text>
            </View>
            <Text style={styles.title}>Create Patient Account</Text>
            <Text style={styles.subtitle}>
              Register as a patient to book consultation slots, view digital prescriptions, and track your clinical dossier.
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              <Text style={styles.sectionHeader}>Personal Information</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Full Name <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Emily Watson"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Age <Text style={styles.asterisk}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Years"
                    placeholderTextColor="#94A3B8"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={{ flex: 1.5 }}>
                  <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
                  <TouchableOpacity style={styles.datePickerInput} onPress={openCalendar}>
                    <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                      {dateOfBirth || "Select DOB"}
                    </Text>
                    <MedicalIcon name="calendar" size={16} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Gender Chips */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Gender <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.genderRow}>
                  {genderOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.genderChip, gender === opt && styles.genderChipActive]}
                      onPress={() => setGender(opt)}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          gender === opt && styles.genderChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={[styles.sectionHeader, { marginTop: 10 }]}>Contact & Security</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone Number <Text style={styles.asterisk}>*</Text></Text>
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
                <Text style={styles.fieldLabel}>Email Address <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. emily@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Password <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirm Password <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Residential Address (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  placeholder="Street address, City, State"
                  placeholderTextColor="#94A3B8"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Patient Account →</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <TouchableOpacity
              style={styles.loginLinkBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLinkText}>
                Already have a patient account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Animated Success Modal */}
      <AnimatedSuccessModal
        visible={!!createdPatient}
        title="Welcome to MEDCARE AI!"
        subtitle={`Your patient portal account has been activated for ${createdPatient?.name || "you"}.`}
        highlightLabel="Your Permanent Health ID"
        highlightValue={createdPatient?.id}
        primaryButtonText="Enter Patient Dashboard →"
        onPrimaryAction={() => {
          const p = createdPatient?.patientObj;
          setCreatedPatient(null);
          if (p) {
            loginPatient(p);
            navigation.replace("PatientDashboard");
          }
        }}
      />

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        month={calendarMonth}
        selectedDate={dateOfBirth}
        onClose={() => setShowCalendar(false)}
        onMonthChange={setCalendarMonth}
        onSelect={(date) => {
          setDateOfBirth(formatDate(date));
          setShowCalendar(false);
        }}
      />
    </SafeAreaView>
  );
}

function CalendarModal({
  visible,
  month,
  selectedDate,
  onClose,
  onMonthChange,
  onSelect,
}: {
  visible: boolean;
  month: Date;
  selectedDate: string;
  onClose: () => void;
  onMonthChange: (month: Date) => void;
  onSelect: (date: Date) => void;
}) {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const today = useMemo(() => new Date(), []);
  const years = useMemo(
    () => Array.from({ length: today.getFullYear() - 1920 + 1 }, (_, i) => today.getFullYear() - i),
    [today]
  );
  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  }, [month]);

  const prevMonth = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= new Date(today.getFullYear(), today.getMonth(), 1)) onMonthChange(next);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={calStyles.overlay}>
        <View style={calStyles.card}>
          {showYearPicker ? (
            <>
              <View style={calStyles.yearHeader}>
                <TouchableOpacity onPress={() => setShowYearPicker(false)} style={calStyles.navBtn}>
                  <Text style={calStyles.navBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={calStyles.pickerTitle}>Select Birth Year</Text>
                <View style={calStyles.navBtnPlaceholder} />
              </View>
              <ScrollView style={calStyles.yearScroll} contentContainerStyle={calStyles.yearScrollContent}>
                {years.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      calStyles.yearOption,
                      yr === month.getFullYear() && calStyles.yearOptionActive,
                    ]}
                    onPress={() => {
                      onMonthChange(new Date(yr, month.getMonth(), 1));
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        calStyles.yearText,
                        yr === month.getFullYear() && calStyles.yearTextActive,
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <View style={calStyles.header}>
                <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
                  <Text style={calStyles.navBtnText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={calStyles.titleGroup}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={calStyles.monthTitle}>
                    {monthNames[month.getMonth()]} {month.getFullYear()} ▾
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
                  <Text style={calStyles.navBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={calStyles.grid}>
                {weekDays.map((day) => (
                  <Text key={day} style={calStyles.weekDay}>
                    {day}
                  </Text>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <View key={`empty-${i}`} style={calStyles.dayCell} />;
                  const date = new Date(month.getFullYear(), month.getMonth(), day);
                  const disabled = date > today;
                  const isSelected = selectedDate === formatDate(date);

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        calStyles.dayCell,
                        isSelected && calStyles.dayCellSelected,
                      ]}
                      onPress={() => !disabled && onSelect(date)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          calStyles.dayText,
                          disabled && calStyles.dayTextDisabled,
                          isSelected && calStyles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <TouchableOpacity style={calStyles.closeBtn} onPress={onClose}>
            <Text style={calStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnText: {
    color: "#0F766E",
    fontSize: 20,
    fontWeight: "900",
  },
  navBtnPlaceholder: { width: 38 },
  titleGroup: {
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  monthTitle: {
    color: "#0F766E",
    fontSize: 16,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  weekDay: {
    width: "14.285%",
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    paddingBottom: 8,
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: "#0F766E",
  },
  dayText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextDisabled: {
    color: "#CBD5E1",
  },
  dayTextSelected: {
    color: "white",
  },
  yearHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  pickerTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  yearScroll: {
    maxHeight: 280,
  },
  yearScrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearOption: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  yearOptionActive: {
    backgroundColor: "#0F766E",
  },
  yearText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  yearTextActive: {
    color: "white",
  },
  closeBtn: {
    alignSelf: "center",
    padding: 12,
    marginTop: 8,
  },
  closeBtnText: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "800",
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 520,
  },
  topBar: {
    marginBottom: 14,
    width: "100%",
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 15,
  },
  authCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    alignItems: "center",
  },
  brandBadge: {
    backgroundColor: "#0F766E",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  brandBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    width: "100%",
    gap: 12,
  },
  sectionHeader: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
  },
  field: {
    width: "100%",
  },
  fieldLabel: {
    color: "#1E293B",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  asterisk: {
    color: "#DC2626",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  twoColRow: {
    flexDirection: "row",
    gap: 10,
  },
  datePickerInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  datePlaceholder: {
    color: "#94A3B8",
    fontSize: 14,
  },
  calendarIcon: {
    fontSize: 15,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderChip: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  genderChipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  genderChipText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
  genderChipTextActive: {
    color: "white",
    fontWeight: "800",
  },
  multiline: {
    minHeight: 65,
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  loginLinkBtn: {
    marginTop: 18,
    padding: 6,
  },
  loginLinkText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  loginLinkHighlight: {
    color: "#0284C7",
    fontWeight: "800",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
});
