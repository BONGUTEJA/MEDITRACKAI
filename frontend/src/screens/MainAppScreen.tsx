import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { Theme } from "../theme/theme";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "MainApp">;

type TabKey =
  | "dashboard"
  | "ai_assistant"
  | "symptom_checker"
  | "records"
  | "medicines"
  | "appointments"
  | "analytics"
  | "notifications"
  | "profile"
  | "settings";

export default function MainAppScreen({ navigation }: Props) {
  const { user, patientUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Common Demo State
  const userName = user?.name || patientUser?.full_name || "Rahul Sharma";
  const userRole = user?.role || (patientUser ? "Patient" : "Member");

  // Vitals State
  const [vitals] = useState({
    heartRate: { value: 74, unit: "bpm", status: "Optimal", trend: "+2 bpm vs avg" },
    bloodPressure: { value: "118/78", unit: "mmHg", status: "Normal", trend: "Stable" },
    glucose: { value: 94, unit: "mg/dL", status: "Fasting Normal", trend: "-4 mg/dL" },
    bmi: { value: 22.4, unit: "kg/m²", status: "Healthy Weight", trend: "Optimal" },
    sleep: { value: 7.8, unit: "hrs", status: "Good Recovery", trend: "+12% vs last mo" },
  });

  // Medicines Adherence State
  const [medicines, setMedicines] = useState([
    { id: 1, name: "Metformin 500mg", time: "8:00 AM", slot: "Morning", taken: true, instructions: "After breakfast", remaining: "18 days" },
    { id: 2, name: "Atorvastatin 10mg", time: "2:00 PM", slot: "Afternoon", taken: false, instructions: "With water", remaining: "24 days" },
    { id: 3, name: "Paracetamol 650mg", time: "8:00 PM", slot: "Night", taken: false, instructions: "If fever persists", remaining: "4 days" },
    { id: 4, name: "Vitamin D3 60k", time: "Every Sunday", slot: "Weekly", taken: true, instructions: "With milk", remaining: "6 weeks" },
  ]);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; card?: any }>>([
    {
      sender: "ai",
      text: "Hello! I am your MEDCARE AI Clinical Assistant. How can I help you today? You can ask about your symptoms, explain lab reports, review medications, or receive safe wellness guidance.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  // Symptom Checker State (4 Steps)
  const [symptomStep, setSymptomStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomDuration, setSymptomDuration] = useState("1-3 days");
  const [symptomSeverity, setSymptomSeverity] = useState<"Mild" | "Moderate" | "Severe">("Moderate");
  const [symptomNotes, setSymptomNotes] = useState("");

  // Records Filter
  const [recordCategory, setRecordCategory] = useState("All");

  // Appointment Booking State
  const [bookingSpecialty, setBookingSpecialty] = useState("All");
  const [bookingModalDoc, setBookingModalDoc] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");
  const [selectedDate, setSelectedDate] = useState("2026-09-10");
  const [bookedSuccess, setBookedSuccess] = useState(false);

  // Notifications State
  const [notifList, setNotifList] = useState([
    { id: 1, type: "med", title: "💊 Evening Dose Reminder", body: "Atorvastatin 10mg is scheduled for 2:00 PM.", read: false, time: "10 mins ago" },
    { id: 2, type: "appt", title: "📅 Upcoming Appointment", body: "Consultation with Dr. Priya Sharma tomorrow at 10:00 AM.", read: false, time: "2 hours ago" },
    { id: 3, type: "ai", title: "🤖 AI Biometric Insight", body: "Your 7-day average blood pressure has remained in the optimal range (118/78 mmHg).", read: true, time: "1 day ago" },
    { id: 4, type: "report", title: "📂 Lab Report Ready", body: "Complete Blood Count (CBC) report uploaded by Apex Diagnostic Labs.", read: true, time: "3 days ago" },
  ]);

  const toggleMedication = (id: number) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
  };

  const handleSendChat = (promptText?: string) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user" as const, text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setChatInput("");
    setAiTyping(true);

    setTimeout(() => {
      setAiTyping(false);
      let aiReply: any = {
        sender: "ai",
        text: "Based on clinical literature and your biometric profile:",
        card: {
          condition: textToSend.toLowerCase().includes("headache")
            ? "Tension-Type Cephalea / Mild Dehydration"
            : textToSend.toLowerCase().includes("medicine") || textToSend.toLowerCase().includes("metformin")
            ? "Metformin Hydrochloride (Biguanide Antidiabetic)"
            : "General Clinical Health Analysis",
          symptoms: ["Headache / Dull Pressure", "Mild Fatigue", "Eye Strain"],
          recommendation: "Ensure hydration (2-3L/day), practice 20-20-20 screen rest, and monitor blood pressure. If pain persists >48 hours or is accompanied by visual aura or fever, consult an attending physician.",
          risk: "Low Risk — Routine Monitoring",
          disclaimer: "This AI guidance is for informational and triage purposes only and does not constitute a definitive medical diagnosis.",
        },
      };
      setChatMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        {/* LEFT SIDEBAR NAVIGATION */}
        <View style={styles.sidebar}>
          {/* Brand */}
          <TouchableOpacity
            style={styles.sidebarBrand}
            onPress={() => setActiveTab("dashboard")}
            activeOpacity={0.8}
          >
            <View style={styles.sidebarLogoIcon}>
              <Text style={{ fontSize: 20 }}>⚕️</Text>
            </View>
            <View>
              <Text style={styles.sidebarLogoText}>MEDCARE <Text style={{ color: Theme.colors.secondary }}>AI</Text></Text>
              <Text style={styles.sidebarLogoSub}>Clinical SaaS Suite</Text>
            </View>
          </TouchableOpacity>

          {/* Navigation Items */}
          <ScrollView style={styles.sidebarNavScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sidebarGroupTitle}>CLINICAL SUITE</Text>

            {[
              { key: "dashboard" as TabKey, label: "Dashboard", icon: "📊" },
              { key: "ai_assistant" as TabKey, label: "AI Health Assistant", icon: "🤖", badge: "GPT" },
              { key: "symptom_checker" as TabKey, label: "Symptom Checker", icon: "🩺", badge: "Triage" },
              { key: "records" as TabKey, label: "Health Records", icon: "📂" },
              { key: "medicines" as TabKey, label: "Medicine Tracker", icon: "💊", badge: "94%" },
              { key: "appointments" as TabKey, label: "Appointments", icon: "📅" },
              { key: "analytics" as TabKey, label: "Health Analytics", icon: "📈" },
              { key: "notifications" as TabKey, label: "Notifications", icon: "🔔", count: notifList.filter(n => !n.read).length },
            ].map((item) => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                  onPress={() => setActiveTab(item.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                  <Text style={[styles.sidebarItemLabel, isActive && styles.sidebarItemLabelActive]}>
                    {item.label}
                  </Text>
                  {item.badge ? (
                    <View style={styles.sidebarItemBadge}>
                      <Text style={styles.sidebarItemBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {item.count && item.count > 0 ? (
                    <View style={styles.sidebarItemCount}>
                      <Text style={styles.sidebarItemCountText}>{item.count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sidebarGroupTitle, { marginTop: 20 }]}>ACCOUNT & SETTINGS</Text>
            {[
              { key: "profile" as TabKey, label: "User Profile & ID", icon: "👤" },
              { key: "settings" as TabKey, label: "System Settings", icon: "⚙️" },
            ].map((item) => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                  onPress={() => setActiveTab(item.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                  <Text style={[styles.sidebarItemLabel, isActive && styles.sidebarItemLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User Profile Footer */}
          <View style={styles.sidebarFooter}>
            <View style={styles.sidebarUserAvatar}>
              <Text style={styles.sidebarUserInitial}>{userName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sidebarUserName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.sidebarUserRole}>{userRole}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                logout();
                navigation.replace("Login");
              }}
              style={styles.sidebarLogoutBtn}
            >
              <Text style={{ fontSize: 16 }}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT MAIN CONTENT AREA */}
        <View style={styles.mainArea}>
          {/* Top Bar Header */}
          <View style={styles.topHeader}>
            <View style={styles.topSearchBar}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={styles.topSearchInput}
                placeholder="Search medical records, specialists, symptoms, or medications..."
                placeholderTextColor={Theme.colors.lightText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.topHeaderActions}>
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>🩸 Blood: O+ · Allergies: Penicillin</Text>
              </View>

              <TouchableOpacity
                style={styles.topNotifBtn}
                onPress={() => setActiveTab("notifications")}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
                {notifList.filter((n) => !n.read).length > 0 && (
                  <View style={styles.topNotifDot} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topActionBtn}
                onPress={() => setActiveTab("ai_assistant")}
              >
                <Text style={styles.topActionBtnText}>🤖 Ask AI</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TAB ROUTING CONTENT */}
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* 1. DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <View style={styles.viewContainer}>
                {/* Welcome Hero Card */}
                <View style={styles.welcomeCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.welcomePill}>
                      <Text style={styles.welcomePillText}>🏥 PATIENT HEALTH STATUS: OPTIMAL</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>Good Morning, {userName} 👋</Text>
                    <Text style={styles.welcomeSub}>
                      Your continuous biometric biomarkers are stable. 1 prescription dose completed, 1 upcoming consultation scheduled with Dr. Priya Sharma.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.welcomeBtn}
                    onPress={() => setActiveTab("symptom_checker")}
                  >
                    <Text style={styles.welcomeBtnText}>🩺 Check Symptoms</Text>
                  </TouchableOpacity>
                </View>

                {/* 5 Health Overview Vitals Cards */}
                <Text style={styles.sectionHeading}>Real-Time Health Biomarkers</Text>
                <View style={styles.vitalsGrid}>
                  <View style={[styles.vitalCard, { borderTopColor: "#EF4444" }]}>
                    <View style={styles.vitalHeaderRow}>
                      <Text style={styles.vitalCardLabel}>HEART RATE</Text>
                      <Text style={{ fontSize: 16 }}>❤️</Text>
                    </View>
                    <Text style={styles.vitalCardVal}>{vitals.heartRate.value} <Text style={styles.vitalUnit}>{vitals.heartRate.unit}</Text></Text>
                    <Text style={styles.vitalTrendGreen}>✓ {vitals.heartRate.status} ({vitals.heartRate.trend})</Text>
                  </View>

                  <View style={[styles.vitalCard, { borderTopColor: "#0284C7" }]}>
                    <View style={styles.vitalHeaderRow}>
                      <Text style={styles.vitalCardLabel}>BLOOD PRESSURE</Text>
                      <Text style={{ fontSize: 16 }}>🩸</Text>
                    </View>
                    <Text style={styles.vitalCardVal}>{vitals.bloodPressure.value} <Text style={styles.vitalUnit}>{vitals.bloodPressure.unit}</Text></Text>
                    <Text style={styles.vitalTrendGreen}>✓ {vitals.bloodPressure.status}</Text>
                  </View>

                  <View style={[styles.vitalCard, { borderTopColor: "#10B981" }]}>
                    <View style={styles.vitalHeaderRow}>
                      <Text style={styles.vitalCardLabel}>BLOOD GLUCOSE</Text>
                      <Text style={{ fontSize: 16 }}>🧪</Text>
                    </View>
                    <Text style={styles.vitalCardVal}>{vitals.glucose.value} <Text style={styles.vitalUnit}>{vitals.glucose.unit}</Text></Text>
                    <Text style={styles.vitalTrendGreen}>✓ {vitals.glucose.status}</Text>
                  </View>

                  <View style={[styles.vitalCard, { borderTopColor: "#8B5CF6" }]}>
                    <View style={styles.vitalHeaderRow}>
                      <Text style={styles.vitalCardLabel}>BODY MASS (BMI)</Text>
                      <Text style={{ fontSize: 16 }}>⚖️</Text>
                    </View>
                    <Text style={styles.vitalCardVal}>{vitals.bmi.value} <Text style={styles.vitalUnit}>{vitals.bmi.unit}</Text></Text>
                    <Text style={styles.vitalTrendGreen}>✓ {vitals.bmi.status}</Text>
                  </View>

                  <View style={[styles.vitalCard, { borderTopColor: "#F59E0B" }]}>
                    <View style={styles.vitalHeaderRow}>
                      <Text style={styles.vitalCardLabel}>SLEEP RECOVERY</Text>
                      <Text style={{ fontSize: 16 }}>🌙</Text>
                    </View>
                    <Text style={styles.vitalCardVal}>{vitals.sleep.value} <Text style={styles.vitalUnit}>{vitals.sleep.unit}</Text></Text>
                    <Text style={styles.vitalTrendBlue}>↑ {vitals.sleep.trend}</Text>
                  </View>
                </View>

                {/* 2-Column Dashboard Matrix: Today's Meds & Upcoming Appointments */}
                <View style={styles.twoColRow}>
                  {/* Today's Medicine Timeline Checklist */}
                  <View style={[styles.dashboardBox, { flex: 1.2 }]}>
                    <View style={styles.boxHeaderRow}>
                      <View>
                        <Text style={styles.boxTitle}>💊 Today's Medication Schedule</Text>
                        <Text style={styles.boxSubtitle}>Adherence rate: 94% on-track this month.</Text>
                      </View>
                      <TouchableOpacity onPress={() => setActiveTab("medicines")}>
                        <Text style={styles.boxLink}>Manage All →</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.medTimelineList}>
                      {medicines.map((med) => (
                        <View key={med.id} style={[styles.medItemRow, med.taken && styles.medItemRowTaken]}>
                          <TouchableOpacity
                            style={[styles.checkboxCircle, med.taken && styles.checkboxCircleActive]}
                            onPress={() => toggleMedication(med.id)}
                          >
                            <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>{med.taken ? "✓" : ""}</Text>
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.medItemName, med.taken && styles.medItemNameTaken]}>
                              {med.name}
                            </Text>
                            <Text style={styles.medItemMeta}>
                              ⏰ {med.time} ({med.slot}) · {med.instructions}
                            </Text>
                          </View>
                          <View style={[styles.medStatusBadge, med.taken ? styles.badgeGreen : styles.badgeAmber]}>
                            <Text style={[styles.medStatusBadgeText, med.taken ? styles.badgeGreenText : styles.badgeAmberText]}>
                              {med.taken ? "Completed" : "Pending"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Upcoming Consultations */}
                  <View style={[styles.dashboardBox, { flex: 1 }]}>
                    <View style={styles.boxHeaderRow}>
                      <View>
                        <Text style={styles.boxTitle}>📅 Upcoming Consultations</Text>
                        <Text style={styles.boxSubtitle}>Reserved doctor slots</Text>
                      </View>
                      <TouchableOpacity onPress={() => setActiveTab("appointments")}>
                        <Text style={styles.boxLink}>+ Book Slot</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.apptCard}>
                      <View style={styles.apptHeaderRow}>
                        <View style={styles.doctorAvatarBox}>
                          <Text style={{ fontSize: 20 }}>👩‍⚕️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.apptDocName}>Dr. Priya Sharma</Text>
                          <Text style={styles.apptDocSpec}>Senior Cardiologist · MBBS, MD</Text>
                        </View>
                        <View style={styles.confirmedBadge}>
                          <Text style={styles.confirmedBadgeText}>Confirmed</Text>
                        </View>
                      </View>
                      <View style={styles.apptTimeBar}>
                        <Text style={styles.apptTimeText}>🗓️ Tomorrow, Sept 10 at 10:00 AM (Slot #04)</Text>
                      </View>
                    </View>

                    {/* AI Health Insight Card */}
                    <View style={styles.aiInsightCard}>
                      <View style={styles.aiInsightHeader}>
                        <Text style={{ fontSize: 16 }}>🤖</Text>
                        <Text style={styles.aiInsightTitle}>AI Biometric Trend Insight</Text>
                      </View>
                      <Text style={styles.aiInsightBody}>
                        "Your resting pulse has improved by 4% following your consistent evening medication adherence over the past 14 days."
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 2. AI HEALTH ASSISTANT VIEW */}
            {activeTab === "ai_assistant" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>GPT-POWERED CLINICAL INTELLIGENCE</Text>
                    </View>
                    <Text style={styles.viewTitle}>AI Clinical Health Assistant</Text>
                    <Text style={styles.viewSubtitle}>
                      Ask questions regarding medical reports, symptom evaluation, prescription interactions, and general healthcare wellness.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.clearChatBtn}
                    onPress={() => setChatMessages([{ sender: "ai", text: "New session started. How can I help you today?" }])}
                  >
                    <Text style={styles.clearChatBtnText}>+ New Chat</Text>
                  </TouchableOpacity>
                </View>

                {/* Suggested Prompt Chips */}
                <View style={styles.promptChipsRow}>
                  {[
                    "Analyze my headache and fatigue symptoms",
                    "What are the indications for Metformin?",
                    "Explain my 118/78 mmHg Blood Pressure reading",
                    "Dietary recommendations for healthy cholesterol",
                  ].map((chip, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.promptChip}
                      onPress={() => handleSendChat(chip)}
                    >
                      <Text style={styles.promptChipText}>💡 {chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Chat Stream */}
                <View style={styles.chatStreamContainer}>
                  {chatMessages.map((msg, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chatBubble,
                        msg.sender === "user" ? styles.userBubble : styles.aiBubble,
                      ]}
                    >
                      <View style={styles.chatSenderRow}>
                        <Text style={styles.chatSenderName}>
                          {msg.sender === "user" ? `👤 ${userName}` : "🤖 MEDCARE AI Assistant"}
                        </Text>
                      </View>
                      <Text style={[styles.chatText, msg.sender === "user" && { color: "white" }]}>
                        {msg.text}
                      </Text>

                      {msg.card && (
                        <View style={styles.aiStructuredCard}>
                          <View style={styles.aiCardHeader}>
                            <Text style={styles.aiCardTitle}>📋 Clinical Assessment Breakdown</Text>
                            <View style={styles.riskBadge}>
                              <Text style={styles.riskBadgeText}>{msg.card.risk}</Text>
                            </View>
                          </View>

                          <Text style={styles.aiCardLabel}>Possible Clinical Observation:</Text>
                          <Text style={styles.aiCardValue}>{msg.card.condition}</Text>

                          <Text style={[styles.aiCardLabel, { marginTop: 10 }]}>Associated Symptoms:</Text>
                          <View style={styles.symptomTagList}>
                            {msg.card.symptoms.map((s: string, idx: number) => (
                              <View key={idx} style={styles.symptomTag}>
                                <Text style={styles.symptomTagText}>{s}</Text>
                              </View>
                            ))}
                          </View>

                          <Text style={[styles.aiCardLabel, { marginTop: 10 }]}>Clinical Guidance:</Text>
                          <Text style={styles.aiCardValue}>{msg.card.recommendation}</Text>

                          <View style={styles.disclaimerBox}>
                            <Text style={styles.disclaimerText}>⚠️ {msg.card.disclaimer}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}

                  {aiTyping && (
                    <View style={[styles.chatBubble, styles.aiBubble]}>
                      <ActivityIndicator size="small" color={Theme.colors.primary} />
                      <Text style={{ color: Theme.colors.grayText, fontSize: 12, marginTop: 4 }}>
                        MEDCARE AI is formulating clinical analysis...
                      </Text>
                    </View>
                  )}
                </View>

                {/* Input Bar */}
                <View style={styles.chatInputBar}>
                  <TextInput
                    style={styles.chatTextInput}
                    placeholder="Describe your health question or symptoms in detail..."
                    placeholderTextColor={Theme.colors.lightText}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={() => handleSendChat()}
                  />
                  <TouchableOpacity
                    style={styles.chatSendBtn}
                    onPress={() => handleSendChat()}
                  >
                    <Text style={styles.chatSendBtnText}>Send →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3. SYMPTOM CHECKER VIEW */}
            {activeTab === "symptom_checker" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>STEP-BY-STEP CLINICAL TRIAGE</Text>
                    </View>
                    <Text style={styles.viewTitle}>Intelligent Symptom Checker</Text>
                    <Text style={styles.viewSubtitle}>
                      Evaluate acute or ongoing symptoms and receive safe risk assessments and recommended next steps.
                    </Text>
                  </View>
                </View>

                {/* Wizard Step Progress */}
                <View style={styles.wizardProgressRow}>
                  {["1. Select Symptoms", "2. Duration & Details", "3. Severity Level", "4. AI Assessment"].map((st, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.wizardStepPill,
                        symptomStep === idx + 1 && styles.wizardStepPillActive,
                        symptomStep > idx + 1 && styles.wizardStepPillCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.wizardStepText,
                          symptomStep === idx + 1 && styles.wizardStepTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Step 1: Select Symptoms */}
                {symptomStep === 1 && (
                  <View style={styles.stepCard}>
                    <Text style={styles.stepTitle}>What symptoms are you currently experiencing?</Text>
                    <Text style={styles.stepSubtitle}>Tap one or more symptoms below to include them in the assessment.</Text>

                    <View style={styles.symptomChipsGrid}>
                      {[
                        "Headache", "Fever", "Dry Cough", "Sore Throat", "Fatigue",
                        "Shortness of Breath", "Chest Tightness", "Stomach Pain", "Nausea",
                        "Dizziness", "Joint Pain", "Skin Rash", "Loss of Appetite", "Back Pain",
                      ].map((sym) => {
                        const isSelected = selectedSymptoms.includes(sym);
                        return (
                          <TouchableOpacity
                            key={sym}
                            style={[styles.symptomSelectChip, isSelected && styles.symptomSelectChipActive]}
                            onPress={() => toggleSymptom(sym)}
                          >
                            <Text style={[styles.symptomSelectText, isSelected && styles.symptomSelectTextActive]}>
                              {isSelected ? "✓ " : "+ "}
                              {sym}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[styles.stepNextBtn, selectedSymptoms.length === 0 && { opacity: 0.5 }]}
                      disabled={selectedSymptoms.length === 0}
                      onPress={() => setSymptomStep(2)}
                    >
                      <Text style={styles.stepNextBtnText}>Continue to Duration (Step 2) →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 2: Duration & Details */}
                {symptomStep === 2 && (
                  <View style={styles.stepCard}>
                    <Text style={styles.stepTitle}>How long have you experienced these symptoms?</Text>
                    <View style={styles.durationOptionsRow}>
                      {["Less than 24 hours", "1-3 days", "4-7 days", "More than a week", "Chronic / Ongoing"].map((dur) => (
                        <TouchableOpacity
                          key={dur}
                          style={[styles.durationBtn, symptomDuration === dur && styles.durationBtnActive]}
                          onPress={() => setSymptomDuration(dur)}
                        >
                          <Text style={[styles.durationBtnText, symptomDuration === dur && styles.durationBtnTextActive]}>
                            {dur}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.stepTitle, { marginTop: 24 }]}>Additional Context or Triggers (Optional):</Text>
                    <TextInput
                      style={styles.contextInput}
                      placeholder="e.g. Started after physical exertion, accompanied by chills, fever higher in evening..."
                      placeholderTextColor={Theme.colors.lightText}
                      value={symptomNotes}
                      onChangeText={setSymptomNotes}
                      multiline
                    />

                    <View style={styles.stepBtnRow}>
                      <TouchableOpacity style={styles.stepBackBtn} onPress={() => setSymptomStep(1)}>
                        <Text style={styles.stepBackBtnText}>← Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.stepNextBtn} onPress={() => setSymptomStep(3)}>
                        <Text style={styles.stepNextBtnText}>Continue to Severity (Step 3) →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 3: Severity */}
                {symptomStep === 3 && (
                  <View style={styles.stepCard}>
                    <Text style={styles.stepTitle}>Select the overall severity level:</Text>

                    <View style={styles.severityGrid}>
                      {[
                        { level: "Mild" as const, desc: "Noticeable but does not interfere with normal daily tasks or sleep.", color: "#10B981" },
                        { level: "Moderate" as const, desc: "Uncomfortable and somewhat limits daily activities; pain manageable with rest.", color: "#F59E0B" },
                        { level: "Severe" as const, desc: "Significant pain or impairment. Urgent medical attention advised.", color: "#EF4444" },
                      ].map((sev) => (
                        <TouchableOpacity
                          key={sev.level}
                          style={[
                            styles.severityCard,
                            symptomSeverity === sev.level && { borderColor: sev.color, backgroundColor: "#F8FAFC" },
                          ]}
                          onPress={() => setSymptomSeverity(sev.level)}
                        >
                          <View style={[styles.sevDot, { backgroundColor: sev.color }]} />
                          <Text style={styles.sevLevelTitle}>{sev.level} Severity</Text>
                          <Text style={styles.sevLevelDesc}>{sev.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.stepBtnRow}>
                      <TouchableOpacity style={styles.stepBackBtn} onPress={() => setSymptomStep(2)}>
                        <Text style={styles.stepBackBtnText}>← Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.stepNextBtn} onPress={() => setSymptomStep(4)}>
                        <Text style={styles.stepNextBtnText}>Generate AI Health Analysis (Step 4) →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Step 4: Results Screen */}
                {symptomStep === 4 && (
                  <View style={styles.stepCard}>
                    <View style={styles.assessmentHeader}>
                      <Text style={styles.assessmentTitle}>🧠 Clinical AI Triage Assessment</Text>
                      <View style={[styles.riskBadge, symptomSeverity === "Severe" ? styles.badgeRed : styles.badgeAmber]}>
                        <Text style={styles.riskBadgeText}>{symptomSeverity === "Severe" ? "Elevated Attention Needed" : "Moderate Monitoring"}</Text>
                      </View>
                    </View>

                    <View style={styles.assessmentSummaryBox}>
                      <Text style={styles.summaryLabel}>Symptoms Analyzed:</Text>
                      <Text style={styles.summaryValue}>{selectedSymptoms.join(", ") || "None recorded"}</Text>

                      <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Reported Duration & Severity:</Text>
                      <Text style={styles.summaryValue}>{symptomDuration} · {symptomSeverity} Severity</Text>

                      <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Clinical Considerations:</Text>
                      <Text style={styles.summaryValue}>
                        Likely upper respiratory viral manifestation or tension fatigue syndrome. Biomarkers suggest no acute hemodynamic instability.
                      </Text>

                      <Text style={[styles.summaryLabel, { marginTop: 10 }]}>Recommended Next Steps:</Text>
                      <Text style={styles.summaryValue}>
                        1. Hydration & adequate rest for 48 hours.{"\n"}
                        2. Monitor body temperature twice daily.{"\n"}
                        3. Schedule a teleconsultation if symptoms worsen or exceed 5 days.
                      </Text>
                    </View>

                    <View style={styles.stepBtnRow}>
                      <TouchableOpacity style={styles.stepBackBtn} onPress={() => setSymptomStep(1)}>
                        <Text style={styles.stepBackBtnText}>🔄 Restart Analysis</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.stepNextBtn} onPress={() => setActiveTab("appointments")}>
                        <Text style={styles.stepNextBtnText}>Book Doctor Appointment →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 4. HEALTH RECORDS VIEW */}
            {activeTab === "records" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>ENCRYPTED MEDICAL VAULT</Text>
                    </View>
                    <Text style={styles.viewTitle}>Health Records & Medical Reports</Text>
                    <Text style={styles.viewSubtitle}>
                      Manage diagnostic lab reports, radiological scans, prescriptions, and immunizations securely.
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.uploadBtn}>
                    <Text style={styles.uploadBtnText}>+ Upload New Record</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabsRow}>
                  {["All", "Lab Reports", "Prescriptions", "Radiology Scans", "Vaccinations"].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterTab, recordCategory === cat && styles.filterTabActive]}
                      onPress={() => setRecordCategory(cat)}
                    >
                      <Text style={[styles.filterTabText, recordCategory === cat && styles.filterTabTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Documents List */}
                <View style={styles.recordsGrid}>
                  {[
                    { title: "Complete Blood Count (CBC)", category: "Lab Reports", date: "Sept 01, 2026", facility: "Apex Pathology Lab", doctor: "Dr. Priya Sharma", format: "PDF" },
                    { title: "Lipid Profile & HbA1c Panel", category: "Lab Reports", date: "Aug 18, 2026", facility: "Apollo Diagnostics", doctor: "Dr. Ravi Kumar", format: "PDF" },
                    { title: "Chest X-Ray Digital Scan", category: "Radiology Scans", date: "July 24, 2026", facility: "City Imaging Center", doctor: "Dr. Sarah Jenkins", format: "DICOM/PDF" },
                    { title: "Digital Prescription - Acute Pharyngitis", category: "Prescriptions", date: "Sept 15, 2026", facility: "MEDCARE Outpatient", doctor: "Dr. Priya Sharma", format: "PDF" },
                    { title: "Hepatitis B & Tdap Vaccination", category: "Vaccinations", date: "Jan 12, 2026", facility: "National Immunization Registry", doctor: "Staff Clinician", format: "PDF" },
                  ].map((doc, idx) => (
                    <View key={idx} style={styles.docCard}>
                      <View style={styles.docIconBox}>
                        <Text style={{ fontSize: 24 }}>📄</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docTitle}>{doc.title}</Text>
                        <Text style={styles.docMeta}>
                          {doc.category} · {doc.facility} · 📅 {doc.date}
                        </Text>
                        <Text style={styles.docDoctor}>Attending: {doc.doctor}</Text>
                      </View>
                      <View style={styles.docActionRow}>
                        <TouchableOpacity style={styles.docViewBtn}>
                          <Text style={styles.docViewBtnText}>View Document</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.docDownloadBtn}>
                          <Text style={styles.docDownloadBtnText}>📥 PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 5. MEDICINES TRACKER VIEW */}
            {activeTab === "medicines" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>PHARMACOVIGILANCE & DOSAGE</Text>
                    </View>
                    <Text style={styles.viewTitle}>Medication Schedule & Adherence</Text>
                    <Text style={styles.viewSubtitle}>
                      Track prescribed pills, daily intake timelines, dosage adherence score, and refill reminders.
                    </Text>
                  </View>
                </View>

                {/* Adherence Overview KPI */}
                <View style={styles.adherenceSummaryCard}>
                  <View style={styles.adherenceScoreBox}>
                    <Text style={styles.adherenceScoreNumber}>94%</Text>
                    <Text style={styles.adherenceScoreLabel}>Monthly Adherence</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adherenceTitle}>Excellent Medication Consistency 🌟</Text>
                    <Text style={styles.adherenceDesc}>
                      You have completed 28 out of 30 scheduled dosage windows this month. Consistent timing helps optimize therapeutic blood plasma levels.
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Today's Active Medication Regimen</Text>
                <View style={styles.medsDetailGrid}>
                  {medicines.map((m) => (
                    <View key={m.id} style={styles.medDetailCard}>
                      <View style={styles.medDetailTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.medDetailName}>{m.name}</Text>
                          <Text style={styles.medDetailSlot}>⏰ {m.time} ({m.slot})</Text>
                        </View>
                        <View style={[styles.medStatusBadge, m.taken ? styles.badgeGreen : styles.badgeAmber]}>
                          <Text style={[styles.medStatusBadgeText, m.taken ? styles.badgeGreenText : styles.badgeAmberText]}>
                            {m.taken ? "✓ Taken" : "Pending"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.medDetailInst}>Instructions: {m.instructions}</Text>
                      <Text style={styles.medDetailRemaining}>📦 Remaining Stock: {m.remaining}</Text>

                      <TouchableOpacity
                        style={[styles.medToggleBtn, m.taken && styles.medToggleBtnTaken]}
                        onPress={() => toggleMedication(m.id)}
                      >
                        <Text style={[styles.medToggleBtnText, m.taken && styles.medToggleBtnTextTaken]}>
                          {m.taken ? "Mark as Pending" : "✓ Mark as Taken"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 6. APPOINTMENTS VIEW */}
            {activeTab === "appointments" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>SPECIALIST DIRECTORY</Text>
                    </View>
                    <Text style={styles.viewTitle}>Specialist Consultations & Booking</Text>
                    <Text style={styles.viewSubtitle}>
                      Find verified medical specialists, schedule real-time slots, and manage upcoming appointments.
                    </Text>
                  </View>
                </View>

                {/* Specialty Filters */}
                <View style={styles.filterTabsRow}>
                  {["All", "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General Medicine"].map((sp) => (
                    <TouchableOpacity
                      key={sp}
                      style={[styles.filterTab, bookingSpecialty === sp && styles.filterTabActive]}
                      onPress={() => setBookingSpecialty(sp)}
                    >
                      <Text style={[styles.filterTabText, bookingSpecialty === sp && styles.filterTabTextActive]}>
                        {sp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Doctor Cards Grid */}
                <View style={styles.doctorsGrid}>
                  {[
                    { id: 1, name: "Dr. Priya Sharma", spec: "Cardiology", exp: "14 yrs experience", rating: "4.9 ★ (120 reviews)", nextSlot: "Tomorrow, 10:00 AM", fee: "$60" },
                    { id: 2, name: "Dr. Ravi Kumar", spec: "General Medicine", exp: "10 yrs experience", rating: "4.8 ★ (95 reviews)", nextSlot: "Today, 4:00 PM", fee: "$45" },
                    { id: 3, name: "Dr. Rajesh Gupta", spec: "Orthopedics", exp: "16 yrs experience", rating: "4.9 ★ (140 reviews)", nextSlot: "Sept 12, 11:30 AM", fee: "$70" },
                    { id: 4, name: "Dr. Sarah Jenkins", spec: "Neurology", exp: "12 yrs experience", rating: "4.9 ★ (88 reviews)", nextSlot: "Sept 14, 2:00 PM", fee: "$85" },
                  ].map((doc) => (
                    <View key={doc.id} style={styles.docRosterCard}>
                      <View style={styles.docRosterTop}>
                        <View style={styles.docRosterAvatar}>
                          <Text style={{ fontSize: 26 }}>👨‍⚕️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docRosterName}>{doc.name}</Text>
                          <Text style={styles.docRosterSpec}>{doc.spec}</Text>
                          <Text style={styles.docRosterRating}>{doc.rating} · {doc.exp}</Text>
                        </View>
                      </View>
                      <View style={styles.docRosterSlotBar}>
                        <Text style={styles.docRosterSlotText}>🕒 Next Slot: <Text style={{ fontWeight: "900" }}>{doc.nextSlot}</Text></Text>
                        <Text style={styles.docRosterFee}>{doc.fee}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookSlotBtn}
                        onPress={() => {
                          setBookingModalDoc(doc);
                          setBookedSuccess(false);
                        }}
                      >
                        <Text style={styles.bookSlotBtnText}>Book Consultation Slot →</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Booking Modal */}
                {bookingModalDoc && (
                  <Modal visible={true} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                      <View style={styles.bookingModalCard}>
                        <View style={styles.modalHeaderRow}>
                          <Text style={styles.bookingModalTitle}>Schedule Appointment</Text>
                          <TouchableOpacity onPress={() => setBookingModalDoc(null)}>
                            <Text style={{ fontSize: 20, color: Theme.colors.grayText }}>✕</Text>
                          </TouchableOpacity>
                        </View>

                        {bookedSuccess ? (
                          <View style={styles.bookingSuccessBox}>
                            <Text style={{ fontSize: 36, marginBottom: 10 }}>🎉</Text>
                            <Text style={styles.bookingSuccessTitle}>Appointment Confirmed!</Text>
                            <Text style={styles.bookingSuccessBody}>
                              Your consultation with {bookingModalDoc.name} is booked for {selectedDate} at {selectedSlot}.
                            </Text>
                            <TouchableOpacity
                              style={styles.modalDoneBtn}
                              onPress={() => setBookingModalDoc(null)}
                            >
                              <Text style={styles.modalDoneBtnText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View>
                            <Text style={styles.modalDoctorName}>With: {bookingModalDoc.name} ({bookingModalDoc.spec})</Text>

                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Select Date:</Text>
                            <View style={styles.dateSelectorRow}>
                              {["2026-09-10", "2026-09-11", "2026-09-12"].map((d) => (
                                <TouchableOpacity
                                  key={d}
                                  style={[styles.dateChip, selectedDate === d && styles.dateChipActive]}
                                  onPress={() => setSelectedDate(d)}
                                >
                                  <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextActive]}>{d}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Select Time Slot:</Text>
                            <View style={styles.slotGrid}>
                              {["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"].map((s) => (
                                <TouchableOpacity
                                  key={s}
                                  style={[styles.slotChip, selectedSlot === s && styles.slotChipActive]}
                                  onPress={() => setSelectedSlot(s)}
                                >
                                  <Text style={[styles.slotChipText, selectedSlot === s && styles.slotChipTextActive]}>{s}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>

                            <TouchableOpacity
                              style={styles.confirmBookingBtn}
                              onPress={() => setBookedSuccess(true)}
                            >
                              <Text style={styles.confirmBookingBtnText}>Confirm Slot ({selectedSlot}) →</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </Modal>
                )}
              </View>
            )}

            {/* 7. HEALTH ANALYTICS VIEW */}
            {activeTab === "analytics" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>BIOMETRIC INTELLIGENCE</Text>
                    </View>
                    <Text style={styles.viewTitle}>Health Analytics & Biomarker Trends</Text>
                    <Text style={styles.viewSubtitle}>
                      Longitudinal health trend visualization, blood pressure analysis, glucose profiles, and AI recovery metrics.
                    </Text>
                  </View>
                </View>

                {/* KPI Trend Grid */}
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>📈 7-Day Blood Pressure Curve</Text>
                    <Text style={styles.analyticsCardSub}>Average: 118/78 mmHg (Optimal)</Text>
                    <View style={styles.miniChartBarRow}>
                      {[116, 118, 120, 117, 119, 118, 118].map((v, i) => (
                        <View key={i} style={styles.chartCol}>
                          <View style={[styles.chartBar, { height: (v - 90) * 2.5, backgroundColor: Theme.colors.primary }]} />
                          <Text style={styles.chartDayText}>{["M", "T", "W", "T", "F", "S", "S"][i]}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>🧪 Fasting Blood Glucose Trends</Text>
                    <Text style={styles.analyticsCardSub}>Average: 94 mg/dL (Normal Range)</Text>
                    <View style={styles.miniChartBarRow}>
                      {[92, 95, 93, 96, 94, 91, 94].map((v, i) => (
                        <View key={i} style={styles.chartCol}>
                          <View style={[styles.chartBar, { height: (v - 70) * 2.5, backgroundColor: Theme.colors.secondary }]} />
                          <Text style={styles.chartDayText}>{["M", "T", "W", "T", "F", "S", "S"][i]}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 8. NOTIFICATIONS VIEW */}
            {activeTab === "notifications" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>REAL-TIME ALERTS</Text>
                    </View>
                    <Text style={styles.viewTitle}>Clinical Notification Center</Text>
                    <Text style={styles.viewSubtitle}>
                      Medication dose reminders, upcoming appointment alerts, and AI health assessments.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={() => setNotifList((prev) => prev.map((n) => ({ ...n, read: true })))}
                  >
                    <Text style={styles.markAllBtnText}>✓ Mark All Read</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.notifStream}>
                  {notifList.map((n) => (
                    <View key={n.id} style={[styles.notifStreamCard, !n.read && styles.notifStreamUnread]}>
                      <View style={styles.notifStreamHeader}>
                        <Text style={styles.notifStreamTitle}>{n.title}</Text>
                        <Text style={styles.notifStreamTime}>{n.time}</Text>
                      </View>
                      <Text style={styles.notifStreamBody}>{n.body}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 9. USER PROFILE & ID */}
            {activeTab === "profile" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>CLINICAL PASSPORT</Text>
                    </View>
                    <Text style={styles.viewTitle}>Patient Health Profile & Digital ID</Text>
                  </View>
                </View>

                <View style={styles.healthIdBadgeCard}>
                  <View style={styles.healthIdTopRow}>
                    <View style={styles.healthIdAvatar}>
                      <Text style={{ fontSize: 32, color: "white", fontWeight: "900" }}>{userName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.healthIdFullName}>{userName}</Text>
                      <Text style={styles.healthIdMetaText}>Digital Health Passport · ID: #001</Text>
                      <Text style={styles.healthIdMetaText}>Age: 32 · Gender: Male · 📞 +1 (555) 234-5678</Text>
                    </View>
                  </View>
                  <View style={styles.healthIdStatsRow}>
                    <View style={styles.healthIdStatItem}>
                      <Text style={styles.idStatLabel}>BLOOD GROUP</Text>
                      <Text style={styles.idStatVal}>O Positive (O+)</Text>
                    </View>
                    <View style={styles.healthIdStatItem}>
                      <Text style={styles.idStatLabel}>ALLERGIES</Text>
                      <Text style={[styles.idStatVal, { color: "#FCA5A5" }]}>Penicillin (Severe)</Text>
                    </View>
                    <View style={styles.healthIdStatItem}>
                      <Text style={styles.idStatLabel}>EMERGENCY CONTACT</Text>
                      <Text style={styles.idStatVal}>+1 (555) 987-6543</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 10. SETTINGS VIEW */}
            {activeTab === "settings" && (
              <View style={styles.viewContainer}>
                <View style={styles.viewHeader}>
                  <View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>CONFIGURATION & SECURITY</Text>
                    </View>
                    <Text style={styles.viewTitle}>Account & System Settings</Text>
                  </View>
                </View>

                <View style={styles.settingsCard}>
                  <Text style={styles.settingsSectionTitle}>🔒 Security & Authentication</Text>
                  <View style={styles.settingItemRow}>
                    <Text style={styles.settingItemLabel}>Two-Factor Authentication (2FA)</Text>
                    <Text style={styles.settingItemStatus}>Enabled ✓</Text>
                  </View>
                  <View style={styles.settingItemRow}>
                    <Text style={styles.settingItemLabel}>Session Inactivity Timeout</Text>
                    <Text style={styles.settingItemStatus}>30 Minutes</Text>
                  </View>
                  <View style={styles.settingItemRow}>
                    <Text style={styles.settingItemLabel}>Security Audit Logging</Text>
                    <Text style={styles.settingItemStatus}>Active (Immutable)</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  appShell: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 260,
    backgroundColor: "#042F2E",
    borderRightWidth: 1,
    borderRightColor: "#0F766E30",
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sidebarLogoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarLogoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  sidebarLogoSub: {
    color: "#99F6E4",
    fontSize: 10,
    fontWeight: "700",
  },
  sidebarNavScroll: {
    flex: 1,
  },
  sidebarGroupTitle: {
    color: "#5EEAD4",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 10,
  },
  sidebarItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  sidebarItemIcon: {
    fontSize: 16,
  },
  sidebarItemLabel: {
    color: "#CCFBF1",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  sidebarItemLabelActive: {
    color: "white",
    fontWeight: "900",
  },
  sidebarItemBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sidebarItemBadgeText: {
    color: "#99F6E4",
    fontSize: 10,
    fontWeight: "800",
  },
  sidebarItemCount: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sidebarItemCountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 10,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  sidebarUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarUserInitial: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  sidebarUserName: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  sidebarUserRole: {
    color: "#99F6E4",
    fontSize: 11,
  },
  sidebarLogoutBtn: {
    padding: 6,
  },
  mainArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    flexWrap: "wrap",
    gap: 12,
  },
  topSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    maxWidth: 480,
  },
  topSearchInput: {
    flex: 1,
    color: Theme.colors.dark,
    fontSize: 13,
  },
  topHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emergencyBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  emergencyBadgeText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "800",
  },
  topNotifBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  topNotifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  topActionBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topActionBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  tabContent: {
    padding: 24,
  },
  viewContainer: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  welcomeCard: {
    backgroundColor: "#042F2E",
    borderRadius: 22,
    padding: 24,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  welcomePill: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  welcomePillText: {
    color: "#99F6E4",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  welcomeTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  welcomeSub: {
    color: "#CCFBF1",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 620,
  },
  welcomeBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  welcomeBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },
  sectionHeading: {
    color: Theme.colors.dark,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 14,
  },
  vitalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  vitalCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderTopWidth: 4,
  },
  vitalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vitalCardLabel: {
    color: Theme.colors.grayText,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  vitalCardVal: {
    color: Theme.colors.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  vitalUnit: {
    fontSize: 12,
    color: Theme.colors.grayText,
    fontWeight: "600",
  },
  vitalTrendGreen: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  vitalTrendBlue: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  dashboardBox: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  boxHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  boxTitle: {
    color: Theme.colors.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  boxSubtitle: {
    color: Theme.colors.grayText,
    fontSize: 12,
    marginTop: 2,
  },
  boxLink: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  medTimelineList: {
    gap: 10,
  },
  medItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  medItemRowTaken: {
    backgroundColor: "#F0FDFA",
    borderColor: "#CCFBF1",
    opacity: 0.75,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCircleActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  medItemName: {
    color: Theme.colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  medItemNameTaken: {
    textDecorationLine: "line-through",
    color: Theme.colors.grayText,
  },
  medItemMeta: {
    color: Theme.colors.grayText,
    fontSize: 11,
    marginTop: 2,
  },
  medStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  medStatusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  badgeGreen: {
    backgroundColor: "#DCFCE7",
  },
  badgeGreenText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeAmber: {
    backgroundColor: "#FEF3C7",
  },
  badgeAmberText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeRed: {
    backgroundColor: "#FEE2E2",
  },
  apptCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 14,
  },
  apptHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  doctorAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  apptDocName: {
    color: Theme.colors.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  apptDocSpec: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  confirmedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedBadgeText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  apptTimeBar: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  apptTimeText: {
    color: Theme.colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  aiInsightCard: {
    backgroundColor: "#F0FDFA",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  aiInsightTitle: {
    color: Theme.colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
  },
  aiInsightBody: {
    color: Theme.colors.dark,
    fontSize: 12,
    lineHeight: 17,
  },
  viewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  viewBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  viewBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  viewTitle: {
    color: Theme.colors.dark,
    fontSize: 26,
    fontWeight: "900",
  },
  viewSubtitle: {
    color: Theme.colors.grayText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    maxWidth: 700,
  },
  clearChatBtn: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearChatBtnText: {
    color: Theme.colors.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  promptChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  promptChip: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  promptChipText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  chatStreamContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    minHeight: 380,
    gap: 14,
    marginBottom: 16,
  },
  chatBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Theme.colors.primary,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chatSenderRow: {
    marginBottom: 4,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.colors.grayText,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.dark,
  },
  aiStructuredCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  aiCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  aiCardTitle: {
    color: Theme.colors.dark,
    fontSize: 13,
    fontWeight: "900",
  },
  riskBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "800",
  },
  aiCardLabel: {
    color: Theme.colors.grayText,
    fontSize: 11,
    fontWeight: "800",
  },
  aiCardValue: {
    color: Theme.colors.dark,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  symptomTagList: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 4,
  },
  symptomTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  symptomTagText: {
    color: Theme.colors.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  disclaimerBox: {
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  disclaimerText: {
    color: "#92400E",
    fontSize: 11,
    lineHeight: 15,
  },
  chatInputBar: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  chatTextInput: {
    flex: 1,
    color: Theme.colors.dark,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  chatSendBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatSendBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },
  wizardProgressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  wizardStepPill: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  wizardStepPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  wizardStepPillCompleted: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  wizardStepText: {
    color: Theme.colors.grayText,
    fontSize: 12,
    fontWeight: "700",
  },
  wizardStepTextActive: {
    color: "white",
    fontWeight: "900",
  },
  stepCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  stepTitle: {
    color: Theme.colors.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  stepSubtitle: {
    color: Theme.colors.grayText,
    fontSize: 13,
    marginBottom: 16,
  },
  symptomChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  symptomSelectChip: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  symptomSelectChipActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderColor: Theme.colors.primary,
  },
  symptomSelectText: {
    color: Theme.colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  symptomSelectTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: "900",
  },
  durationOptionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  durationBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  durationBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  durationBtnText: {
    color: Theme.colors.dark,
    fontSize: 13,
    fontWeight: "700",
  },
  durationBtnTextActive: {
    color: "white",
    fontWeight: "900",
  },
  contextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: Theme.colors.dark,
    minHeight: 70,
    marginTop: 8,
    fontSize: 13,
  },
  severityGrid: {
    gap: 12,
    marginVertical: 16,
  },
  severityCard: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    padding: 16,
  },
  sevDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  sevLevelTitle: {
    color: Theme.colors.dark,
    fontSize: 15,
    fontWeight: "900",
  },
  sevLevelDesc: {
    color: Theme.colors.grayText,
    fontSize: 12,
    marginTop: 2,
  },
  stepBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  stepBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  stepBackBtnText: {
    color: Theme.colors.dark,
    fontWeight: "800",
    fontSize: 13,
  },
  stepNextBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  stepNextBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },
  assessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  assessmentTitle: {
    color: Theme.colors.dark,
    fontSize: 18,
    fontWeight: "900",
  },
  assessmentSummaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  summaryLabel: {
    color: Theme.colors.grayText,
    fontSize: 11,
    fontWeight: "800",
  },
  summaryValue: {
    color: Theme.colors.dark,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterTab: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterTabText: {
    color: Theme.colors.grayText,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTabTextActive: {
    color: "white",
    fontWeight: "900",
  },
  recordsGrid: {
    gap: 12,
  },
  docCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  docTitle: {
    color: Theme.colors.dark,
    fontSize: 15,
    fontWeight: "900",
  },
  docMeta: {
    color: Theme.colors.grayText,
    fontSize: 12,
    marginTop: 2,
  },
  docDoctor: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  docActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  docViewBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  docViewBtnText: {
    color: Theme.colors.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  docDownloadBtn: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  docDownloadBtnText: {
    color: Theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },
  adherenceSummaryCard: {
    backgroundColor: "#042F2E",
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  adherenceScoreBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  adherenceScoreNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  adherenceScoreLabel: {
    color: "#CCFBF1",
    fontSize: 9,
    fontWeight: "800",
  },
  adherenceTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  adherenceDesc: {
    color: "#CCFBF1",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  medsDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  medDetailCard: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  medDetailTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  medDetailName: {
    color: Theme.colors.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  medDetailSlot: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  medDetailInst: {
    color: Theme.colors.grayText,
    fontSize: 12,
    marginBottom: 4,
  },
  medDetailRemaining: {
    color: Theme.colors.dark,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 14,
  },
  medToggleBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  medToggleBtnTaken: {
    backgroundColor: "#F1F5F9",
  },
  medToggleBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  medToggleBtnTextTaken: {
    color: Theme.colors.grayText,
  },
  doctorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  docRosterCard: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  docRosterTop: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  docRosterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  docRosterName: {
    color: Theme.colors.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  docRosterSpec: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  docRosterRating: {
    color: Theme.colors.grayText,
    fontSize: 11,
    marginTop: 2,
  },
  docRosterSlotBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  docRosterSlotText: {
    color: Theme.colors.dark,
    fontSize: 11,
  },
  docRosterFee: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  bookSlotBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  bookSlotBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  bookingModalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookingModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Theme.colors.dark,
  },
  modalDoctorName: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  fieldLabel: {
    color: Theme.colors.dark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  dateSelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  dateChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  dateChipText: {
    color: Theme.colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  dateChipTextActive: {
    color: "white",
    fontWeight: "900",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  slotChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  slotChipText: {
    color: Theme.colors.dark,
    fontSize: 12,
    fontWeight: "700",
  },
  slotChipTextActive: {
    color: "white",
    fontWeight: "900",
  },
  confirmBookingBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBookingBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },
  bookingSuccessBox: {
    padding: 20,
    alignItems: "center",
    textAlign: "center",
  },
  bookingSuccessTitle: {
    color: Theme.colors.dark,
    fontSize: 18,
    fontWeight: "900",
  },
  bookingSuccessBody: {
    color: Theme.colors.grayText,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  modalDoneBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalDoneBtnText: {
    color: "white",
    fontWeight: "800",
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  analyticsCardTitle: {
    color: Theme.colors.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  analyticsCardSub: {
    color: Theme.colors.grayText,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 18,
  },
  miniChartBarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
    paddingBottom: 20,
  },
  chartCol: {
    alignItems: "center",
    gap: 6,
  },
  chartBar: {
    width: 22,
    borderRadius: 6,
  },
  chartDayText: {
    color: Theme.colors.grayText,
    fontSize: 11,
    fontWeight: "700",
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllBtnText: {
    color: Theme.colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  notifStream: {
    gap: 10,
  },
  notifStreamCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  notifStreamUnread: {
    backgroundColor: "#F0FDFA",
    borderColor: "#99F6E4",
  },
  notifStreamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notifStreamTitle: {
    color: Theme.colors.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  notifStreamTime: {
    color: Theme.colors.lightText,
    fontSize: 11,
  },
  notifStreamBody: {
    color: Theme.colors.grayText,
    fontSize: 12,
    lineHeight: 17,
  },
  healthIdBadgeCard: {
    backgroundColor: "#042F2E",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#042F2E",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  healthIdTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  healthIdAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  healthIdFullName: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  healthIdMetaText: {
    color: "#CCFBF1",
    fontSize: 12,
    marginTop: 2,
  },
  healthIdStatsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingTop: 16,
    justifyContent: "space-around",
  },
  healthIdStatItem: {
    alignItems: "center",
  },
  idStatLabel: {
    color: "#99F6E4",
    fontSize: 10,
    fontWeight: "800",
  },
  idStatVal: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  settingsSectionTitle: {
    color: Theme.colors.dark,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },
  settingItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  settingItemLabel: {
    color: Theme.colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  settingItemStatus: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
});
