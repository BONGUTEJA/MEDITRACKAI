import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MedicalIcon from "./MedicalIcon";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastManager({ toasts, onDismiss }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isNative = Platform.OS !== "web";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: isNative,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: isNative,
      }),
    ]).start();

    const timer = setTimeout(() => {
      handleClose();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: isNative,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: isNative,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getTheme = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "#DCFCE7",
          border: "#86EFAC",
          text: "#14532D",
          icon: "check" as const,
        };
      case "error":
        return {
          bg: "#FEE2E2",
          border: "#FCA5A5",
          text: "#7F1D1D",
          icon: "close" as const,
        };
      default:
        return {
          bg: "#E0F2FE",
          border: "#BAE6FD",
          text: "#0369A1",
          icon: "document" as const,
        };
    }
  };

  const theme = getTheme();

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <MedicalIcon name={theme.icon} size={16} />
      <Text style={[styles.toastText, { color: theme.text }]}>{toast.message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 9999,
    maxWidth: 380,
    width: "90%",
    gap: 8,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "900",
    opacity: 0.7,
  },
});
