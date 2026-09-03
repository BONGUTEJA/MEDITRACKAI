import React, { useEffect } from "react";
import { Platform } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { ToastProvider } from "./src/context/ToastContext";

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // 1. Safe patch for removeChild to prevent React crash if any DOM node is unmounted asynchronously
      if (typeof Node !== "undefined" && Node.prototype) {
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
          if (child && child.parentNode !== this) {
            if (child.parentNode) {
              return child.parentNode.removeChild(child) as T;
            }
            return child;
          }
          return originalRemoveChild.call(this, child) as T;
        };
      }

      // 2. Inject clean CSS specifically targeting Expo Web Dev button / Fast Refresh badge
      const styleId = "hide-expo-dev-flash-btn";
      let style = document.getElementById(styleId) as HTMLStyleElement;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        /* Hide Expo Web Dev Menu / Flash Fast Refresh Floating Button */
        [data-expo-dev-menu],
        #expo-dev-menu,
        [data-testid="expo-dev-menu"],
        [data-testid="dev-menu-trigger"],
        div[data-expo-dev-menu="true"],
        div[class*="expo-dev"],
        div[class*="ExpoDev"],
        button[aria-label="Toggle developer menu"],
        button[aria-label="Development menu"],
        [aria-label*="expo dev" i] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transform: scale(0) !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
