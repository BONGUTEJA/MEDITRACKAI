import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getUserProfile, updateUserProfile } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import AmbientBackground from "../components/AmbientBackground";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigation.replace("Login");
      return;
    }
    let active = true;
    getUserProfile(user.id)
      .then((fresh) => {
        if (!active) return;
        setName(fresh.name);
        setEmail(fresh.email);
        setPhone(fresh.phone ?? "");
        setAddress(fresh.address ?? "");
        updateUser(fresh);
      })
      .catch((error) => {
        const msg = error?.response?.data?.detail || "Could not load profile";
        setStatusBanner({ type: "error", text: msg });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [navigation, updateUser, user]);

  const handleSave = async () => {
    if (!user) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanEmail) {
      setStatusBanner({ type: "error", text: "Full name and email address are required." });
      return;
    }
    try {
      setSaving(true);
      const profile = {
        name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        address: address.trim(),
      };
      const response = await updateUserProfile(user.id, profile);
      const updated = response?.user ?? { ...user, ...profile };
      updateUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setPhone(updated.phone ?? "");
      setAddress(updated.address ?? "");
      setStatusBanner({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setStatusBanner(null), 3000);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Could not update profile";
      setStatusBanner({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading staff profile...</Text>
      </View>
    );
  }

  const initial = name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.containerMaxWidth}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
          </View>

          {/* Status Banner */}
          {statusBanner && (
            <View
              style={[
                styles.statusBanner,
                statusBanner.type === "success" ? styles.statusSuccess : styles.statusError,
              ]}
            >
              <Text
                style={[
                  styles.statusBannerText,
                  statusBanner.type === "success" ? styles.statusSuccessText : styles.statusErrorText,
                ]}
              >
                {statusBanner.type === "success" ? "✓ " : "⚠️ "}
                {statusBanner.text}
              </Text>
            </View>
          )}

          {/* Hero Profile Card */}
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{name || "Staff Member"}</Text>
              <Text style={styles.heroSubtitle}>{email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>CLINICAL STAFF</Text>
              </View>
            </View>
          </View>

          {/* Profile Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>Personal Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                editable={!saving}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Enter your address"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
                editable={!saving}
                autoCapitalize="sentences"
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Profile Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 620,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  topBar: {
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 15,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  statusError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  statusBannerText: {
    fontWeight: "700",
    fontSize: 14,
  },
  statusSuccessText: {
    color: "#166534",
  },
  statusErrorText: {
    color: "#991B1B",
  },
  heroCard: {
    backgroundColor: "#0F766E",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    shadowColor: "#0F766E",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#0F766E",
    fontSize: 26,
    fontWeight: "900",
  },
  heroName: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#D1FAE5",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "600",
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF28",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  cardHeader: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  field: {
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  addressInput: {
    minHeight: 80,
  },
  button: {
    backgroundColor: "#0F766E",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0F766E",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
