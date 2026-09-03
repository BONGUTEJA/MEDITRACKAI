import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { forgotPasswordUser, loginUser } from "../services/authService";
import { forgotPasswordPatient, loginPatientPortal } from "../services/medtrackService";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import AmbientBackground from "../components/AmbientBackground";
import MedicalIcon from "../components/MedicalIcon";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { loginStaff, loginPatient } = useAuth();
  const { theme } = useAppTheme();
  const [portalType, setPortalType] = useState<"staff" | "patient">("staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotPortal, setForgotPortal] = useState<"staff" | "patient">("staff");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      const msg =
        portalType === "staff"
          ? "Please enter your staff email and password."
          : "Please enter your Email or Patient ID (e.g. 001) and password.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Required Fields", msg);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      if (portalType === "staff") {
        const response = await loginUser({ email: cleanId.toLowerCase(), password });
        if (!response?.user?.id) throw new Error("User information was not returned by the server");
        loginStaff(response.user);
        navigation.replace("Dashboard");
      } else {
        const response = await loginPatientPortal({ email_or_id: cleanId, password });
        if (!response?.patient?.id) throw new Error("Patient information was not returned");
        loginPatient(response.patient);
        navigation.replace("PatientDashboard");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Invalid credentials. Please verify your details.";
      setErrorMessage(message);
      if (Platform.OS !== "web") Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotPortal(portalType);
    setForgotIdentifier(identifier.trim());
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotStatus(null);
    setForgotModalVisible(true);
  };

  const handleResetPassword = async () => {
    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setForgotStatus({
        type: "error",
        msg: forgotPortal === "staff" ? "Please enter your staff email." : "Please enter your Email or Patient ID.",
      });
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotStatus({
        type: "error",
        msg: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotStatus({
        type: "error",
        msg: "Passwords do not match. Please verify.",
      });
      return;
    }

    try {
      setForgotLoading(true);
      setForgotStatus(null);

      if (forgotPortal === "staff") {
        await forgotPasswordUser({
          email: cleanId.toLowerCase(),
          new_password: forgotNewPassword,
        });
      } else {
        await forgotPasswordPatient({
          email_or_id: cleanId,
          new_password: forgotNewPassword,
        });
      }

      setForgotStatus({
        type: "success",
        msg: "Password updated successfully! You can now log in with your new password.",
      });

      setPassword(forgotNewPassword);
      setIdentifier(cleanId);

      setTimeout(() => {
        setForgotModalVisible(false);
      }, 2200);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to reset password.";
      setForgotStatus({ type: "error", msg });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* FROSTED SKY BLUE GLASS CARD */}
        <View style={styles.glassCard}>
          {/* Brand Header */}
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <MedicalIcon name="hospital" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.brandTitle}>
                MEDCARE <Text style={styles.brandAi}>AI</Text>
              </Text>
              <Text style={styles.brandSubtitle}>Clinical Intelligence & Health Portal</Text>
            </View>
          </View>

          <Text style={styles.heading}>Welcome to Healthcare Portal</Text>
          <Text style={styles.subheading}>
            Secure role-based access for hospital practitioners, clinical staff, and registered patients.
          </Text>

          {/* Role Switcher Tabs */}
          <View style={styles.portalToggleContainer}>
            <TouchableOpacity
              style={[styles.portalTab, portalType === "staff" && styles.portalTabActive]}
              onPress={() => {
                setPortalType("staff");
                setIdentifier("");
                setPassword("");
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <MedicalIcon
                  name="doctor"
                  size={16}
                  color={portalType === "staff" ? "white" : "#0284C7"}
                />
                <Text style={[styles.portalTabText, portalType === "staff" && styles.portalTabTextActive]}>
                  Clinical & Admin Staff
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.portalTab, portalType === "patient" && styles.portalTabActive]}
              onPress={() => {
                setPortalType("patient");
                setIdentifier("");
                setPassword("");
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <MedicalIcon
                  name="user"
                  size={16}
                  color={portalType === "patient" ? "white" : "#0284C7"}
                />
                <Text style={[styles.portalTabText, portalType === "patient" && styles.portalTabTextActive]}>
                  Registered Patient
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            <Text style={styles.label}>
              {portalType === "staff" ? "Staff Official Email" : "Patient ID (e.g. 001) or Email Address"}
            </Text>
            <TextInput
              style={styles.glassInput}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={
                portalType === "staff"
                  ? "doctor@meditrack.com or admin@meditrack.com"
                  : "e.g. 001 or patient@example.com"
              }
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType={portalType === "staff" ? "email-address" : "default"}
            />

            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleOpenForgotModal}>
                <Text style={styles.forgotPassLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordTextInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeBtnText}>{showPassword ? "🙈 Hide" : "👁️ Show"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.glowingBtn, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.glowingBtnText}>
                  {portalType === "staff" ? "Sign In to Staff Workspace →" : "Sign In to Patient Portal →"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Registration Links */}
          <View style={styles.footerDivider}>
            {portalType === "staff" ? (
              <View style={styles.registerRow}>
                <Text style={styles.footerText}>Need a clinical practitioner account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text style={styles.linkText}>Create Staff Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.registerRow}>
                <Text style={styles.footerText}>First time visiting? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("PatientSignup")}>
                  <Text style={styles.linkText}>Create Patient Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* FORGOT PASSWORD MODAL */}
        <Modal visible={forgotModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalGlassCard}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MedicalIcon name="security" size={18} color="#0284C7" />
                  <Text style={styles.modalTitle}>Reset Password</Text>
                </View>
                <TouchableOpacity onPress={() => setForgotModalVisible(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {forgotPortal === "staff"
                  ? "Enter your staff email to set a new secure password."
                  : "Enter your Patient ID (e.g. 001) or Email to update your password."}
              </Text>

              {/* Status Message */}
              {forgotStatus && (
                <View
                  style={[
                    styles.modalStatusBox,
                    forgotStatus.type === "success" ? styles.modalStatusSuccess : styles.modalStatusError,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalStatusText,
                      forgotStatus.type === "success" ? styles.modalStatusSuccessText : styles.modalStatusErrorText,
                    ]}
                  >
                    {forgotStatus.type === "success" ? "✓ " : "⚠️ "}
                    {forgotStatus.msg}
                  </Text>
                </View>
              )}

              <View style={styles.modalForm}>
                <Text style={styles.label}>
                  {forgotPortal === "staff" ? "Staff Email" : "Patient ID or Email"}
                </Text>
                <TextInput
                  style={styles.glassInput}
                  value={forgotIdentifier}
                  onChangeText={setForgotIdentifier}
                  placeholder={forgotPortal === "staff" ? "staff@meditrack.com" : "e.g. 001 or email@test.com"}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />

                <Text style={[styles.label, { marginTop: 10 }]}>New Password</Text>
                <TextInput
                  style={styles.glassInput}
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />

                <Text style={[styles.label, { marginTop: 10 }]}>Confirm New Password</Text>
                <TextInput
                  style={styles.glassInput}
                  value={forgotConfirmPassword}
                  onChangeText={setForgotConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.glowingBtn, { marginTop: 18 }, forgotLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.glowingBtnText}>Update Password & Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF", // Soft Luminous Sky Blue
  },
  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "rgba(56, 189, 248, 0.28)", // Radiant Sky Blue Glow
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -100,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "rgba(14, 165, 233, 0.2)", // Cyan Sky Glow
  },
  container: {
    minHeight: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glassCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.88)", // Frosted Crystal Glass
    borderWidth: 1.5,
    borderColor: "rgba(186, 230, 253, 0.95)", // Soft Sky Blue Border
    shadowColor: "#0284C7",
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 6,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  brandIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  brandIconText: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0C2340",
    letterSpacing: -0.3,
  },
  brandAi: {
    color: "#0284C7",
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369A1",
    marginTop: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0C2340",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334E68",
    marginBottom: 24,
  },
  portalToggleContainer: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  portalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  portalTabActive: {
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  portalTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0369A1",
  },
  portalTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  formContainer: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0C2340",
    marginBottom: -4,
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -4,
  },
  forgotPassLink: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7",
  },
  glassInput: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.45)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#0C2340",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.45)",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0C2340",
    fontWeight: "600",
    outlineWidth: 0,
  },
  eyeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F0F9FF",
  },
  eyeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0284C7",
  },
  glowingBtn: {
    backgroundColor: "#0284C7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0284C7",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  glowingBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  footerDivider: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(186, 230, 253, 0.8)",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334E68",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0284C7",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12, 35, 64, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalGlassCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 22,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0C2340",
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#627D98",
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    color: "#334E68",
  },
  modalStatusBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  modalStatusSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#10B981",
    borderWidth: 1,
  },
  modalStatusError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalStatusSuccessText: {
    color: "#15803D",
  },
  modalStatusErrorText: {
    color: "#B91C1C",
  },
  modalForm: {
    gap: 8,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    width: "100%",
  },
  errorBannerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
});
