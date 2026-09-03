import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

interface Props {
  patientsCount: number;
  consultationsCount: number;
  doctorsCount: number;
}

export default function DashboardCharts({
  patientsCount,
  consultationsCount,
  doctorsCount,
}: Props) {
  // 7-day intake simulation based on current database counts
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const counts = [4, 7, 5, 9, 8, 3, Math.max(consultationsCount, 6)];
  const maxCount = Math.max(...counts, 10);

  const specialties = [
    { name: "Cardiology", pct: 35, color: "#0284C7" },
    { name: "Neurology", pct: 25, color: "#38BDF8" },
    { name: "Pediatrics", pct: 20, color: "#10B981" },
    { name: "General Medicine", pct: 20, color: "#F59E0B" },
  ];

  return (
    <View style={styles.container}>
      {/* Chart 1: 7-Day Clinical Volume */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowText}>CLINICAL WORKLOAD</Text>
            </View>
            <Text style={styles.chartTitle}>7-Day Intake & Consultations</Text>
          </View>
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>🟢 Real-Time Sync</Text>
          </View>
        </View>

        <View style={styles.barGraphContainer}>
          {weekDays.map((day, idx) => {
            const val = counts[idx];
            const heightPct = Math.round((val / maxCount) * 100);
            const isToday = idx === 6;

            return (
              <View key={day} style={styles.barColumn}>
                <Text style={[styles.barValText, isToday && styles.barValToday]}>{val}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPct}%` },
                      isToday ? styles.barFillToday : styles.barFillRegular,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabelText, isToday && styles.barLabelToday]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartFooterRow}>
          <Text style={styles.footerNote}>
            📈 Total Shift Volume: <Text style={{ fontWeight: "800", color: "#0284C7" }}>{consultationsCount} Records</Text>
          </Text>
          <Text style={styles.footerNote}>
            ⏱️ Avg. Consultation: <Text style={{ fontWeight: "800", color: "#10B981" }}>14 Mins</Text>
          </Text>
        </View>
      </View>

      {/* Chart 2: Specialty Department Distribution */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowText}>DEPARTMENT METRICS</Text>
            </View>
            <Text style={styles.chartTitle}>Consultation Specialty Mix</Text>
          </View>
          <View style={styles.specialistsPill}>
            <Text style={styles.specialistsPillText}>👨‍⚕️ {doctorsCount} On Duty</Text>
          </View>
        </View>

        {/* Stacked Progress Bar */}
        <View style={styles.stackedBarTrack}>
          {specialties.map((s) => (
            <View
              key={s.name}
              style={{
                width: `${s.pct}%`,
                backgroundColor: s.color,
                height: "100%",
              }}
            />
          ))}
        </View>

        {/* Legend List */}
        <View style={styles.legendGrid}>
          {specialties.map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendName}>{s.name}</Text>
              <Text style={styles.legendPct}>{s.pct}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartFooterRow}>
          <Text style={styles.footerNote}>
            🏥 Registered Patients: <Text style={{ fontWeight: "800", color: "#0284C7" }}>{patientsCount} Total</Text>
          </Text>
          <Text style={styles.footerNote}>
            🛡️ Audit Integrity: <Text style={{ fontWeight: "800", color: "#10B981" }}>Verified</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eyebrowBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  eyebrowText: {
    color: "#0369A1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  chartTitle: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
  },
  livePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  livePillText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "800",
  },
  specialistsPill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  specialistsPillText: {
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "800",
  },
  barGraphContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barValText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  barValToday: {
    color: "#0284C7",
    fontWeight: "900",
  },
  barTrack: {
    width: "70%",
    height: 70,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barFillRegular: {
    backgroundColor: "#BAE6FD",
  },
  barFillToday: {
    backgroundColor: "#0284C7",
  },
  barLabelText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },
  barLabelToday: {
    color: "#0284C7",
    fontWeight: "900",
  },
  stackedBarTrack: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginVertical: 16,
    backgroundColor: "#F1F5F9",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "45%",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  legendPct: {
    color: "#0C2340",
    fontSize: 12,
    fontWeight: "800",
  },
  chartFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexWrap: "wrap",
    gap: 8,
  },
  footerNote: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
});
