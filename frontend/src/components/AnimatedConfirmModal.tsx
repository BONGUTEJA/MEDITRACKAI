import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface AnimatedConfirmModalProps {
  visible: boolean;
  type?: "danger" | "warning" | "info";
  title: string;
  message: string;
  highlightValue?: string;
  highlightLabel?: string;
  confirmText?: string;
  cancelText?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AnimatedConfirmModal({
  visible,
  type = "danger",
  title,
  message,
  highlightValue,
  highlightLabel = "Target Record",
  confirmText = "Delete Record",
  cancelText = "Cancel",
  confirming = false,
  onConfirm,
  onCancel,
}: AnimatedConfirmModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const isNative = Platform.OS !== "web";
      // 1. Spring scale-in + fade-in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 75,
          useNativeDriver: isNative,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: isNative,
        }),
      ]).start();

      // 2. Pulse icon halo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.14,
            duration: 750,
            useNativeDriver: isNative,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: isNative,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.75);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, pulseAnim]);

  if (!visible) return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";

  const primaryColor = isDanger ? "#EF4444" : isWarning ? "#F59E0B" : "#0284C7";
  const primaryBgLight = isDanger ? "rgba(239, 68, 68, 0.16)" : isWarning ? "rgba(245, 158, 11, 0.16)" : "rgba(2, 132, 199, 0.16)";
  const iconEmoji = isDanger ? "🗑️" : isWarning ? "⚠️" : "ℹ️";

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Pulsing Icon */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={[styles.iconPulseRing, { backgroundColor: primaryBgLight }]} />
            <View style={[styles.iconCircle, { backgroundColor: primaryColor }]}>
              <Text style={styles.iconEmoji}>{iconEmoji}</Text>
            </View>
          </Animated.View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Target Highlight Badge */}
          {highlightValue ? (
            <View style={[styles.highlightBox, isDanger && styles.highlightBoxDanger]}>
              <Text style={[styles.highlightLabel, isDanger && styles.highlightLabelDanger]}>
                {highlightLabel.toUpperCase()}
              </Text>
              <Text style={[styles.highlightValue, isDanger && styles.highlightValueDanger]}>
                {highlightValue}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={confirming}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: primaryColor },
                confirming && styles.btnDisabled,
              ]}
              onPress={onConfirm}
              disabled={confirming}
              activeOpacity={0.85}
            >
              {confirming ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    padding: 20,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(8px)",
        } as any)
      : {}),
  },
  card: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 8,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconPulseRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0C2340",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  highlightBox: {
    backgroundColor: "#E0F2FE",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  highlightBoxDanger: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0369A1",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  highlightLabelDanger: {
    color: "#B91C1C",
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0284C7",
  },
  highlightValueDanger: {
    color: "#DC2626",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelBtnText: {
    color: "#334E68",
    fontSize: 14,
    fontWeight: "800",
  },
  confirmBtn: {
    flex: 1.3,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
