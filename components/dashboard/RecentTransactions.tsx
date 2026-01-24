// components/dashboard/RecentTransactions.tsx
// Updated to connect visually with BalanceCard above
import { useTheme } from "@/context/ThemeContext";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
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
  onTransactionPress?: (transactionId: string) => void;
}

const iconMap = {
  "wifi": Wifi,
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "card": CreditCard,
};

export function RecentTransactions({ transactions, onSeeMore, isBalanceVisible, onTransactionPress }: RecentTransactionsProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleTransactionPress = (transactionId: string) => {
    if (onTransactionPress) {
      onTransactionPress(transactionId);
    } else {
      router.push(`/transaction-detail?id=${transactionId}&from=home`);
    }
  };

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
      case "success": return isDark ? "#1B4332" : "#E8F5E9";
      case "pending": return isDark ? "#3D2800" : "#FFF3E0";
      case "failed": return isDark ? "#4A0E0E" : "#FFEBEE";
      default: return isDark ? "#1B4332" : "#E8F5E9";
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Connected Card Container - overlaps with BalanceCard */}
      <View style={[styles.connectedCard, { backgroundColor: colors.card }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
          <Pressable onPress={onSeeMore}>
            <Text style={[styles.seeMoreText, { color: colors.primary }]}>See More</Text>
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
                <CreditCard size={24} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
                </View>
            ) : (
                transactions.map((tx, index) => {
                const IconComponent = iconMap[tx.iconType] || CreditCard;
                return (
                    <Pressable
                    key={tx.id}
                    onPress={() => handleTransactionPress(tx.id)}
                    style={[
                        styles.transactionItemWrapper,
                        index < transactions.length - 1 && [styles.transactionBorder, { borderBottomColor: colors.border }],
                    ]}
                    >
                    {/* Inner Row Container */}
                    <View style={styles.transactionItem}>
                        {/* Left Side: Icon + Details */}
                        <View style={styles.txLeftSide}>
                            {/* Icon */}
                            <View style={[styles.txIcon, { backgroundColor: tx.iconBgColor }]}>
                                <IconComponent size={16} color={tx.iconColor} />
                            </View>

                            {/* Details */}
                            <View style={styles.txDetails}>
                                <Text style={[styles.txTitle, { color: colors.foreground }]} numberOfLines={1}>{tx.title}</Text>
                                <Text style={[styles.txSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{tx.subtitle}</Text>
                            </View>
                        </View>

                        {/* Right Side: Amount & Status */}
                        <View style={styles.txAmountContainer}>
                            <Text
                            style={[
                                styles.txAmount,
                                { color: tx.type === "credit" ? "#2E7D32" : "#E63946" },
                            ]}
                            numberOfLines={1}
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
                    </Pressable>
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
                tint={isDark ? "dark" : "light"}
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
    marginTop: -4,
    zIndex: 5,
  },
  connectedCard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  fullCardBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  transactionsListContainer: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 8,
  },
  transactionsList: {
    gap: 0,
  },
  transactionItemWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionItemPressed: {
    backgroundColor: "transparent",
  },
  transactionBorder: {
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  txLeftSide: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  txDetails: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  txSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
  txAmountContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
});

