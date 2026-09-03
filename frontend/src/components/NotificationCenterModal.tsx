import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NotificationItem } from "../services/notificationService";
import MedicalIcon from "./MedicalIcon";

type Props = {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  loading?: boolean;
};

export default function NotificationCenterModal({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  loading,
}: Props) {
  const [filterTab, setFilterTab] = useState<"all" | "appointment" | "medication">("all");

  const filtered = notifications.filter((n) => {
    if (filterTab === "appointment") return n.notification_type === "appointment";
    if (filterTab === "medication") return n.notification_type === "medication";
    return true;
  });

  const apptCount = notifications.filter((n) => n.notification_type === "appointment").length;
  const medCount = notifications.filter((n) => n.notification_type === "medication").length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Notifications & Alerts</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>
                Appointment reminders and scheduled tablet medication alerts.
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, filterTab === "all" && styles.tabActive]}
              onPress={() => setFilterTab("all")}
            >
              <Text style={[styles.tabText, filterTab === "all" && styles.tabTextActive]}>
                All ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, filterTab === "appointment" && styles.tabActive]}
              onPress={() => setFilterTab("appointment")}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <MedicalIcon
                  name="calendar"
                  size={13}
                  color={filterTab === "appointment" ? "white" : "#0284C7"}
                />
                <Text style={[styles.tabText, filterTab === "appointment" && styles.tabTextActive]}>
                  Appointments ({apptCount})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, filterTab === "medication" && styles.tabActive]}
              onPress={() => setFilterTab("medication")}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <MedicalIcon
                  name="pills"
                  size={13}
                  color={filterTab === "medication" ? "white" : "#0284C7"}
                />
                <Text style={[styles.tabText, filterTab === "medication" && styles.tabTextActive]}>
                  Tablets ({medCount})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Bar */}
          {unreadCount > 0 && (
            <View style={styles.actionBar}>
              <TouchableOpacity onPress={onMarkAllRead} style={styles.markAllBtn} activeOpacity={0.7}>
                <Text style={styles.markAllBtnText}>✓ Mark all as read</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0284C7" />
              <Text style={styles.loadingText}>Syncing clinical notifications...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MedicalIcon name="bell" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                {filterTab === "all"
                  ? "You're all caught up! No active clinical alerts."
                  : `No ${filterTab} notifications on record.`}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
              {filtered.map((item) => {
                const isMed = item.notification_type === "medication";
                const isUnread = !item.is_read;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notifCard,
                      isUnread && styles.notifCardUnread,
                      isMed && styles.notifCardMed,
                    ]}
                    onPress={() => isUnread && onMarkRead(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notifTopRow}>
                      <View style={[styles.iconCircle, isUnread && styles.iconCircleUnread]}>
                        <MedicalIcon
                          name={isMed ? "pills" : "calendar"}
                          size={16}
                          color={isUnread ? "#0284C7" : "#627D98"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleAndStatusRow}>
                          <Text style={styles.notifTitle}>{item.title}</Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notifMessage}>{item.message}</Text>

                        {(item as any).dosage && (
                          <View style={styles.dosagePill}>
                            <Text style={styles.dosagePillText}>
                              Dosage: {(item as any).dosage} · {(item as any).frequency || "Daily"}
                            </Text>
                          </View>
                        )}

                        <Text style={styles.timestamp}>
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(12, 35, 64, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(8px)",
        } as any)
      : {}),
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#0C2340",
    fontSize: 20,
    fontWeight: "900",
  },
  unreadBadge: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  subtitle: {
    color: "#334E68",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: "#627D98",
    fontSize: 18,
    fontWeight: "900",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "white",
    fontWeight: "900",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllBtnText: {
    color: "#0284C7",
    fontSize: 12,
    fontWeight: "800",
  },
  scrollList: {
    maxHeight: 380,
  },
  notifCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  notifCardUnread: {
    backgroundColor: "#E0F2FE",
    borderColor: "#0284C7",
  },
  notifCardMed: {
    borderLeftWidth: 4,
    borderLeftColor: "#0284C7",
  },
  notifTopRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  iconCircleUnread: {
    borderColor: "#0284C7",
  },
  iconEmoji: {
    fontSize: 18,
  },
  titleAndStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifTitle: {
    color: "#0C2340",
    fontSize: 14,
    fontWeight: "800",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0284C7",
  },
  notifMessage: {
    color: "#334E68",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  dosagePill: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  dosagePillText: {
    color: "#0284C7",
    fontSize: 11,
    fontWeight: "800",
  },
  timestamp: {
    color: "#627D98",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#627D98",
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#0C2340",
    fontSize: 16,
    fontWeight: "900",
  },
  emptySubtitle: {
    color: "#627D98",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
