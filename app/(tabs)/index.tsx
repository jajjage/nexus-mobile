import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    BalanceCard,
    DashboardAnnouncementBanner,
    DashboardAnnouncementModal,
    HeaderBar,
    NotificationBanner,
    PromoBanner,
    QuickActions,
    RecentTransactions,
    ResellerBanner,
    UserProfileCard
} from "@/components/dashboard";
import { AddMoneyModal } from "@/components/dashboard/AddMoneyModal";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import {
  useDashboardAnnouncement,
  useMarkAnnouncementViewed,
} from "@/hooks/useDashboardAnnouncement";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useRecentTransactions } from "@/hooks/useWallet";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
    getTransactionSubtitle,
    getTransactionTitle,
    isDataTransaction,
} from "@/lib/transactionUtils";
import { productKeys } from "@/hooks/useProducts";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { InteractionManager, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ANNOUNCEMENT_MODAL_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refetch: refetchUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { isBalanceVisible, toggleBalanceVisibility } = useBalanceVisibility();
  
  // Custom hooks
  const { balance, refetch: refetchBalance } = useWalletBalance();
  const { data: transactions = [], refetch: refetchTransactions } = useRecentTransactions();
  const { count: unreadNotificationCount, refetch: refetchNotifications } = useUnreadNotificationCount();
  const {
    data: dashboardAnnouncement,
    error: dashboardAnnouncementError,
    isFetching: isFetchingAnnouncement,
    refetch: refetchAnnouncement,
  } = useDashboardAnnouncement();
  const markAnnouncementViewed = useMarkAnnouncementViewed();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const userId = user?.userId || "guest";

  // Generate initials from user name
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Use data from getProfile query (API field names)
  const fullName = user?.fullName || "User";
  const userInitials = getInitials(fullName);
  const phoneNumber = user?.phoneNumber || "08000000000";

  const queryClient = useQueryClient();

  // Prefetch data products and categories in background so data screen opens instantly (0ms)
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      void queryClient.prefetchQuery({
        queryKey: productKeys.list({ productType: "data", isActive: true, perPage: 100, limit: 100 }),
        queryFn: () => productService.getProducts({ productType: "data", isActive: true, perPage: 100, limit: 100 }),
        staleTime: 1000 * 60 * 5,
      });
      void queryClient.prefetchQuery({
        queryKey: ["categories", "data"],
        queryFn: () => categoryService.getAll("data"),
        staleTime: 1000 * 60 * 60,
      });
    });
  }, [queryClient]);

  // 1. Auto-show modal once per 24 hours for each announcement
  // Defer modal display until after navigation screen transitions complete to prevent Android dispatchGetDisplayList crashes
  useEffect(() => {
    if (!dashboardAnnouncement || !userId) {
      setIsModalVisible(false);
      return;
    }

    let isMounted = true;
    const checkSchedule = async () => {
      const storageKey = `@announcement-modal:${userId}:${dashboardAnnouncement.id}`;
      const lastShownAt = await AsyncStorage.getItem(storageKey);
      const elapsed = lastShownAt ? Date.now() - Number(lastShownAt) : Infinity;

      if (
        isMounted &&
        (!lastShownAt || Number.isNaN(elapsed) || elapsed >= ANNOUNCEMENT_MODAL_INTERVAL)
      ) {
        InteractionManager.runAfterInteractions(() => {
          if (isMounted) {
            setIsModalVisible(true);
          }
        });
      }
    };

    void checkSchedule();
    return () => {
      isMounted = false;
    };
  }, [dashboardAnnouncement?.id, userId]);

  // 2. Dismiss modal and log timestamp
  const handleDismissModal = useCallback(() => {
    setIsModalVisible(false);
    if (!dashboardAnnouncement || !userId) return;

    const storageKey = `@announcement-modal:${userId}:${dashboardAnnouncement.id}`;
    void AsyncStorage.setItem(storageKey, String(Date.now()));
    markAnnouncementViewed.mutate(dashboardAnnouncement.id);
  }, [dashboardAnnouncement, userId, markAnnouncementViewed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Run all refetches in parallel
      await Promise.all([
        refetchBalance(),
        refetchTransactions(),
        refetchUser(),
        refetchNotifications(),
        refetchAnnouncement(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchBalance,
    refetchTransactions,
    refetchUser,
    refetchNotifications,
    refetchAnnouncement,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : "#EFF1F2" }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[colors.primary]}
                tintColor={colors.primary}
            />
        }
      >
        {/* Header Bar */}
        <HeaderBar
          userInitials={userInitials}
          onGiftPress={() => {}}
          onThemeToggle={() => {}}
          onNotificationsPress={() => router.push('/notifications')}
          notificationCount={unreadNotificationCount}
        />

        {/* Notification Banner (Updates/Important) */}
        <NotificationBanner />

        {/* User Profile or Active Announcement Ticker Banner */}
        {dashboardAnnouncement ? (
          <DashboardAnnouncementBanner
            announcement={dashboardAnnouncement}
            onPress={() => setIsModalVisible(true)}
          />
        ) : (
          <UserProfileCard
            initials={userInitials}
            fullName={fullName}
            phoneNumber={phoneNumber}
          />
        )}

        {/* Balance Card + Transaction History (connected) */}
        <View style={styles.balanceSection}>
          <BalanceCard
            balance={balance}
            onAddMoney={() => setShowAddMoney(true)}
            isBalanceVisible={isBalanceVisible}
            onToggleBalance={toggleBalanceVisibility}
            virtualAccountNumber={user?.virtualAccountNumber || user?.virtualAccounts?.[0]?.accountNumber}
            virtualAccountBankName={user?.virtualAccountBankName || user?.virtualAccounts?.[0]?.bankName || undefined}
            virtualAccountName={user?.virtualAccountAccountName || user?.virtualAccounts?.[0]?.accountName || user?.fullName}
          />
          <RecentTransactions
            transactions={transactions.slice(0, 2).map(tx => {
              const status = tx.related?.status || 'pending';
              const isCredit = tx.direction === 'credit';
              const isData = isDataTransaction(tx);
              
              return {
                id: tx.id,
                type: isCredit ? 'credit' : 'debit',
                title: getTransactionTitle(tx),
                subtitle: getTransactionSubtitle(tx),
                amount: tx.amount,
                status: status.toLowerCase() as 'success' | 'pending' | 'failed',
                iconType: isData ? 'wifi' : isCredit ? 'arrow-up' : 'card',
                iconBgColor: isData ? '#F3E8FF' : isCredit ? '#DCFCE7' : '#FEE2E2',
                iconColor: isData ? '#9333EA' : isCredit ? '#16A34A' : '#DC2626',
              };
            })}
            onSeeMore={() => router.push('/transactions')}
            isBalanceVisible={isBalanceVisible}
          />
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* Promo Banners */}
        <PromoBanner
          variant="savings"
          onPress={() => {}}
        />

        <PromoBanner
          variant="cashback"
          onPress={() => {}}
        />

        {/* Padding handled by contentContainerStyle */}
      </ScrollView>

      {/* Reseller Banner - Fixed at bottom above tab bar (Only for non-resellers) */}
      {user?.role !== 'reseller' && (
        <View style={styles.resellerContainer}>
          <ResellerBanner onPress={() => {}} />
        </View>
      )}

      {/* Add Money Modal */}
      <AddMoneyModal 
        isVisible={showAddMoney} 
        onClose={() => setShowAddMoney(false)} 
      />

      <DashboardAnnouncementModal
        visible={isModalVisible}
        announcement={dashboardAnnouncement || null}
        onDismiss={handleDismissModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Sufficient to clear the fixed banner without extra space
  },
  balanceSection: {
    // No gap between BalanceCard and RecentTransactions
    marginBottom: 8,
  },
  resellerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
