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
import { createPatient } from "../services/medtrackService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";
import MedicalIcon from "../components/MedicalIcon";

type Props = NativeStackScreenProps<RootStackParamList, "PatientRegistration">;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const genderOptions = ["Male", "Female", "Other"];

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDateString = (value: string) => new Date(`${value}T12:00:00`);

export const calculateAgeFromDOB = (dobString: string): string => {
  if (!dobString) return "";
  const parts = dobString.split("-").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return "";
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return calculatedAge >= 0 ? String(calculatedAge) : "";
};

export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  const country = digits.slice(0, digits.length - 10);
  const first5 = digits.slice(digits.length - 10, digits.length - 5);
  const last5 = digits.slice(digits.length - 5);
  return `+${country} ${first5} ${last5}`;
};

export default function PatientRegistrationScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Animated Success State
  const [createdPatient, setCreatedPatient] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date);
    setDateOfBirth(formatted);
    const autoAge = calculateAgeFromDOB(formatted);
    if (autoAge) setAge(autoAge);
    setShowCalendar(false);
  };

  const handleDOBTextChange = (val: string) => {
    setDateOfBirth(val);
    if (val.length === 10) {
      const autoAge = calculateAgeFromDOB(val);
      if (autoAge) setAge(autoAge);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(formatPhoneNumber(val));
  };

  const openCalendar = () => {
    const selected = dateOfBirth ? fromDateString(dateOfBirth) : new Date();
    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setShowCalendar(true);
  };

  const registerPatient = async () => {
    const parsedAge = Number(age);
    if (!fullName.trim() || !age || !gender.trim() || !dateOfBirth || !phone.trim()) {
      const msg = "Name, age, gender, date of birth, and phone number are required.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Required Fields", msg);
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 0) {
      const msg = "Please enter a valid whole-number age.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Invalid Age", msg);
      return;
    }
    try {
      setSaving(true);
      setErrorMessage(null);
      const patient = await createPatient({
        full_name: fullName.trim(),
        age: parsedAge,
        gender: gender.trim(),
        date_of_birth: dateOfBirth,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      // Trigger the animated success modal
      setCreatedPatient({ id: patient.patient_id, name: patient.full_name });
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Registration failed. Please try again.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Error", msg);
    } finally {
      setSaving(false);
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
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <Text style={styles.eyebrow}>PATIENT ONBOARDING</Text>
            <Text style={styles.title}>Register New Patient</Text>
            <Text style={styles.subtitle}>
              Capture essential patient demographics and generate a sequential 3-digit hospital ID.
            </Text>
          </View>

          {/* ID Auto Notice */}
          <View style={styles.idNoticeCard}>
            <View style={styles.idNoticeBadge}>
              <Text style={styles.idNoticeBadgeText}>ID</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.idNoticeTitle}>Sequential Patient Identifier</Text>
              <Text style={styles.idNoticeSubtitle}>
                Automatically assigned in 3-digit format (e.g. 001, 002, 003...)
              </Text>
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* SECTION 1: Personal Information */}
          <Text style={styles.sectionHeader}>1. Personal Demographics</Text>
          <View style={styles.card}>
            <Field
              label="Full Name"
              required
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Johnathan Doe"
              autoCapitalize="words"
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Age"
                  required
                  value={age}
                  onChangeText={setAge}
                  placeholder="Years"
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={styles.fieldLabel}>
                  Date of Birth <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity style={styles.datePickerInput} onPress={openCalendar}>
                  <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                    {dateOfBirth || "Select DOB"}
                  </Text>
                  <MedicalIcon name="calendar" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Chips */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Gender <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.genderRow}>
                {genderOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.genderChip,
                      gender === opt && styles.genderChipActive,
                    ]}
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
          </View>

          {/* SECTION 2: Contact Details */}
          <Text style={styles.sectionHeader}>2. Contact & Address Coordinates</Text>
          <View style={styles.card}>
            <Field
              label="Phone Number"
              required
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
            />
            <Field
              label="Email Address (Optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. patient@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Residential Address (Optional)"
              value={address}
              onChangeText={setAddress}
              placeholder="Street name, City, State, Postal Code"
              multiline
              autoCapitalize="sentences"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.disabled]}
            onPress={registerPatient}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Registering Patient...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Create Patient Record →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Animated Success Modal Popup */}
      <AnimatedSuccessModal
        visible={!!createdPatient}
        title="Patient Registered Successfully!"
        subtitle={`Electronic health record profile created for ${createdPatient?.name || "the patient"}.`}
        highlightLabel="Assigned Patient ID"
        highlightValue={createdPatient?.id}
        primaryButtonText="View Medical Record →"
        onPrimaryAction={() => {
          const pid = createdPatient?.id;
          setCreatedPatient(null);
          if (pid) {
            navigation.replace("PatientMedicalProfile", { patientId: pid });
          }
        }}
        secondaryButtonText="+ Register Another"
        onSecondaryAction={() => {
          setCreatedPatient(null);
          setFullName("");
          setAge("");
          setDateOfBirth("");
          setPhone("");
          setEmail("");
          setAddress("");
        }}
      />

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        month={calendarMonth}
        selectedDate={dateOfBirth}
        onClose={() => setShowCalendar(false)}
        onMonthChange={setCalendarMonth}
        onSelect={handleDateSelect}
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

function Field({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline = false,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required ? <Text style={styles.asterisk}>*</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
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
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 720,
  },
  topBar: {
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
  eyebrow: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#0C2340",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: "#334E68",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  idNoticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  idNoticeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  idNoticeBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  idNoticeTitle: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "800",
  },
  idNoticeSubtitle: {
    color: "#334E68",
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    color: "#0C2340",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldContainer: {
    marginBottom: 2,
  },
  fieldLabel: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  asterisk: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 12,
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "600",
  },
  multilineInput: {
    minHeight: 80,
  },
  datePickerInput: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "700",
  },
  datePlaceholder: {
    color: "#94A3B8",
    fontSize: 14,
  },
  calendarIcon: {
    fontSize: 16,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderChip: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  genderChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  genderChipText: {
    color: "#0284C7",
    fontWeight: "700",
    fontSize: 13,
  },
  genderChipTextActive: {
    color: "white",
    fontWeight: "900",
  },
  submitBtn: {
    backgroundColor: "#0284C7",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "white",
    fontSize: 16,
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



