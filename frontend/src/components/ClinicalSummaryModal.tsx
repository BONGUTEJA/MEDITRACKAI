import React from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

interface ClinicalSummaryProps {
  visible: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  age?: number | string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  diseases?: string;
  medications?: any[];
  consultations?: any[];
  emergencyContact?: string;
}

export default function ClinicalSummaryModal({
  visible,
  onClose,
  patientName,
  patientId,
  age,
  gender,
  bloodGroup,
  allergies,
  diseases,
  medications = [],
  consultations = [],
  emergencyContact,
}: ClinicalSummaryProps) {
  const handlePrintOrExport = () => {
    if (Platform.OS === "web") {
      window.print();
    } else {
      Alert.alert(
        "Export Clinical Summary",
        "Clinical summary generated for doctor handoff. You can save or share this report."
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MedicalIcon name="hospital" size={24} />
              <View>
                <Text style={styles.title}>Clinical Medical Summary</Text>
                <Text style={styles.subtitle}>OFFICIAL PATIENT HEALTH RECORD</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Patient Header Box */}
            <View style={styles.patientMetaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaName}>{patientName}</Text>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>ID: {patientId}</Text>
                </View>
              </View>
              <Text style={styles.metaSub}>
                {gender || "N/A"} · {age ? `${age} yrs` : "N/A"} · Blood: {bloodGroup || "Unknown"}
              </Text>
              {emergencyContact && (
                <Text style={styles.metaEmergency}>Emergency Contact: {emergencyContact}</Text>
              )}
            </View>

            {/* Critical Alerts */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>⚠️ Known Allergies & Clinical Alerts</Text>
              <Text style={[styles.sectionBody, allergies ? styles.alertText : null]}>
                {allergies || "No known adverse drug allergies recorded."}
              </Text>
            </View>

            {/* Chronic Illnesses */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>🩺 Existing Chronic Illnesses</Text>
              <Text style={styles.sectionBody}>
                {diseases || "None recorded on active clinical file."}
              </Text>
            </View>

            {/* Active Prescriptions */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>💊 Active Medications & Dosage</Text>
              {medications.length > 0 ? (
                medications.map((m: any, idx: number) => (
                  <View key={idx} style={styles.medRow}>
                    <Text style={styles.medName}>• {m.medicine_name || m.name || "Medication"}</Text>
                    <Text style={styles.medDosage}>
                      {m.dosage} — {m.frequency || "Daily"} ({m.duration || "Ongoing"})
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionBody}>No active digital prescriptions on record.</Text>
              )}
            </View>

            {/* Recent Vitals & Consultation Notes */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>📋 Recent Clinical Diagnosis</Text>
              {consultations.length > 0 ? (
                consultations.slice(0, 3).map((c: any, idx: number) => (
                  <View key={idx} style={styles.consultRow}>
                    <Text style={styles.consultDate}>{c.consultation_date || "Recent"}:</Text>
                    <Text style={styles.consultDiag}>{c.diagnosis}</Text>
                    {c.vital_bp && (
                      <Text style={styles.consultVitals}>
                        BP: {c.vital_bp} | Pulse: {c.vital_heart_rate} bpm | SpO2: {c.vital_spo2}%
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.sectionBody}>No prior consultations recorded.</Text>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printBtn} onPress={handlePrintOrExport} activeOpacity={0.8}>
              <MedicalIcon name="download" size={16} />
              <Text style={styles.printBtnText}>1-Tap Export / Print Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12, 35, 64, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheetContainer: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F0F9FF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#BAE6FD",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0C2340",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#627D98",
  },
  scrollContent: {
    padding: 20,
  },
  patientMetaBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  metaName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0C2340",
  },
  idBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  idBadgeText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "900",
  },
  metaSub: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  metaEmergency: {
    fontSize: 12,
    color: "#0284C7",
    fontWeight: "700",
    marginTop: 4,
  },
  sectionBox: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0C2340",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 12,
    color: "#334E68",
    lineHeight: 18,
  },
  alertText: {
    color: "#DC2626",
    fontWeight: "800",
  },
  medRow: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  medName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0284C7",
  },
  medDosage: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 10,
    marginTop: 2,
  },
  consultRow: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  consultDate: {
    fontSize: 11,
    fontWeight: "800",
    color: "#627D98",
  },
  consultDiag: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0C2340",
    marginTop: 2,
  },
  consultVitals: {
    fontSize: 11,
    color: "#0284C7",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1.5,
    borderTopColor: "#E2E8F0",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  cancelBtnText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 13,
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  printBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 13,
  },
});
