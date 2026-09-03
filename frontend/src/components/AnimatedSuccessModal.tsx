import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AnimatedSuccessModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  highlightLabel?: string;
  highlightValue?: string;
  primaryButtonText?: string;
  onPrimaryAction: () => void;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
}

export default function AnimatedSuccessModal({
  visible,
  title,
  subtitle,
  highlightLabel = "Assigned Health ID",
  highlightValue,
  primaryButtonText = "View Profile →",
  onPrimaryAction,
  secondaryButtonText,
  onSecondaryAction,
}: AnimatedSuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
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
          tension: 70,
          useNativeDriver: isNative,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: isNative,
        }),
      ]).start();

      // 2. Pulse checkmark
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 800,
            useNativeDriver: isNative,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: isNative,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim, pulseAnim]);

  if (!visible) return null;

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
          {/* Animated Celebration Icon */}
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconPulseRing} />
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✓</Text>
            </View>
          </Animated.View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Highlight Box (e.g. Assigned Patient ID) */}
          {highlightValue ? (
            <View style={styles.highlightBox}>
              <Text style={styles.highlightLabel}>{highlightLabel.toUpperCase()}</Text>
              <Text style={styles.highlightValue}>{highlightValue}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {secondaryButtonText && onSecondaryAction ? (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSecondaryAction}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onPrimaryAction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{primaryButtonText}</Text>
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
    maxWidth: 440,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconPulseRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(16, 185, 129, 0.18)",
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: -2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0C2340",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  highlightBox: {
    backgroundColor: "#E0F2FE",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#0284C7",
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    width: "100%",
    marginBottom: 22,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0369A1",
    letterSpacing: 1,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0284C7",
    letterSpacing: 1,
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryBtnText: {
    color: "#334E68",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
