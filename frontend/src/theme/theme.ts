export const Theme = {
  colors: {
    // Primary Brand
    primary: "#0F766E", // Deep Medical Teal
    primaryHover: "#0D9488",
    primaryLight: "#CCFBF1",
    primaryDark: "#042F2E",
    primaryMuted: "#F0FDFA",

    // Secondary & Accent
    secondary: "#0284C7", // Medical Sky Blue
    secondaryLight: "#E0F2FE",
    secondaryDark: "#0369A1",

    accent: "#6366F1", // Indigo / AI Purple
    accentLight: "#EEF2FF",

    // Dark & Neutral
    dark: "#0F172A", // Slate 900
    darkSecondary: "#1E293B", // Slate 800
    grayText: "#64748B", // Slate 500
    lightText: "#94A3B8", // Slate 400
    border: "#E2E8F0", // Slate 200
    borderLight: "#F1F5F9", // Slate 100
    cardBg: "#FFFFFF",
    bg: "#F8FAFC", // Off-white/slate

    // Status Feedback
    success: "#10B981",
    successLight: "#DCFCE7",
    successText: "#15803D",

    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningText: "#B45309",

    danger: "#EF4444",
    dangerLight: "#FEE2E2",
    dangerText: "#B91C1C",

    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoText: "#1D4ED8",
  },
  typography: {
    fontFamily: "System",
    h1: { fontSize: 32, fontWeight: "900" as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: "800" as const },
    h4: { fontSize: 15, fontWeight: "700" as const },
    body: { fontSize: 14, lineHeight: 20 },
    bodySm: { fontSize: 12, lineHeight: 16 },
    caption: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    pill: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
    },
  },
};
