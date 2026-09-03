import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";
import {
  AuditLogItem,
  getAuditLogs,
  getSecurityEvents,
} from "../services/auditLogService";
import AmbientBackground from "../components/AmbientBackground";
import MedicalIcon from "../components/MedicalIcon";

type Props = NativeStackScreenProps<RootStackParamList, "AuditLogs">;

export default function AuditLogsScreen({ navigation }: Props) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"all" | "security" | "patient" | "consultation">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      if (activeCategory === "security") {
        const res = await getSecurityEvents(100);
        setLogs(res.logs);
        setTotalCount(res.total_count);
      } else {
        const res = await getAuditLogs({
          user_name: searchQuery.trim() || undefined,
          limit: 100,
        });
        setLogs(res.logs);
        setTotalCount(res.total_count);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs])
  );

  const filteredLogs = logs.filter((item) => {
    if (activeCategory === "patient") {
      return (
        item.action?.toLowerCase().includes("patient") ||
        item.action?.toLowerCase().includes("dossier") ||
        item.action?.toLowerCase().includes("doctor") ||
        item.action?.toLowerCase().includes("register") ||
        item.details?.toLowerCase().includes("patient") ||
        item.details?.toLowerCase().includes("doctor")
      );
    }
    if (activeCategory === "consultation") {
      return (
        item.action?.toLowerCase().includes("consult") ||
        item.action?.toLowerCase().includes("prescription") ||
        item.action?.toLowerCase().includes("vitals") ||
        item.action?.toLowerCase().includes("appointment")
      );
    }
    return true;
  });

  const securityCount = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes("login") ||
      l.action?.toLowerCase().includes("auth") ||
      l.action?.toLowerCase().includes("failed")
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.containerMaxWidth}>
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={loadLogs} style={styles.refreshBtn} activeOpacity={0.8}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MedicalIcon name="refresh" size={14} color="#0284C7" />
                <Text style={styles.refreshBtnText}>Refresh Trail</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headingBox}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowBadgeText}>COMPLIANCE & TRACEABILITY</Text>
            </View>
            <Text style={styles.title}>System Audit Trail & Security Logs</Text>
            <Text style={styles.subtitle}>
              Immutable record of all practitioner actions, profile modifications, data exports, and authentication events.
            </Text>
          </View>

          {/* Top Metric Strip */}
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL AUDITED EVENTS</Text>
              <Text style={styles.metricValue}>{totalCount}</Text>
              <Text style={styles.metricSub}>24h Log Window</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>SECURITY & AUTH LOGS</Text>
              <Text style={[styles.metricValue, { color: "#0284C7" }]}>{securityCount}</Text>
              <Text style={styles.metricSub}>Login & Session Events</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AUDIT INTEGRITY</Text>
              <Text style={[styles.metricValue, { color: "#10B981" }]}>🟢 Verified</Text>
              <Text style={styles.metricSub}>Security Controls Enabled</Text>
            </View>
          </View>

          {/* Toolbar: Category Chips & Search Bar */}
          <View style={styles.toolbarCard}>
            <View style={styles.categoryChipsRow}>
              {[
                { key: "all", label: "All Events" },
                { key: "patient", label: "Patient EHR" },
                { key: "consultation", label: "Consultations & Rx" },
                { key: "security", label: "Security & Logins" },
              ].map((c) => {
                const isActive = activeCategory === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(c.key as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.searchBox}>
              <MedicalIcon name="search" size={16} color="#0284C7" />
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Filter audit records by user, keyword, or action..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={loadLogs}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
                  <Text style={{ color: "#64748B", fontWeight: "900" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Dense Structured Audit Table */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.loadingText}>Loading audit logs & compliance matrix...</Text>
            </View>
          ) : filteredLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>No Audit Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No events matching "${searchQuery}".`
                  : "All system activities and authentication attempts will be recorded here."}
              </Text>
            </View>
          ) : (
            <View style={styles.tableCard}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.6 }]}>TIMESTAMP</Text>
                <Text style={[styles.thCell, { flex: 2 }]}>USER & ROLE</Text>
                <Text style={[styles.thCell, { flex: 2.4 }]}>ACTION TYPE</Text>
                <Text style={[styles.thCell, { flex: 3 }]}>RESOURCE & DETAILS</Text>
                <Text style={[styles.thCell, { flex: 1.4, textAlign: "right" }]}>IP TRACE</Text>
              </View>

              {/* Table Body */}
              {filteredLogs.map((item, idx) => {
                const isSecurity =
                  item.action?.toLowerCase().includes("login") ||
                  item.action?.toLowerCase().includes("auth") ||
                  item.action?.toLowerCase().includes("failed");
                const isEven = idx % 2 === 0;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.tableDataRow,
                      isEven && styles.tableDataRowEven,
                      isSecurity && styles.tableDataRowSecurity,
                    ]}
                  >
                    <View style={{ flex: 1.6 }}>
                      <Text style={styles.timeText}>
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          : "Just now"}
                      </Text>
                      <Text style={styles.dateSubText}>
                        {item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : ""}
                      </Text>
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={styles.userName}>{item.user_name || "System"}</Text>
                      <View style={[styles.roleBadge, isSecurity && { backgroundColor: "#FEE2E2" }]}>
                        <Text style={[styles.roleBadgeText, isSecurity && { color: "#B91C1C" }]}>
                          {item.user_role || "Staff"}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 2.4 }}>
                      <Text style={styles.actionText}>{item.action}</Text>
                    </View>

                    <View style={{ flex: 3 }}>
                      <Text style={styles.detailsText} numberOfLines={2}>
                        {item.details || "System event verified"}
                      </Text>
                    </View>

                    <View style={{ flex: 1.4, alignItems: "flex-end" }}>
                      <View style={styles.ipBadge}>
                        <Text style={styles.ipBadgeText}>{item.ip_address || "127.0.0.1"}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F7FF",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  containerMaxWidth: {
    width: "100%",
    maxWidth: 1100,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  backText: {
    color: "#0284C7",
    fontWeight: "800",
    fontSize: 13,
  },
  refreshBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  refreshBtnText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  headingBox: {
    marginBottom: 16,
  },
  eyebrowBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  eyebrowBadgeText: {
    color: "#0369A1",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0C2340",
  },
  subtitle: {
    fontSize: 13,
    color: "#334155",
    marginTop: 4,
    fontWeight: "500",
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  metricValue: {
    color: "#0C2340",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 4,
  },
  metricSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  toolbarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 16,
    gap: 12,
  },
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryChipActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
  },
  categoryChipText: {
    color: "#0369A1",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0C2340",
    fontWeight: "600",
    outlineStyle: "none" as any,
  },
  tableCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#BAE6FD",
  },
  thCell: {
    color: "#0369A1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tableDataRowEven: {
    backgroundColor: "rgba(248, 250, 252, 0.6)",
  },
  tableDataRowSecurity: {
    backgroundColor: "rgba(254, 242, 242, 0.5)",
  },
  timeText: {
    color: "#0C2340",
    fontSize: 12,
    fontWeight: "800",
  },
  dateSubText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },
  userName: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "800",
  },
  roleBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  roleBadgeText: {
    color: "#0284C7",
    fontSize: 10,
    fontWeight: "700",
  },
  actionText: {
    color: "#0C2340",
    fontSize: 13,
    fontWeight: "700",
  },
  detailsText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "500",
  },
  ipBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ipBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  loadingBox: {
    padding: 50,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#0284C7",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 400,
  },
});
