import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

interface VitalsRecord {
  vital_bp?: string;
  vital_heart_rate?: number | string;
  vital_spo2?: number | string;
  consultation_date?: string;
}

interface VitalsTrendProps {
  records: VitalsRecord[];
}

export default function VitalsTrendVisualizer({ records }: VitalsTrendProps) {
  if (!records || records.length < 2) return null;

  // Analyze latest vs previous
  const latest = records[0];
  const prev = records[1];

  let bpTrend: "improving" | "stable" | "elevated" = "stable";
  let spo2Trend: "improving" | "stable" | "declining" = "stable";

  if (latest.vital_bp && prev.vital_bp) {
    const latSystolic = parseInt(latest.vital_bp.split("/")[0], 10);
    const prevSystolic = parseInt(prev.vital_bp.split("/")[0], 10);
    if (!isNaN(latSystolic) && !isNaN(prevSystolic)) {
      if (latSystolic < prevSystolic && latSystolic <= 125) {
        bpTrend = "improving";
      } else if (latSystolic > prevSystolic && latSystolic >= 135) {
        bpTrend = "elevated";
      }
    }
  }

  if (latest.vital_spo2 && prev.vital_spo2) {
    const latO2 = parseFloat(String(latest.vital_spo2));
    const prevO2 = parseFloat(String(prev.vital_spo2));
    if (!isNaN(latO2) && !isNaN(prevO2)) {
      if (latO2 > prevO2 && latO2 >= 96) spo2Trend = "improving";
      else if (latO2 < prevO2 && latO2 < 94) spo2Trend = "declining";
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MedicalIcon name="analytics" size={16} />
          <Text style={styles.title}>Vitals Trajectory & Clinical Trend</Text>
        </View>
        <Text style={styles.subtext}>Comparing last {records.length} visits</Text>
      </View>

      <View style={styles.row}>
        {/* BP Trend */}
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Blood Pressure</Text>
          <View style={[styles.badge, bpTrend === "improving" ? styles.bgSuccess : bpTrend === "elevated" ? styles.bgWarning : styles.bgStable]}>
            <Text style={[styles.badgeText, bpTrend === "improving" ? styles.textSuccess : bpTrend === "elevated" ? styles.textWarning : styles.textStable]}>
              {bpTrend === "improving" ? "↗ Normalizing" : bpTrend === "elevated" ? "▲ Elevated" : "→ Stable"}
            </Text>
          </View>
        </View>

        {/* SpO2 Trend */}
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Oxygen (SpO2)</Text>
          <View style={[styles.badge, spo2Trend === "improving" ? styles.bgSuccess : spo2Trend === "declining" ? styles.bgDanger : styles.bgStable]}>
            <Text style={[styles.badgeText, spo2Trend === "improving" ? styles.textSuccess : spo2Trend === "declining" ? styles.textDanger : styles.textStable]}>
              {spo2Trend === "improving" ? "↗ Optimal" : spo2Trend === "declining" ? "▼ Low O2" : "→ Stable"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0C2340",
  },
  subtext: {
    fontSize: 10,
    color: "#627D98",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  trendItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  bgSuccess: { backgroundColor: "#DCFCE7" },
  textSuccess: { color: "#14532D" },
  bgWarning: { backgroundColor: "#FFEDD5" },
  textWarning: { color: "#7C2D12" },
  bgDanger: { backgroundColor: "#FEE2E2" },
  textDanger: { color: "#7F1D1D" },
  bgStable: { backgroundColor: "#E0F2FE" },
  textStable: { color: "#0369A1" },
});
