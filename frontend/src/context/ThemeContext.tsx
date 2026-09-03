import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";

export interface ColorScheme {
  mode: ThemeMode;
  bg: string;
  bgGradient: string[];
  cardBg: string;
  cardGlassBg: string;
  cardBorder: string;
  cardBorderGlow: string;
  sidebarBg: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryGlow: string;
  primaryLight: string;
  primaryText: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  success: string;
  successLight: string;
  successText: string;
  warning: string;
  warningLight: string;
  warningText: string;
  danger: string;
  dangerLight: string;
  dangerText: string;
  shadowColor: string;
}

export const lightSkyBlueTheme: ColorScheme = {
  mode: "light",
  bg: "#F0F7FF", // Soft Luminous Sky Blue
  bgGradient: ["#E8F4FD", "#F0F7FF", "#E0F2FE"],
  cardBg: "rgba(255, 255, 255, 0.85)", // Frosted Crystal Glass
  cardGlassBg: "rgba(240, 249, 255, 0.8)",
  cardBorder: "rgba(186, 230, 253, 0.9)", // Soft Sky Blue Border
  cardBorderGlow: "#38BDF8",
  sidebarBg: "#E0F2FE",
  headerBg: "rgba(240, 247, 255, 0.92)",
  inputBg: "rgba(255, 255, 255, 0.92)",
  inputBorder: "rgba(56, 189, 248, 0.45)",
  inputFocusBorder: "#0284C7",
  textPrimary: "#0C2340", // Deep Crisp Slate Navy
  textSecondary: "#334E68", // Soft Slate Blue
  textMuted: "#627D98",
  primary: "#0284C7", // Vibrant Sky Blue
  primaryHover: "#0369A1",
  primaryGlow: "rgba(2, 132, 199, 0.3)",
  primaryLight: "#E0F2FE", // Soft Ice Sky Pill
  primaryText: "#0284C7",
  secondary: "#0EA5E9", // Bright Cyan Sky
  secondaryLight: "#F0F9FF",
  accent: "#38BDF8",
  success: "#10B981",
  successLight: "#DCFCE7",
  successText: "#15803D",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningText: "#B45309",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  dangerText: "#B91C1C",
  shadowColor: "#0284C7",
};

export const darkMedicalTheme: ColorScheme = {
  mode: "dark",
  bg: "#0B132B", // Deep Midnight Navy
  bgGradient: ["#070D1E", "#0B132B", "#0F172A"],
  cardBg: "rgba(15, 23, 42, 0.88)", // Deep Frosted Slate Glass
  cardGlassBg: "rgba(30, 41, 59, 0.85)",
  cardBorder: "rgba(56, 189, 248, 0.3)", // Luminous Cyan Glow Border
  cardBorderGlow: "#38BDF8",
  sidebarBg: "#0F172A",
  headerBg: "rgba(11, 19, 43, 0.95)",
  inputBg: "rgba(30, 41, 59, 0.90)",
  inputBorder: "rgba(56, 189, 248, 0.35)",
  inputFocusBorder: "#38BDF8",
  textPrimary: "#F8FAFC", // Crisp Luminous White
  textSecondary: "#CBD5E1", // Soft Silver Slate
  textMuted: "#94A3B8",
  primary: "#38BDF8", // Luminous Cyan
  primaryHover: "#0EA5E9",
  primaryGlow: "rgba(56, 189, 248, 0.4)",
  primaryLight: "rgba(56, 189, 248, 0.18)",
  primaryText: "#38BDF8",
  secondary: "#0284C7",
  secondaryLight: "rgba(14, 165, 233, 0.15)",
  accent: "#38BDF8",
  success: "#10B981",
  successLight: "rgba(16, 185, 129, 0.2)",
  successText: "#34D399",
  warning: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.2)",
  warningText: "#FBBF24",
  danger: "#EF4444",
  dangerLight: "rgba(239, 68, 68, 0.2)",
  dangerText: "#F87171",
  shadowColor: "#000000",
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  theme: ColorScheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  isDark: false,
  theme: lightSkyBlueTheme,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("medcare_theme_mode") as ThemeMode | null;
      if (saved === "dark" || saved === "light") {
        setModeState(saved);
      }
    }
  }, []);

  const toggleTheme = () => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("medcare_theme_mode", next);
      }
      return next;
    });
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("medcare_theme_mode", newMode);
    }
  };

  const isDark = mode === "dark";
  const theme = isDark ? darkMedicalTheme : lightSkyBlueTheme;

  return (
    <ThemeContext.Provider value={{ mode, isDark, theme, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
