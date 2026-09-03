import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MedicalIcon from "../components/MedicalIcon";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: Toast["type"], message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: Toast["type"], message: string, title?: string) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, message, title };
    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts at a time

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast("success", message, title || "Success");
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast("error", message, title || "Error");
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast("info", message, title || "Information");
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast("warning", message, title || "Warning");
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.toastCard,
              t.type === "success" && styles.toastSuccess,
              t.type === "error" && styles.toastError,
              t.type === "warning" && styles.toastWarning,
              t.type === "info" && styles.toastInfo,
            ]}
            onPress={() => removeToast(t.id)}
            activeOpacity={0.9}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>
                {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warning" ? "⚠️" : "ℹ️"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {t.title && <Text style={styles.toastTitle}>{t.title}</Text>}
              <Text style={styles.toastMessage}>{t.message}</Text>
            </View>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 99999,
    gap: 10,
    maxWidth: 420,
    width: "90%",
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  toastSuccess: {
    borderColor: "#10B981",
    backgroundColor: "#064E3B",
  },
  toastError: {
    borderColor: "#EF4444",
    backgroundColor: "#7F1D1D",
  },
  toastWarning: {
    borderColor: "#F59E0B",
    backgroundColor: "#78350F",
  },
  toastInfo: {
    borderColor: "#0284C7",
    backgroundColor: "#0C2340",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  toastTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  toastMessage: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  closeText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    padding: 4,
  },
});
