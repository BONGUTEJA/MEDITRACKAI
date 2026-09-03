import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

interface VitalsStatusChipProps {
  label: "BP" | "Pulse" | "Temp" | "Weight" | "SpO2" | string;
  value: string;
}

export default function VitalsStatusChip({ label, value }: VitalsStatusChipProps) {
  // Determine clinical status based on vital signs
  let status: "normal" | "elevated" | "critical" = "normal";
  let statusText = "Normal";

  const numVal = parseFloat(value);

  if (label === "BP") {
    // Check systolic/diastolic e.g. "120/80"
    const parts = value.split("/").map((p) => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0])) {
      const systolic = parts[0];
      const diastolic = parts[1];
      if (systolic >= 140 || diastolic >= 90) {
        status = "critical";
        statusText = "High Stage 2";
      } else if (systolic >= 130 || diastolic >= 80) {
        status = "elevated";
        statusText = "Stage 1";
      } else if (systolic >= 120) {
        status = "elevated";
        statusText = "Elevated";
      }
    }
  } else if (label === "Pulse") {
    if (!isNaN(numVal)) {
      if (numVal < 50 || numVal > 115) {
        status = "critical";
        statusText = numVal < 50 ? "Bradycardia" : "Tachycardia";
      } else if (numVal < 60 || numVal > 100) {
        status = "elevated";
        statusText = "Borderline";
      }
    }
  } else if (label === "SpO2") {
    if (!isNaN(numVal)) {
      if (numVal < 92) {
        status = "critical";
        statusText = "Hypoxia Alert";
      } else if (numVal < 95) {
        status = "elevated";
        statusText = "Low SpO2";
      }
    }
  } else if (label === "Temp") {
    if (!isNaN(numVal)) {
      if (numVal >= 101) {
        status = "critical";
        statusText = "High Fever";
      } else if (numVal > 99.2) {
        status = "elevated";
        statusText = "Mild Fever";
      }
    }
  }

  // WCAG AAA high contrast color schemes
  const statusColors = {
    normal: {
      bg: "#DCFCE7",     // Light Emerald
      text: "#14532D",   // Deep Forest Green (Contrast > 7:1)
      border: "#86EFAC",
      badgeBg: "#16A34A",
    },
    elevated: {
      bg: "#FFEDD5",     // Light Orange/Amber
      text: "#7C2D12",   // Deep Rust Amber (Contrast > 7:1)
      border: "#FDBA74",
      badgeBg: "#EA580C",
    },
    critical: {
      bg: "#FEE2E2",     // Light Red
      text: "#7F1D1D",   // Deep Maroon Red (Contrast > 7:1)
      border: "#FCA5A5",
      badgeBg: "#DC2626",
    },
  };

  const currentTheme = statusColors[status];

  return (
    <View style={[styles.chip, { backgroundColor: currentTheme.bg, borderColor: currentTheme.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: currentTheme.text }]}>{label}</Text>
        <View style={[styles.statusDot, { backgroundColor: currentTheme.badgeBg }]} />
      </View>
      <Text style={[styles.value, { color: currentTheme.text }]}>{value}</Text>
      <Text style={[styles.statusText, { color: currentTheme.text }]}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: "900",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    opacity: 0.9,
  },
});
