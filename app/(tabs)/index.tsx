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
import { useAuth } from "@/hooks/useAuth";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useRecentTransactions } from "@/hooks/useWallet";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
    getTransactionSubtitle,
    getTransactionTitle,
    isDataTransaction,
} from "@/lib/transactionUtils";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refetch: refetchUser } = useAuth();
  const { isBalanceVisible, toggleBalanceVisibility } = useBalanceVisibility();
  
  // Custom hooks
  const { balance, refetch: refetchBalance } = useWalletBalance();
  const { data: transactions = [], refetch: refetchTransactions } = useRecentTransactions();
  const { count: unreadNotificationCount, refetch: refetchNotifications } = useUnreadNotificationCount();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);

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
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={['#E69E19']} // Nexus Gold
                tintColor="#E69E19"  // iOS
            />
        }
      >
        {/* Header Bar */}
        <HeaderBar
          userInitials={userInitials}
          onGiftPress={() => console.log("Gift pressed")}
          onThemeToggle={() => console.log("Theme toggle pressed")}
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
          onPress={() => console.log("Savings pressed")}
        />

        <PromoBanner
          variant="cashback"
          onPress={() => console.log("Cashback pressed")}
        />

        {/* Padding handled by contentContainerStyle */}
      </ScrollView>

      {/* Reseller Banner - Fixed at bottom above tab bar (Only for non-resellers) */}
      {user?.role !== 'reseller' && (
        <View style={styles.resellerContainer}>
          <ResellerBanner onPress={() => console.log("Reseller pressed")} />
        </View>
      )}

      {/* Add Money Modal */}
      <AddMoneyModal 
        isVisible={showAddMoney} 
        onClose={() => setShowAddMoney(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF1F2", // Slightly darker than white for contrast
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
