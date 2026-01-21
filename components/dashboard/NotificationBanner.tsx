// components/dashboard/NotificationBanner.tsx
// Home screen banner for important notifications (updates/all category)
import { useNotifications } from "@/hooks/useNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const DISMISSED_KEY = "dismissed_notification_banners";

// Icon and color mapping
const typeConfig = {
  info: { icon: Info, color: "#1976D2", bgColor: "#E3F2FD" },
  success: { icon: CheckCircle, color: "#2E7D32", bgColor: "#E8F5E9" },
  warning: { icon: AlertTriangle, color: "#F57C00", bgColor: "#FFF3E0" },
  error: { icon: AlertCircle, color: "#C62828", bgColor: "#FFEBEE" },
  alert: { icon: AlertCircle, color: "#C62828", bgColor: "#FFEBEE" },
};

export function NotificationBanner() {
  const router = useRouter();
  const { data } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const notifications = data?.data?.notifications || [];

  // Load dismissed IDs from storage
  useEffect(() => {
    const loadDismissed = async () => {
      try {
        const stored = await AsyncStorage.getItem(DISMISSED_KEY);
        if (stored) {
          setDismissedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load dismissed notifications");
      }
    };
    loadDismissed();
  }, []);

  // Filter for banner-worthy notifications (updates or all category, not dismissed)
  const bannerNotification = notifications.find((n: any) => {
    const category = n.notification?.category;
    const shouldShow = category === "updates" || category === "all";
    const notDismissed = !dismissedIds.includes(n.id);
    return shouldShow && notDismissed && !n.read;
  });

  const handleDismiss = async () => {
    if (!bannerNotification) return;
    
    const newDismissed = [...dismissedIds, bannerNotification.id];
    setDismissedIds(newDismissed);
    
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
    } catch (e) {
      console.warn("Failed to save dismissed notification");
    }
  };

  const handlePress = () => {
    router.push("/notifications");
  };

  if (!bannerNotification) return null;

  const notifData = bannerNotification.notification || {};
  const type = notifData.type || "info";
  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Pressable style={styles.content} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <IconComponent size={20} color={config.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]} numberOfLines={1}>
            {notifData.title || "Notification"}
          </Text>
          <Text style={styles.body} numberOfLines={1}>
            {notifData.body || ""}
          </Text>
        </View>
      </Pressable>
      <Pressable style={styles.dismissButton} onPress={handleDismiss}>
        <X size={18} color="#666" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: "#666",
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
