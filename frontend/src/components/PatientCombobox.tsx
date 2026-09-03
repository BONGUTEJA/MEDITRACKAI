import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Patient } from "../services/medtrackService";
import MedicalIcon from "./MedicalIcon";

interface Props {
  patients: Patient[];
  selectedPatientId?: number;
  onSelectPatient: (patient: Patient) => void;
  onClearPatient?: () => void;
  disabled?: boolean;
}

export default function PatientCombobox({
  patients,
  selectedPatientId,
  onSelectPatient,
  onClearPatient,
  disabled = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.patient_id?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }, [patients, searchQuery]);

  // If a patient is selected, show the compact high-density summary card
  if (selectedPatient && !isOpen) {
    return (
      <View style={styles.selectedCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {selectedPatient.full_name?.charAt(0).toUpperCase() || "P"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={styles.selectedName}>{selectedPatient.full_name}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>ID: {selectedPatient.patient_id}</Text>
            </View>
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>🩸 {selectedPatient.blood_group || "O+"}</Text>
            </View>
          </View>
          <Text style={styles.metaText}>
            {selectedPatient.gender} · {selectedPatient.age} yrs · 📞 {selectedPatient.phone}
          </Text>
        </View>

        {!disabled && (
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => {
              setIsOpen(true);
              setSearchQuery("");
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.changeBtnText}>Change ✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.comboboxContainer}>
      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <MedicalIcon name="search" size={18} color="#0284C7" />
        <TextInput
          style={styles.input}
          placeholder="🔍 Search patient by Name, Patient ID, or Phone..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={(txt) => {
            setSearchQuery(txt);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={isOpen}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearIconBtn}>
            <Text style={styles.clearIconText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Results */}
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownHeaderText}>
              {filteredPatients.length} {filteredPatients.length === 1 ? "Patient" : "Patients"} Found
            </Text>
            {selectedPatient && (
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.closeDropdownText}>Keep Current</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filteredPatients.length === 0 ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsText}>No patients match "{searchQuery}"</Text>
              </View>
            ) : (
              filteredPatients.map((p) => {
                const isCurrent = p.id === selectedPatientId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.resultItem, isCurrent && styles.resultItemActive]}
                    onPress={() => {
                      onSelectPatient(p);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultAvatar, isCurrent && styles.resultAvatarActive]}>
                      <Text style={[styles.resultAvatarText, isCurrent && styles.resultAvatarTextActive]}>
                        {p.full_name?.charAt(0).toUpperCase() || "P"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.resultName}>{p.full_name}</Text>
                        <Text style={styles.resultId}>({p.patient_id})</Text>
                      </View>
                      <Text style={styles.resultSub}>
                        {p.gender}, {p.age} yrs · 📞 {p.phone}
                      </Text>
                    </View>
                    <Text style={styles.selectArrowText}>{isCurrent ? "✓ Selected" : "Select →"}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  selectedName: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "800",
  },
  idBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  idBadgeText: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "700",
  },
  bloodBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodBadgeText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "800",
  },
  metaText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  changeBtn: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
  },
  comboboxContainer: {
    position: "relative",
    zIndex: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0C2340",
    fontWeight: "600",
    outlineStyle: "none" as any,
  },
  clearIconBtn: {
    padding: 4,
  },
  clearIconText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    maxHeight: 260,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0F2FE",
  },
  dropdownHeaderText: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  closeDropdownText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "700",
  },
  dropdownList: {
    maxHeight: 210,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultItemActive: {
    backgroundColor: "#F0F9FF",
  },
  resultAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  resultAvatarActive: {
    backgroundColor: "#0284C7",
  },
  resultAvatarText: {
    color: "#0284C7",
    fontSize: 14,
    fontWeight: "800",
  },
  resultAvatarTextActive: {
    color: "#FFFFFF",
  },
  resultName: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
  },
  resultId: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  resultSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  selectArrowText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "700",
  },
  noResultsBox: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});
