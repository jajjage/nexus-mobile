// app/(tabs)/index.tsx
// Updated layout to properly connect BalanceCard and RecentTransactions
import {
  BalanceCard,
  HeaderBar,
  PromoBanner,
  QuickActions,
  RecentTransactions,
  ResellerBanner,
  UserProfileCard,
} from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useBalanceVisibility } from "@/hooks/useBalanceVisibility";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Mock transactions for demo
const mockTransactions = [
  {
    id: "1",
    type: "debit" as const,
    title: "1GB MTN Weekly Gifting",
    subtitle: "to MTN (07065653439)",
    amount: 500,
    status: "success" as const,
    iconType: "wifi" as const,
    iconBgColor: "#F3E5F5", // Light purple
    iconColor: "#9C27B0",   // Purple
  },
  {
    id: "2",
    type: "credit" as const,
    title: "Incoming Payment",
    subtitle: "Wallet top-up",
    amount: 500,
    status: "success" as const,
    iconType: "arrow-down" as const,
    iconBgColor: "#E8F5E9", // Light green
    iconColor: "#2E7D32",   // Green
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isBalanceVisible, toggleBalanceVisibility } = useBalanceVisibility();

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
  const balance = parseFloat(user?.balance?.toString() || "0");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Bar */}
        <HeaderBar
          userInitials={userInitials}
          onGiftPress={() => console.log("Gift pressed")}
          onThemeToggle={() => console.log("Theme toggle pressed")}
          onNotificationsPress={() => console.log("Notifications pressed")}
        />

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
            onAddMoney={() => console.log("Add money pressed")}
            isBalanceVisible={isBalanceVisible}
            onToggleBalance={toggleBalanceVisibility}
          />
          <RecentTransactions
            transactions={mockTransactions}
            onSeeMore={() => console.log("See more transactions")}
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

        {/* Spacer for bottom content */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reseller Banner - Fixed at bottom above tab bar */}
      <View style={styles.resellerContainer}>
        <ResellerBanner onPress={() => console.log("Reseller pressed")} />
      </View>
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
    paddingBottom: 60,
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
