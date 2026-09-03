import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface Props {
  variant?: "pill" | "icon" | "full";
}

export default function ThemeToggleBtn({ variant = "pill" }: Props) {
  const { isDark, toggleTheme } = useAppTheme();

  if (variant === "icon") {
    return (
      <TouchableOpacity
        style={[styles.iconBtn, isDark && styles.iconBtnDark]}
        onPress={toggleTheme}
        activeOpacity={0.8}
        accessibilityLabel="Toggle Dark / Light Theme"
      >
        <Text style={styles.iconEmoji}>{isDark ? "☀️" : "🌙"}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === "full") {
    return (
      <TouchableOpacity
        style={[styles.fullBtn, isDark && styles.fullBtnDark]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <View style={styles.fullBtnContent}>
          <Text style={styles.fullEmoji}>{isDark ? "☀️" : "🌙"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fullTitle, isDark && styles.fullTitleDark]}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </Text>
            <Text style={[styles.fullSub, isDark && styles.fullSubDark]}>
              {isDark ? "Switch to clinical light theme" : "Switch to midnight dark theme"}
            </Text>
          </View>
          <View style={[styles.toggleSwitch, isDark && styles.toggleSwitchActive]}>
            <View style={[styles.switchThumb, isDark && styles.switchThumbActive]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.pillBtn, isDark && styles.pillBtnDark]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Text style={styles.pillEmoji}>{isDark ? "☀️" : "🌙"}</Text>
      <Text style={[styles.pillText, isDark && styles.pillTextDark]}>
        {isDark ? "Light Mode" : "Dark Mode"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  pillBtnDark: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(56, 189, 248, 0.4)",
    shadowColor: "#000000",
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "800",
  },
  pillTextDark: {
    color: "#38BDF8",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBtnDark: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  iconEmoji: {
    fontSize: 16,
  },
  fullBtn: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  fullBtnDark: {
    backgroundColor: "#1E293B",
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  fullBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fullEmoji: {
    fontSize: 20,
  },
  fullTitle: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
  },
  fullTitleDark: {
    color: "#F8FAFC",
  },
  fullSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  fullSubDark: {
    color: "#94A3B8",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#CBD5E1",
    padding: 2,
    justifyContent: "center",
  },
  toggleSwitchActive: {
    backgroundColor: "#0284C7",
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
