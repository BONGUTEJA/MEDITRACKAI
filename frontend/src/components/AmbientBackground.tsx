import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

export default function AmbientBackground() {
  const { isDark } = useAppTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. Base: Soft Blue-Gray or Dark Navy Base */}
      <View style={[styles.base, isDark && styles.baseDark]} />

      {/* 2. Optional: Subtle Grid/Dot Mesh Pattern on Web */}
      {Platform.OS === "web" && (
        <View style={[styles.gridPattern, isDark && styles.gridPatternDark]} />
      )}

      {/* 3. Center: Slightly Brighter Gradient Orb */}
      <View style={[styles.centerGlow, isDark && styles.centerGlowDark]} />

      {/* 4. Top Right: Large Blurred Cyan Circle */}
      <View style={[styles.topRightCyan, isDark && styles.topRightCyanDark]} />

      {/* 5. Bottom Left: Large Blurred Blue Circle */}
      <View style={[styles.bottomLeftBlue, isDark && styles.bottomLeftBlueDark]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EEF2F6", // Soft Blue-Gray Base
  },
  baseDark: {
    backgroundColor: "#070D1E", // Deep Obsidian Navy
  },
  gridPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.45,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(rgba(100, 116, 139, 0.18) 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        } as any)
      : {}),
  },
  gridPatternDark: {
    opacity: 0.25,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(rgba(56, 189, 248, 0.25) 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        } as any)
      : {}),
  },
  centerGlowDark: {
    backgroundColor: "rgba(14, 165, 233, 0.08)",
  },
  topRightCyanDark: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  bottomLeftBlueDark: {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  centerGlow: {
    position: "absolute",
    top: "30%",
    left: "25%",
    width: 650,
    height: 650,
    borderRadius: 325,
    backgroundColor: "rgba(255, 255, 255, 0.75)", // Brighter Center Gradient
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(90px)",
          transform: "translate(-10%, -10%)",
        } as any)
      : {}),
  },
  topRightCyan: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 550,
    height: 550,
    borderRadius: 275,
    backgroundColor: "rgba(6, 182, 212, 0.28)", // Large Blurred Cyan Circle
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(100px)",
        } as any)
      : {}),
  },
  bottomLeftBlue: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 580,
    height: 580,
    borderRadius: 290,
    backgroundColor: "rgba(37, 99, 235, 0.22)", // Large Blurred Blue Circle
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(110px)",
        } as any)
      : {}),
  },
});
