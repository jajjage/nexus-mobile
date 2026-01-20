// components/dashboard/RecentTransactions.tsx
// Updated to connect visually with BalanceCard above
import { lightColors } from "@/constants/palette";
import { BlurView } from "expo-blur";
import { ArrowDown, ArrowUp, CreditCard, Wifi } from "lucide-react-native";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  title: string;
  subtitle: string;
  amount: number;
  status: "success" | "pending" | "failed";
  iconType: "wifi" | "arrow-down" | "arrow-up" | "card";
  iconBgColor: string;
  iconColor: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeMore?: () => void;
  isBalanceVisible: boolean;
}

const iconMap = {
  "wifi": Wifi,
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "card": CreditCard,
};

export function RecentTransactions({ transactions, onSeeMore, isBalanceVisible }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "#2E7D32";
      case "pending": return "#F4A261";
      case "failed": return "#E63946";
      default: return "#2E7D32";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "success": return "#E8F5E9";
      case "pending": return "#FFF3E0";
      case "failed": return "#FFEBEE";
      default: return "#E8F5E9";
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Connected Card Container - overlaps with BalanceCard */}
      <View style={styles.connectedCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={onSeeMore}>
            <Text style={styles.seeMoreText}>See More</Text>
          </Pressable>
        </View>

        {/* Transaction List */}
        <View style={styles.transactionsListContainer}>
            <View 
                style={styles.transactionsList}
                pointerEvents={!isBalanceVisible ? "none" : "auto"}
            >
            {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                <CreditCard size={24} color={lightColors.textTertiary} />
                <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
            ) : (
                transactions.map((tx, index) => {
                const IconComponent = iconMap[tx.iconType] || CreditCard;
                return (
                    <View 
                    key={tx.id} 
                    style={[
                        styles.transactionItem,
                        index < transactions.length - 1 && styles.transactionBorder
                    ]}
                    >
                    {/* Icon */}
                    <View style={[styles.txIcon, { backgroundColor: tx.iconBgColor }]}>
                        <IconComponent size={16} color={tx.iconColor} />
                    </View>

                    {/* Details */}
                    <View style={styles.txDetails}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
                    </View>

                    {/* Amount & Status */}
                    <View style={styles.txAmountContainer}>
                        <Text
                        style={[
                            styles.txAmount,
                            { color: tx.type === "credit" ? "#2E7D32" : "#E63946" },
                        ]}
                        >
                        {tx.type === "credit" ? "+" : "-"}₦{formatCurrency(tx.amount)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(tx.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Text>
                        </View>
                    </View>
                    </View>
                );
                })
            )}
            </View>
        </View>

        {/* Blur Overlay - Covering entire card */}
        {!isBalanceVisible && (
            <BlurView 
                intensity={20} 
                style={styles.fullCardBlur} 
                tint="light"
                experimentalBlurMethod="dimezisBlurView" 
            />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    // Negative top margin to overlap with BalanceCard
    marginTop: -4,
    zIndex: 5,
  },
  connectedCard: {
    backgroundColor: "#FFFFFF",
    // Rounded bottom corners only - connects to BalanceCard above
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden', // Ensure blur stays inside rounded corners
  },
  fullCardBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.textPrimary, // #2E2E33
  },
  seeMoreText: {
    fontSize: 13,
    color: lightColors.primary, // #E69E19
    fontWeight: "500",
  },
  transactionsListContainer: {
      position: 'relative',
      overflow: 'hidden', // Ensure blur stays within bounds
      borderRadius: 8,
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: lightColors.textPrimary, // #2E2E33
    marginBottom: 2,
  },
  txSubtitle: {
    fontSize: 12,
    color: lightColors.textSecondary, // #525D60
  },
  txAmountContainer: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: lightColors.textTertiary,
  },
});
