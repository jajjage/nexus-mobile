// app/transactions.tsx
// Full transactions history screen with filters
import { lightColors } from "@/constants/palette";
import { useTransactions } from "@/hooks/useWallet";
import {
    getDisplayStatus,
    getStatusConfig,
    getTransactionSubtitle,
    getTransactionTitle,
    isDataTransaction,
} from "@/lib/transactionUtils";
import { Transaction } from "@/types/wallet.types";
import { useRouter } from "expo-router";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CreditCard,
    Phone,
    Wifi,
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

type FilterType = "all" | "credit" | "debit";

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: transactions = [], isLoading, refetch } = useTransactions();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === "all") return true;
    return tx.direction === activeFilter;
  });

  // Get icon for transaction
  const getTransactionIcon = (tx: Transaction) => {
    const isCredit = tx.direction === "credit";
    const isDebit = tx.direction === "debit";

    if (isDebit && tx.relatedType === "topup_request") {
      if (isDataTransaction(tx)) {
        return { Icon: Wifi, bgColor: "#F3E8FF", color: "#9333EA" }; // purple for data
      }
      return { Icon: Phone, bgColor: "#DBEAFE", color: "#2563EB" }; // blue for airtime
    }

    if (isCredit) {
      return { Icon: ArrowDown, bgColor: "#DCFCE7", color: "#16A34A" }; // green for credit
    }

    return { Icon: ArrowUp, bgColor: "#FEE2E2", color: "#DC2626" }; // red for debit
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isCredit = item.direction === "credit";
    const title = getTransactionTitle(item);
    const subtitle = getTransactionSubtitle(item);
    const displayStatus = getDisplayStatus(item);
    const statusConfig = getStatusConfig(item.related?.status || "pending");
    const { Icon, bgColor, color } = getTransactionIcon(item);
    const dateStr = typeof item.createdAt === 'string' 
      ? item.createdAt 
      : item.createdAt.toISOString();
    
    return (
      <Pressable 
        style={styles.transactionItem}
        onPress={() => router.push(`/transaction-detail?id=${item.id}&from=transactions`)}
      >
        {/* Icon */}
        <View style={[styles.txIcon, { backgroundColor: bgColor }]}>
          <Icon size={18} color={color} />
        </View>

        {/* Details */}
        <View style={styles.txDetails}>
          <Text style={styles.txTitle}>{title}</Text>
          <Text style={styles.txSubtitle}>{subtitle}</Text>
          <Text style={styles.txDate}>{formatDate(dateStr)}</Text>
        </View>

        {/* Amount & Status */}
        <View style={styles.txAmountContainer}>
          <Text
            style={[
              styles.txAmount,
              { color: isCredit ? "#16A34A" : "#DC2626" },
            ]}
          >
            {isCredit ? "+" : "-"}₦{formatCurrency(item.amount)}
          </Text>
          {item.relatedType === "topup_request" && (
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {displayStatus}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <CreditCard size={48} color={lightColors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No transactions</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === "all" 
          ? "Your transaction history will appear here"
          : `No ${activeFilter} transactions found`}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={lightColors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(["all", "credit", "debit"] as FilterType[]).map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredTransactions.length === 0 && styles.listContentEmpty,
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: lightColors.textPrimary,
  },
  placeholder: {
    width: 40,
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
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: lightColors.textPrimary,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  txSubtitle: {
    fontSize: 13,
    color: lightColors.textSecondary,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: lightColors.textTertiary,
  },
  txAmountContainer: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
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
