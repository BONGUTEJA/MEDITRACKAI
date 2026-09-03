import React, { useState } from "react";
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

interface EmergencyBannerProps {
  onTriagePress?: () => void;
}

export default function EmergencyTriageBanner({ onTriagePress }: EmergencyBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCallEmergency = () => {
    const url = "tel:911";
    if (Platform.OS !== "web") {
      Linking.openURL(url).catch(() => Alert.alert("Emergency Hotline", "Please dial 911 or your local emergency medical service."));
    } else {
      Alert.alert("Emergency Hotline Active", "Emergency Medical Response Hotline: 911 / (800) MED-CARE");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.leftBox}>
          <View style={styles.iconCircle}>
            <MedicalIcon name="vitals" size={20} />
          </View>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeText}>EMERGENCY PROTOCOL</Text>
            </View>
            <Text style={styles.title}>24/7 Clinical Emergency Hotline</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.75}
          >
            <Text style={styles.detailsToggleText}>{expanded ? "Hide Info ▲" : "Triage Rules ▼"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <MedicalIcon name="phone" size={14} />
            <Text style={styles.sosText}>Call ER (911)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.guidanceTitle}>Critical Red Flag Symptoms (Immediate ER Response):</Text>
          <Text style={styles.guidanceItem}>• Severe chest pain, pressure, or shortness of breath</Text>
          <Text style={styles.guidanceItem}>• Sudden numbness/weakness in face, arm, or leg (Stroke signs)</Text>
          <Text style={styles.guidanceItem}>• Oxygen SpO2 drops below 90% or Pulse &gt; 130 bpm</Text>
          <Text style={styles.guidanceItem}>• Loss of consciousness, severe trauma, or uncontrollable bleeding</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#EF4444",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  leftBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  badgeText: {
    color: "#991B1B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: "#7F1D1D",
    fontSize: 14,
    fontWeight: "900",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailsToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  detailsToggleText: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "800",
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#DC2626",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  sosText: {
    color: "white",
    fontWeight: "900",
    fontSize: 12,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
    gap: 4,
  },
  guidanceTitle: {
    color: "#7F1D1D",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
  },
  guidanceItem: {
    color: "#991B1B",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
});
