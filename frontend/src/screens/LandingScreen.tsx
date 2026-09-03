import React, { useState } from "react";
import {
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
import ThemeToggleBtn from "../components/ThemeToggleBtn";

type Props = NativeStackScreenProps<RootStackParamList, "Landing">;

export default function LandingScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState("Platform");
  const [demoMetric, setDemoMetric] = useState("Vitals");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP GLOW ACCENT */}
        <View style={styles.topGlow} />

        {/* MODERN STICKY NAVBAR */}
        <View style={styles.navbar}>
          <View style={styles.navContainer}>
            {/* Brand Logo */}
            <TouchableOpacity
              style={styles.brandRow}
              onPress={() => navigation.navigate("MainApp")}
              activeOpacity={0.8}
            >
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>✦</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>
                  MEDCARE<Text style={styles.brandAi}>.AI</Text>
                </Text>
                <Text style={styles.brandTagline}>CLINICAL INTELLIGENCE</Text>
              </View>
            </TouchableOpacity>

            {/* Nav Menu */}
            <View style={styles.navMenu}>
              {["Platform", "Features", "Specialists", "Clinical AI", "Security"].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setActiveTab(item)}
                  style={[styles.navItem, activeTab === item && styles.navItemActive]}
                >
                  <Text style={[styles.navItemText, activeTab === item && styles.navItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auth Buttons + Theme Toggle */}
            <View style={styles.navAuthGroup}>
              <ThemeToggleBtn variant="pill" />

              <TouchableOpacity
                style={styles.signInBtn}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
              >
                <Text style={styles.signInBtnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.launchBtn}
                onPress={() => navigation.navigate("MainApp")}
                activeOpacity={0.85}
              >
                <Text style={styles.launchBtnText}>Launch Portal →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroWrapper}>
          {/* Eyebrow Pill */}
          <View style={styles.heroPill}>
            <View style={styles.heroPillDot} />
            <Text style={styles.heroPillText}>NEXT-GEN HEALTHCARE OS 3.0</Text>
            <View style={styles.heroPillTag}>
              <Text style={styles.heroPillTagText}>NEW</Text>
            </View>
          </View>

          {/* Main Headline */}
          <Text style={styles.heroHeading}>
            Smarter Healthcare,{"\n"}
            <Text style={styles.heroHeadingGradient}>Engineered by Clinical AI.</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            A unified, enterprise platform designed for patients, doctors, and medical networks. Continuous vital analytics, automated triage, encrypted health dossiers, and precision telemedicine.
          </Text>

          {/* Hero CTAs */}
          <View style={styles.heroCtaRow}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => navigation.navigate("MainApp")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryCtaText}>Enter Platform Workspace →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryCtaText}>🩺 Staff & Patient Access</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Metrics Bar */}
          <View style={styles.trustMetricBar}>
            <View style={styles.trustMetricItem}>
              <Text style={styles.trustNum}>99.98%</Text>
              <Text style={styles.trustLabel}>UPTIME SLA</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustMetricItem}>
              <Text style={styles.trustNum}>&lt; 150ms</Text>
              <Text style={styles.trustLabel}>AI TRIAGE LATENCY</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustMetricItem}>
              <Text style={styles.trustNum}>AES-256</Text>
              <Text style={styles.trustLabel}>DATA ENCRYPTION</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustMetricItem}>
              <Text style={styles.trustNum}>12k+</Text>
              <Text style={styles.trustLabel}>ACTIVE DOSSIERS</Text>
            </View>
          </View>

          {/* LIVE INTERACTIVE SAAS DASHBOARD SHOWCASE */}
          <View style={styles.showcaseCard}>
            {/* Window Top Bar */}
            <View style={styles.showcaseBar}>
              <View style={styles.macButtons}>
                <View style={[styles.macDot, { backgroundColor: "#FF5F56" }]} />
                <View style={[styles.macDot, { backgroundColor: "#FFBD2E" }]} />
                <View style={[styles.macDot, { backgroundColor: "#27C93F" }]} />
              </View>
              <View style={styles.browserAddressBox}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.browserUrl}>app.medcare.ai/clinical-center</Text>
              </View>
              <View style={styles.liveBeacon}>
                <View style={styles.liveBeaconDot} />
                <Text style={styles.liveBeaconText}>LIVE TELEMETRY</Text>
              </View>
            </View>

            {/* Showcase Main Content */}
            <View style={styles.showcaseBody}>
              {/* Top Vitals Deck */}
              <View style={styles.vitalsDeck}>
                {[
                  { label: "HEART RATE", val: "72", unit: "bpm", status: "Optimal Rhythm", color: "#EF4444", icon: "❤️" },
                  { label: "BLOOD PRESSURE", val: "118/78", unit: "mmHg", status: "Target Range", color: "#0284C7", icon: "🩸" },
                  { label: "FASTING GLUCOSE", val: "92", unit: "mg/dL", status: "Normal Biomarker", color: "#10B981", icon: "🧪" },
                  { label: "SLEEP METABOLISM", val: "7.9", unit: "hrs", status: "+14% Recovery", color: "#8B5CF6", icon: "🌙" },
                ].map((v, i) => (
                  <View key={i} style={styles.vitalMiniCard}>
                    <View style={styles.vitalMiniHeader}>
                      <Text style={styles.vitalMiniLabel}>{v.label}</Text>
                      <Text style={{ fontSize: 13 }}>{v.icon}</Text>
                    </View>
                    <Text style={styles.vitalMiniVal}>
                      {v.val} <Text style={styles.vitalMiniUnit}>{v.unit}</Text>
                    </Text>
                    <View style={styles.statusPillRow}>
                      <View style={[styles.statusDot, { backgroundColor: v.color }]} />
                      <Text style={[styles.vitalMiniStatus, { color: v.color }]}>{v.status}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Middle 2-Column Module Layout */}
              <View style={styles.showcaseGrid}>
                {/* AI Assistant Chat Preview */}
                <View style={styles.aiWidgetCard}>
                  <View style={styles.widgetHeader}>
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>🤖 CLINICAL ASSISTANT</Text>
                    </View>
                    <Text style={styles.aiModelVersion}>GPT-4 Medical Model</Text>
                  </View>

                  <View style={styles.chatMessageAi}>
                    <Text style={styles.chatMessageTitle}>Biometric Analysis & Triage</Text>
                    <Text style={styles.chatMessageContent}>
                      "Patient vitals remain stable over the 7-day rolling window. Metformin 500mg (Evening) scheduled in 2h. No acute drug interactions detected."
                    </Text>
                  </View>

                  <View style={styles.promptChipsDemo}>
                    <TouchableOpacity
                      style={styles.demoChip}
                      onPress={() => navigation.navigate("MainApp")}
                    >
                      <Text style={styles.demoChipText}>💬 Explain lab reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.demoChip}
                      onPress={() => navigation.navigate("MainApp")}
                    >
                      <Text style={styles.demoChipText}>🩺 Symptom analysis</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Today's Schedule & Teleconsult Widget */}
                <View style={styles.scheduleWidgetCard}>
                  <View style={styles.widgetHeader}>
                    <Text style={styles.widgetTitle}>📅 Today's Regimen</Text>
                    <Text style={styles.adherenceBadge}>94% On-Track</Text>
                  </View>

                  <View style={styles.scheduleTimeline}>
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#10B981" }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineTitle}>Metformin 500mg · 8:00 AM</Text>
                        <Text style={styles.timelineSub}>Completed ✓</Text>
                      </View>
                    </View>
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#F59E0B" }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineTitle}>Consultation with Dr. Priya Sharma</Text>
                        <Text style={styles.timelineSub}>Tomorrow at 10:00 AM · Cardiology</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.widgetCta}
                    onPress={() => navigation.navigate("MainApp")}
                  >
                    <Text style={styles.widgetCtaText}>Open Full Dashboard →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* BENTO GRID FEATURE SUITE */}
        <View style={styles.bentoSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>ARCHITECTURE & CAPABILITIES</Text>
            </View>
            <Text style={styles.sectionTitle}>Engineered for Modern Clinical Workflows</Text>
            <Text style={styles.sectionSub}>
              Explore our modular healthcare toolchain designed for real-time monitoring and medical decision support.
            </Text>
          </View>

          <View style={styles.bentoGrid}>
            {/* Large Bento Card 1: AI Health Assistant */}
            <View style={[styles.bentoCard, styles.bentoCol8]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>🤖</Text>
              </View>
              <Text style={styles.bentoCardTag}>NATURAL CLINICAL NLP</Text>
              <Text style={styles.bentoCardTitle}>Context-Aware Medical AI Assistant</Text>
              <Text style={styles.bentoCardDesc}>
                Ask natural questions about drug interactions, lab diagnostics, symptom progression, and customized nutrition plans. Responses feature structured clinical observation cards and safety disclaimers.
              </Text>
              <View style={styles.bentoFeaturePillRow}>
                <Text style={styles.bentoPill}>Instant Triage</Text>
                <Text style={styles.bentoPill}>Lab Interpretation</Text>
                <Text style={styles.bentoPill}>Pharmacology Intelligence</Text>
              </View>
            </View>

            {/* Small Bento Card 2: 4-Step Symptom Checker */}
            <View style={[styles.bentoCard, styles.bentoCol4]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>🩺</Text>
              </View>
              <Text style={styles.bentoCardTag}>CLINICAL TRIAGE</Text>
              <Text style={styles.bentoCardTitle}>4-Step Symptom Checker</Text>
              <Text style={styles.bentoCardDesc}>
                Guided symptom analysis with duration tracking, pain severity scoring, and emergency red-flag detection.
              </Text>
            </View>

            {/* Small Bento Card 3: Encrypted Records */}
            <View style={[styles.bentoCard, styles.bentoCol4]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>📂</Text>
              </View>
              <Text style={styles.bentoCardTag}>ENCRYPTED VAULT</Text>
              <Text style={styles.bentoCardTitle}>Health Records & PDF Reports</Text>
              <Text style={styles.bentoCardDesc}>
                Organize CBC panels, radiology DICOM scans, and prescriptions with 1-click export and verification.
              </Text>
            </View>

            {/* Large Bento Card 4: Medicine Schedule */}
            <View style={[styles.bentoCard, styles.bentoCol8]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>💊</Text>
              </View>
              <Text style={styles.bentoCardTag}>DOSAGE COMPLIANCE</Text>
              <Text style={styles.bentoCardTitle}>Smart Medication Adherence Tracker</Text>
              <Text style={styles.bentoCardDesc}>
                Morning, Afternoon, and Night timeline schedules with 1-click dose completion, stock refill alerts, and longitudinal adherence scoring (94% on-track).
              </Text>
              <View style={styles.bentoFeaturePillRow}>
                <Text style={styles.bentoPill}>Dose Reminders</Text>
                <Text style={styles.bentoPill}>Refill Automation</Text>
                <Text style={styles.bentoPill}>94% Adherence KPI</Text>
              </View>
            </View>

            {/* Medium Card 5: Specialist Directory */}
            <View style={[styles.bentoCard, styles.bentoCol6]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>📅</Text>
              </View>
              <Text style={styles.bentoCardTag}>TELEMEDICINE & CLINIC</Text>
              <Text style={styles.bentoCardTitle}>Collision-Free Appointment Matrix</Text>
              <Text style={styles.bentoCardDesc}>
                Book verified specialists across Cardiology, Neurology, Orthopedics, and Pediatrics with real-time doctor availability.
              </Text>
            </View>

            {/* Medium Card 6: Health Analytics */}
            <View style={[styles.bentoCard, styles.bentoCol6]}>
              <View style={styles.bentoIconBadge}>
                <Text style={{ fontSize: 22 }}>📊</Text>
              </View>
              <Text style={styles.bentoCardTag}>BUSINESS & CLINICAL BI</Text>
              <Text style={styles.bentoCardTitle}>Biometric Analytics & Trends</Text>
              <Text style={styles.bentoCardDesc}>
                Track longitudinal blood pressure, glucose curves, heart rate variability, and export clinical audit logs.
              </Text>
            </View>
          </View>
        </View>

        {/* ENTERPRISE CTA SECTION */}
        <View style={styles.enterpriseCta}>
          <View style={styles.enterpriseInner}>
            <Text style={styles.enterpriseTitle}>
              Ready to Upgrade Your Healthcare Experience?
            </Text>
            <Text style={styles.enterpriseSub}>
              Access the complete MEDCARE AI clinical suite now. Seamlessly manage vitals, medications, and specialist consultations.
            </Text>
            <TouchableOpacity
              style={styles.enterpriseBtn}
              onPress={() => navigation.navigate("MainApp")}
              activeOpacity={0.85}
            >
              <Text style={styles.enterpriseBtnText}>Launch MEDCARE AI Workspace →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerBrandCol}>
              <Text style={styles.footerBrandTitle}>MEDCARE<Text style={{ color: "#0D9488" }}>.AI</Text></Text>
              <Text style={styles.footerBrandDesc}>
                Production-grade clinical intelligence and healthcare management suite for modern medicine.
              </Text>
              <Text style={styles.footerLegal}>© {new Date().getFullYear()} MEDCARE AI Inc. All rights reserved.</Text>
            </View>
            <View style={styles.footerLinksCol}>
              <Text style={styles.footerHeader}>Platform</Text>
              <TouchableOpacity onPress={() => navigation.navigate("MainApp")}><Text style={styles.footerLink}>Dashboard</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("MainApp")}><Text style={styles.footerLink}>AI Assistant</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("MainApp")}><Text style={styles.footerLink}>Symptom Checker</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("MainApp")}><Text style={styles.footerLink}>Medication Tracker</Text></TouchableOpacity>
            </View>
            <View style={styles.footerLinksCol}>
              <Text style={styles.footerHeader}>Security</Text>
              <Text style={styles.footerLink}>Security Controls</Text>
              <Text style={styles.footerLink}>256-Bit SSL/TLS</Text>
              <Text style={styles.footerLink}>Audit Trail Logging</Text>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </View>
            <View style={styles.footerLinksCol}>
              <Text style={styles.footerHeader}>Portals</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={[styles.footerLink, { color: "#0D9488", fontWeight: "800" }]}>🩺 Staff Login</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={[styles.footerLink, { color: "#0284C7", fontWeight: "800" }]}>👤 Patient Portal</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070D18", // Modern Deep Navy
  },
  scrollContent: {
    alignItems: "center",
    position: "relative",
  },
  topGlow: {
    position: "absolute",
    top: -120,
    width: 700,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(13, 148, 136, 0.18)",
    opacity: 0.8,
  },
  navbar: {
    width: "100%",
    backgroundColor: "rgba(7, 13, 24, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    position: Platform.OS === "web" ? ("sticky" as any) : "relative",
    top: 0,
    zIndex: 100,
  },
  navContainer: {
    width: "100%",
    maxWidth: 1200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0D9488",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  brandTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  brandAi: {
    color: "#14B8A6",
  },
  brandTagline: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  navMenu: {
    flexDirection: "row",
    gap: 22,
  },
  navItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#14B8A6",
  },
  navItemText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  navItemTextActive: {
    color: "white",
    fontWeight: "900",
  },
  navAuthGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  signInBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  signInBtnText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },
  launchBtn: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  launchBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  heroWrapper: {
    width: "100%",
    maxWidth: 1140,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 60,
    alignItems: "center",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 22,
    gap: 8,
  },
  heroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#14B8A6",
  },
  heroPillText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroPillTag: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroPillTagText: {
    color: "white",
    fontSize: 9,
    fontWeight: "900",
  },
  heroHeading: {
    color: "white",
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1.2,
    lineHeight: 56,
    marginBottom: 18,
  },
  heroHeadingGradient: {
    color: "#2DD4BF",
  },
  heroSubtitle: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 720,
    marginBottom: 32,
  },
  heroCtaRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 40,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  primaryCta: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#0D9488",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryCtaText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryCta: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryCtaText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  trustMetricBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 44,
    flexWrap: "wrap",
    gap: 18,
  },
  trustMetricItem: {
    alignItems: "center",
  },
  trustNum: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  trustLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  trustDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  showcaseCard: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
  },
  showcaseBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0B1120",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  macButtons: {
    flexDirection: "row",
    gap: 6,
  },
  macDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  browserAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  lockIcon: {
    fontSize: 10,
  },
  browserUrl: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  liveBeacon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveBeaconText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "900",
  },
  showcaseBody: {
    padding: 20,
    gap: 16,
  },
  vitalsDeck: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  vitalMiniCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  vitalMiniHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vitalMiniLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  vitalMiniVal: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 4,
  },
  vitalMiniUnit: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vitalMiniStatus: {
    fontSize: 10,
    fontWeight: "800",
  },
  showcaseGrid: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  aiWidgetCard: {
    flex: 1.3,
    minWidth: 280,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiBadge: {
    backgroundColor: "rgba(13, 148, 136, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: "#2DD4BF",
    fontSize: 10,
    fontWeight: "900",
  },
  aiModelVersion: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  chatMessageAi: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0D9488",
    marginBottom: 12,
  },
  chatMessageTitle: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  chatMessageContent: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 17,
  },
  promptChipsDemo: {
    flexDirection: "row",
    gap: 8,
  },
  demoChip: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoChipText: {
    color: "#99F6E4",
    fontSize: 11,
    fontWeight: "700",
  },
  scheduleWidgetCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "space-between",
  },
  widgetTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  adherenceBadge: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "800",
  },
  scheduleTimeline: {
    gap: 10,
    marginVertical: 12,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineTitle: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  timelineSub: {
    color: "#94A3B8",
    fontSize: 10,
  },
  widgetCta: {
    backgroundColor: "#0D9488",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  widgetCtaText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },
  bentoSection: {
    width: "100%",
    maxWidth: 1140,
    paddingHorizontal: 20,
    paddingVertical: 70,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  sectionPill: {
    backgroundColor: "rgba(20, 184, 166, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 8,
  },
  sectionPillText: {
    color: "#2DD4BF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  sectionSub: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 620,
    marginTop: 6,
    lineHeight: 20,
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  bentoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  bentoCol8: {
    width: "65%",
    minWidth: 320,
    flexGrow: 1,
  },
  bentoCol4: {
    width: "31%",
    minWidth: 260,
    flexGrow: 1,
  },
  bentoCol6: {
    width: "48%",
    minWidth: 280,
    flexGrow: 1,
  },
  bentoIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  bentoCardTag: {
    color: "#2DD4BF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bentoCardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  bentoCardDesc: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
  },
  bentoFeaturePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },
  bentoPill: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enterpriseCta: {
    width: "100%",
    maxWidth: 1140,
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  enterpriseInner: {
    backgroundColor: "#0B2D2B",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(45, 212, 191, 0.3)",
  },
  enterpriseTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  enterpriseSub: {
    color: "#99F6E4",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 580,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  enterpriseBtn: {
    backgroundColor: "#2DD4BF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  enterpriseBtnText: {
    color: "#042F2E",
    fontSize: 14,
    fontWeight: "900",
  },
  footer: {
    width: "100%",
    backgroundColor: "#050A14",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  footerInner: {
    width: "100%",
    maxWidth: 1140,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 30,
  },
  footerBrandCol: {
    maxWidth: 320,
  },
  footerBrandTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  footerBrandDesc: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  footerLegal: {
    color: "#475569",
    fontSize: 11,
    marginTop: 12,
  },
  footerLinksCol: {
    minWidth: 140,
    gap: 8,
  },
  footerHeader: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },
  footerLink: {
    color: "#94A3B8",
    fontSize: 12,
  },
});
