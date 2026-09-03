import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import {
  AnalyticsSummary,
  DemographicsData,
  DoctorWorkloadData,
  getAnalyticsSummary,
  getCsvExportUrl,
  getDemographics,
  getDoctorWorkload,
  getVisitTrends,
  VisitTrendsData,
} from "../services/analyticsService";
import AmbientBackground from "../components/AmbientBackground";
import MedicalIcon from "../components/MedicalIcon";

type Props = NativeStackScreenProps<RootStackParamList, "Analytics">;

const getDaysCount = (range: "7d" | "30d" | "90d" | "all"): number | undefined => {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
    default:
      return undefined;
  }
};

export default function AnalyticsScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [visitTrends, setVisitTrends] = useState<VisitTrendsData | null>(null);
  const [doctorWorkload, setDoctorWorkload] = useState<DoctorWorkloadData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (selectedRange: "7d" | "30d" | "90d" | "all" = timeRange) => {
    try {
      setLoading(true);
      const days = getDaysCount(selectedRange);
      const [sumRes, demoRes, trendsRes, workRes] = await Promise.all([
        getAnalyticsSummary(days),
        getDemographics(days),
        getVisitTrends(days),
        getDoctorWorkload(days),
      ]);
      setSummary(sumRes);
      setDemographics(demoRes);
      setVisitTrends(trendsRes);
      setDoctorWorkload(workRes);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useFocusEffect(
    useCallback(() => {
      loadData(timeRange);
    }, [loadData, timeRange])
  );

  const handleTimeRangeChange = (range: "7d" | "30d" | "90d" | "all") => {
    setTimeRange(range);
    loadData(range);
  };

  const handleExportCsv = () => {
    const days = getDaysCount(timeRange);
    const url = getCsvExportUrl(days);
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    }
  };

  const handlePrintReport = () => {
    if (Platform.OS === "web") {
      window.print();
    }
  };

  if (loading || !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading hospital intelligence & analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxTrend = visitTrends
    ? Math.max(1, ...Object.values(visitTrends.visit_trends))
    : 1;

  const totalPatients = demographics?.total_patients || 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.containerMaxWidth}>
          {/* Top Bar Navigation & Actions */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.exportGroup}>
              <TouchableOpacity style={styles.exportCsvBtn} onPress={handleExportCsv} activeOpacity={0.85}>
                <Text style={styles.exportCsvBtnText}>Export CSV Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrintReport} activeOpacity={0.85}>
                <Text style={styles.printBtnText}>Print / Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clean Executive Header (No Milestone Tag) */}
          <View style={styles.headingBox}>
            <View style={styles.executiveBadge}>
              <Text style={styles.executiveBadgeText}>EXECUTIVE CLINICAL INTELLIGENCE</Text>
            </View>
            <Text style={styles.title}>Hospital Analytics & Operations</Text>
            <Text style={styles.subtitle}>
              Live patient census, demographic cohorts, visit distribution, and physician productivity metrics.
            </Text>
          </View>

          {/* Time Range Filter Toolbar */}
          <View style={styles.timeRangeFilterRow}>
            <Text style={styles.timeRangeLabel}>TIME WINDOW:</Text>
            <View style={styles.timeRangeGroup}>
              {(["7d", "30d", "90d", "all"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.timeRangeBtn, timeRange === r && styles.timeRangeBtnActive]}
                  onPress={() => handleTimeRangeChange(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeRangeBtnText, timeRange === r && styles.timeRangeBtnTextActive]}>
                    {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : r === "90d" ? "Last Quarter" : "All Time"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Operational Performance KPI Cards */}
          <Text style={styles.sectionHeader}>Operational Performance Overview</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>TOTAL PATIENTS</Text>
                <MedicalIcon name="patients" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.total_patients}</Text>
              <Text style={styles.kpiHint}>Registered Dossiers</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>TODAY'S VISITS</Text>
                <MedicalIcon name="calendar" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.today_appointments}</Text>
              <Text style={styles.kpiHint}>Scheduled Today</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>COMPLETED VISITS</Text>
                <MedicalIcon name="check" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.completed_appointments}</Text>
              <Text style={styles.kpiHint}>Consultations Finished</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>CANCELLED VISITS</Text>
                <MedicalIcon name="close" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.cancelled_appointments}</Text>
              <Text style={styles.kpiHint}>Slot Cancellations</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>PRESCRIPTIONS</Text>
                <MedicalIcon name="pills" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.total_prescriptions}</Text>
              <Text style={styles.kpiHint}>Digital Rx Issued</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>ACTIVE DOCTORS</Text>
                <MedicalIcon name="doctor" size={16} color="#0284C7" />
              </View>
              <Text style={styles.kpiValue}>{summary.total_doctors}</Text>
              <Text style={styles.kpiHint}>Attending Specialists</Text>
            </View>
          </View>

          {/* Demographics & Visit Trends (2 Columns) */}
          <View style={styles.twoColRow}>
            {/* Column A: Patient Demographics */}
            <View style={[styles.card, { flex: 1 }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <MedicalIcon name="patients" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Patient Demographics</Text>
                  <Text style={styles.cardSubtitle}>Distribution across {totalPatients} registered patients.</Text>
                </View>
              </View>

              {demographics && (
                <View style={styles.demoContent}>
                  <Text style={styles.subHeader}>Age Cohort Distribution</Text>
                  {Object.entries(demographics.age_distribution).map(([ageRange, count]) => {
                    const pct = Math.round((count / totalPatients) * 100) || 0;
                    return (
                      <View key={ageRange} style={styles.barRow}>
                        <Text style={styles.barLabel}>{ageRange} yrs</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.barCount}>{count} ({pct}%)</Text>
                      </View>
                    );
                  })}

                  <Text style={[styles.subHeader, { marginTop: 20 }]}>Gender Breakdown</Text>
                  <View style={styles.genderRow}>
                    <View style={styles.genderBox}>
                      <MedicalIcon name="male" size={22} color="#0284C7" />
                      <Text style={styles.genderLabel}>Male</Text>
                      <Text style={styles.genderVal}>{demographics.gender_distribution.Male}</Text>
                    </View>
                    <View style={styles.genderBox}>
                      <MedicalIcon name="female" size={22} color="#0284C7" />
                      <Text style={styles.genderLabel}>Female</Text>
                      <Text style={styles.genderVal}>{demographics.gender_distribution.Female}</Text>
                    </View>
                    <View style={styles.genderBox}>
                      <MedicalIcon name="user" size={22} color="#0284C7" />
                      <Text style={styles.genderLabel}>Other</Text>
                      <Text style={styles.genderVal}>{demographics.gender_distribution.Other}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Column B: Day-of-Week Visit Trends */}
            <View style={[styles.card, { flex: 1 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: "#E0F2FE" }]}>
                  <MedicalIcon name="analytics" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Day-of-Week Visit Trends</Text>
                  <Text style={styles.cardSubtitle}>Patient appointment volume by day.</Text>
                </View>
              </View>

              {visitTrends && (
                <View style={styles.trendContent}>
                  {Object.entries(visitTrends.visit_trends).map(([day, count]) => {
                    const pct = Math.round((count / maxTrend) * 100);
                    const isPeak = count > 0 && count === maxTrend;
                    return (
                      <View key={day} style={styles.barRow}>
                        <Text style={[styles.dayLabel, isPeak && { color: "#2563EB", fontWeight: "900" }]}>
                          {day.slice(0, 3)}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFillTrend,
                              { width: `${Math.max(pct, 4)}%` },
                              isPeak && { backgroundColor: "#2563EB" },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barCount, isPeak && { color: "#2563EB", fontWeight: "900" }]}>
                          {count} visits
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Doctor Workload & Consultations Table */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: "#E0F2FE" }]}>
                <MedicalIcon name="doctor" size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Physician Workload & Productivity</Text>
                <Text style={styles.cardSubtitle}>Clinical consultations and appointment distribution across attending specialists.</Text>
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2.2 }]}>Attending Specialist</Text>
                <Text style={[styles.th, { flex: 2 }]}>Specialization</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: "center" }]}>Consultations</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: "center" }]}>Bookings</Text>
              </View>

              {doctorWorkload?.doctor_workload.map((doc) => (
                <View key={doc.doctor_id} style={styles.tableRow}>
                  <View style={{ flex: 2.2, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={styles.docAvatarCircle}>
                      <Text style={styles.docAvatarText}>
                        {doc.doctor_name?.replace("Dr. ", "").charAt(0) || "D"}
                      </Text>
                    </View>
                    <Text style={styles.docNameText}>{doc.doctor_name}</Text>
                  </View>
                  <View style={{ flex: 2 }}>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>{doc.specialization}</Text>
                    </View>
                  </View>
                  <Text style={[styles.td, { flex: 1.2, textAlign: "center", fontWeight: "900", color: "#0284C7" }]}>
                    {doc.consultations_count}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2, textAlign: "center", fontWeight: "700" }]}>
                    {doc.appointments_count}
                  </Text>
                </View>
              ))}
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
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 14,
    color: "#627D98",
    fontWeight: "700",
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
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 15,
  },
  exportGroup: {
    flexDirection: "row",
    gap: 10,
  },
  exportCsvBtn: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 2,
  },
  exportCsvBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  printBtn: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  printBtnText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  headingBox: {
    marginBottom: 24,
  },
  executiveBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  executiveBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: "#0C2340",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#334E68",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionHeader: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 26,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
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
  kpiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kpiLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  kpiIcon: {
    fontSize: 14,
    color: "#0284C7",
  },
  kpiValue: {
    color: "#0284C7",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },
  kpiHint: {
    color: "#627D98",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  twoColRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 20,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  cardTitle: {
    color: "#0C2340",
    fontSize: 17,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: "#334E68",
    fontSize: 12,
    marginTop: 2,
  },
  subHeader: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  demoContent: {
    gap: 8,
  },
  trendContent: {
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barLabel: {
    width: 68,
    color: "#334E68",
    fontSize: 12,
    fontWeight: "700",
  },
  dayLabel: {
    width: 42,
    color: "#334E68",
    fontSize: 12,
    fontWeight: "800",
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "#E0F2FE",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#0284C7",
    borderRadius: 6,
  },
  barFillTrend: {
    height: "100%",
    backgroundColor: "#0284C7",
    borderRadius: 6,
  },
  barCount: {
    width: 76,
    textAlign: "right",
    color: "#0C2340",
    fontSize: 12,
    fontWeight: "700",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  genderBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  genderEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  genderLabel: {
    color: "#627D98",
    fontSize: 11,
    fontWeight: "800",
  },
  genderVal: {
    color: "#0C2340",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  table: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#BAE6FD",
  },
  th: {
    color: "#0C2340",
    fontSize: 12,
    fontWeight: "800",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E0F2FE",
    backgroundColor: "rgba(255, 255, 255, 0.90)",
  },
  docAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  docAvatarText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },
  docNameText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 14,
  },
  specBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#CCFBF1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specBadgeText: {
    color: "#0F766E",
    fontSize: 11,
    fontWeight: "800",
  },
  td: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  // Time Range Filter Styles
  timeRangeFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  timeRangeLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  timeRangeGroup: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  timeRangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  timeRangeBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  timeRangeBtnTextActive: {
    color: "#0284C7",
    fontWeight: "900",
  },
});
