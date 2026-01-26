// components/dashboard/HeaderBar.tsx
// Updated to use logo-3 image and match screenshot layout
import { useTheme } from "@/context/ThemeContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Bell, Signal } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

interface HeaderBarProps {
  userInitials: string;
  onGiftPress?: () => void;
  onThemeToggle?: () => void;
  onNotificationsPress?: () => void;
  notificationCount?: number;
}

export function HeaderBar({
  userInitials,
  onGiftPress,
  onThemeToggle,
  onNotificationsPress,
  notificationCount = 0,
}: HeaderBarProps) {
  const { colors, isDark } = useTheme();
  const { isConnected, connectionType } = useNetworkStatus();

  // Determine signal icon color based on network status
  const getSignalColor = () => {
    if (!isConnected) return '#DC2626'; // Red when disconnected
    return '#16A34A'; // Green when connected
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>{userInitials}</Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Action Icons - per guide: Gift, Signal, Sun, Bell */}
      <View style={styles.actionsContainer}>
        {/* <Pressable style={styles.iconButton} onPress={onGiftPress}>
          <Gift size={20} color={colors.textSecondary} />
        </Pressable> */}

        <Pressable style={styles.iconButton}>
          <Signal size={20} color={getSignalColor()} />
        </Pressable>

        {/* <Pressable style={styles.iconButton} onPress={onThemeToggle}>
          <Sun size={16} color={colors.textSecondary} />
        </Pressable> */}

        <Pressable style={styles.iconButton} onPress={onNotificationsPress}>
          <Bell size={20} color={colors.textSecondary} />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E2E33", // Will be dynamically set in component
  },
  spacer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E63946",
  },
});
