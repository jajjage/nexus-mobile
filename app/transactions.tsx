// app/transactions.tsx
// Full transactions history screen with filters
import { lightColors } from "@/constants/palette";
import { useTransactions } from "@/hooks/useWallet";
import { useRouter } from "expo-router";
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    CreditCard,
    Wifi
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

const iconMap = {
  "wifi": Wifi,
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "card": CreditCard,
};

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

  // Map transaction to display format
  const mapTransaction = (tx: any) => {
    const status = tx.related?.status || 'pending';
    const productType = tx.related?.type || tx.productCode?.split('-')[0]?.toLowerCase() || '';
    const isCredit = tx.direction === 'credit';
    const isData = productType === 'data';
    
    return {
      id: tx.id,
      type: isCredit ? 'credit' : 'debit',
      title: tx.related?.operatorCode || tx.relatedType?.replace('_', ' ') || 'Transaction',
      subtitle: tx.related?.recipient_phone || tx.reference || '',
      amount: tx.amount,
      status: status.toLowerCase(),
      iconType: isData ? 'wifi' : isCredit ? 'arrow-up' : 'arrow-down',
      iconBgColor: isCredit ? '#E8F5E9' : '#FFEBEE',
      iconColor: isCredit ? '#2E7D32' : '#C62828',
      date: tx.createdAt,
    };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": 
      case "success":
      case "received": return "#2E7D32";
      case "pending": return "#F4A261";
      case "failed":
      case "cancelled": return "#C62828";
      default: return "#666";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
      case "received": return "#E8F5E9";
      case "pending": return "#FFF3E0";
      case "failed":
      case "cancelled": return "#FFEBEE";
      default: return "#F5F5F5";
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const tx = mapTransaction(item);
    const IconComponent = iconMap[tx.iconType as keyof typeof iconMap] || CreditCard;
    
    return (
      <Pressable 
        style={styles.transactionItem}
        onPress={() => console.log("Transaction detail:", tx.id)}
      >
        {/* Icon */}
        <View style={[styles.txIcon, { backgroundColor: tx.iconBgColor }]}>
          <IconComponent size={18} color={tx.iconColor} />
        </View>

        {/* Details */}
        <View style={styles.txDetails}>
          <Text style={styles.txTitle}>{tx.title}</Text>
          <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
          <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
        </View>

        {/* Amount & Status */}
        <View style={styles.txAmountContainer}>
          <Text
            style={[
              styles.txAmount,
              { color: tx.type === "credit" ? "#2E7D32" : "#C62828" },
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
