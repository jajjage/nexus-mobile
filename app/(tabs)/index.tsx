// app/(tabs)/index.tsx
// Updated layout to properly connect BalanceCard and RecentTransactions
import {
    BalanceCard,
    HeaderBar,
    NotificationBanner,
    PromoBanner,
    QuickActions,
    RecentTransactions,
    ResellerBanner,
    UserProfileCard
} from "@/components/dashboard";
import { AddMoneyModal } from "@/components/dashboard/AddMoneyModal";
import { DashboardAnnouncementModal } from "@/components/dashboard/DashboardAnnouncementModal";
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
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<string | null>(null);

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
  // const balance is now from the hook

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

  const showAnnouncement =
    !!dashboardAnnouncement &&
    dashboardAnnouncement.id !== dismissedAnnouncementId;

  useEffect(() => {
    console.log("[DEBUG-announcement] dashboard query state", {
      isFetchingAnnouncement,
      hasAnnouncement: !!dashboardAnnouncement,
      announcementId: dashboardAnnouncement?.id,
      title: dashboardAnnouncement?.title,
      dismissedAnnouncementId,
      showAnnouncement,
      error:
        dashboardAnnouncementError instanceof Error
          ? dashboardAnnouncementError.message
          : dashboardAnnouncementError,
    });
  }, [
    dashboardAnnouncement,
    dashboardAnnouncementError,
    dismissedAnnouncementId,
    isFetchingAnnouncement,
    showAnnouncement,
  ]);

  const dismissAnnouncement = () => {
    if (!dashboardAnnouncement) return;
    console.log(
      "[DEBUG-announcement] dismissing announcement",
      dashboardAnnouncement.id
    );
    setDismissedAnnouncementId(dashboardAnnouncement.id);
    markAnnouncementViewed.mutate(dashboardAnnouncement.id);
  };

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

        {/* User Profile with Logo */}
        <UserProfileCard
          initials={userInitials}
          fullName={fullName}
          phoneNumber={phoneNumber}
        />

        {/* Balance Card + Transaction History (connected) */}
        <View style={styles.balanceSection}>
          <BalanceCard
            balance={balance}
            onAddMoney={() => setShowAddMoney(true)}
            isBalanceVisible={isBalanceVisible}
            onToggleBalance={toggleBalanceVisibility}
            virtualAccountNumber={user?.virtualAccountNumber || user?.virtualAccounts?.[0]?.accountNumber}
            virtualAccountBankName={user?.virtualAccountBankName || user?.virtualAccounts?.[0]?.bankName || undefined}
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
        visible={showAnnouncement}
        announcement={dashboardAnnouncement || null}
        onDismiss={dismissAnnouncement}
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
