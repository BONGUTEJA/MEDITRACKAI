import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import { registerUser } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import AnimatedSuccessModal from "../components/AnimatedSuccessModal";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await registerUser({
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
      });

      setCreatedSuccess(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Registration failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <View style={styles.container}>
        <View style={styles.authCard}>
          {/* Brand Header */}
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>MEDCARE AI CLINICAL</Text>
          </View>
          <Text style={styles.title}>Join MEDCARE AI</Text>
          <Text style={styles.subtitle}>
            Register a staff account to access hospital patient records and consultation workflows.
          </Text>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. Alex Morgan"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Staff Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="staff@medcareai.org"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create secure password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.disabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.registerBtnText}>Create Staff Account →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity
            style={styles.loginLinkBtn}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Success Modal */}
      <AnimatedSuccessModal
        visible={createdSuccess}
        title="Staff Account Created!"
        subtitle="Your clinical workstation profile has been registered. You can now log in."
        highlightLabel="Registered Staff"
        highlightValue={name}
        primaryButtonText="Proceed to Login →"
        onPrimaryAction={() => {
          setCreatedSuccess(false);
          navigation.replace("Login");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  authCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
    alignItems: "center",
  },
  brandBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  brandBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#0C2340",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#334E68",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: "100%",
  },
  errorBannerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: 14,
  },
  field: {
    width: "100%",
  },
  fieldLabel: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 13,
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "600",
  },
  registerBtn: {
    backgroundColor: "#0284C7",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  loginLinkBtn: {
    marginTop: 22,
    padding: 6,
  },
  loginLinkText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  loginLinkHighlight: {
    color: "#0284C7",
    fontWeight: "800",
  },
});
