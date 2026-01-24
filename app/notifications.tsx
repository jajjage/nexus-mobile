// app/notifications.tsx
// Full notifications screen with tabs and actions
import { lightColors } from "@/constants";
import { useTheme } from "@/context/ThemeContext";
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications
} from "@/hooks/useNotifications";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle,
  Info,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | "unread";

// Icon and color mapping based on notification type
const typeConfig = {
  info: { icon: Info, color: "#1976D2", bgColor: "#E3F2FD" },
  success: { icon: CheckCircle, color: "#2E7D32", bgColor: "#E8F5E9" },
  warning: { icon: AlertTriangle, color: "#F57C00", bgColor: "#FFF3E0" },
  error: { icon: AlertCircle, color: "#C62828", bgColor: "#FFEBEE" },
  alert: { icon: AlertCircle, color: "#C62828", bgColor: "#FFEBEE" },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data, isLoading, refetch } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Robustly handle different API response structures
  let notifications: any[] = [];
  if (data?.data?.notifications && Array.isArray(data.data.notifications)) {
    notifications = data.data.notifications;
  } else if (data?.data && Array.isArray(data.data)) {
    notifications = data.data;
  } else if (Array.isArray(data)) {
    notifications = data as any[];
  }

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter notifications
  const filteredNotifications = notifications.filter((n: any) => {
    if (activeFilter === "unread") return !n.read;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  };

  const renderNotification = ({ item }: { item: any }) => {
    const notifData = item.notification || {};
    const type = notifData.type || "info";
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;
    const IconComponent = config.icon;
    
    return (
      <Pressable 
        style={[
          styles.notificationItem,
          { backgroundColor: colors.card, shadowColor: isDark ? "#000" : "#000" },
          !item.read && { backgroundColor: isDark ? `${colors.primary}10` : "#E3F2FD" },
        ]}
        onPress={() => !item.read && handleMarkAsRead(item.id)}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <IconComponent size={20} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {notifData.title || "Notification"}
            </Text>
            {!item.read && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            )}
          </View>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {notifData.body || ""}
          </Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!item.read && (
            <Pressable 
              style={[styles.actionButton, { backgroundColor: isDark ? colors.background : "#F5F5F5" }]}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <Check size={18} color="#2E7D32" />
            </Pressable>
          )}
          <Pressable 
            style={[styles.actionButton, { backgroundColor: isDark ? colors.background : "#F5F5F5" }]}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={18} color="#C62828" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.card : "#F5F5F5" }]}>
        <Bell size={48} color={isDark ? colors.textSecondary : "#9CA3AF"} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>You're all caught up!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {activeFilter === "unread" 
          ? "No unread notifications"
          : "No notifications yet"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
        {(["all", "unread"] as FilterType[]).map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterTab,
              { backgroundColor: isDark ? colors.background : "#F5F5F5" },
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter === "all" ? "All" : `Unread (${unreadCount})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E69E19"]}
            tintColor="#E69E19"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: lightColors.textPrimary,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E69E19",
  },
  placeholder: {
    width: 80,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  filterTabActive: {
    backgroundColor: "#E69E19",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: lightColors.textSecondary,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationUnread: {
    backgroundColor: "#E3F2FD",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: lightColors.textPrimary,
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#E69E19",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  body: {
    fontSize: 13,
    color: lightColors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: lightColors.textTertiary,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: lightColors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: "center",
  },
});
