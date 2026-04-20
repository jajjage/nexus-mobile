import {
  BankWithdrawalProgressTrack,
  getBankWithdrawalStatusLabel,
  getBankWithdrawalStatusMessage,
} from "@/components/agent/BankWithdrawalStatus";
import { useTheme } from "@/context/ThemeContext";
import { useAgentBankWithdrawals } from "@/hooks/useAgent";
import { BankWithdrawalHistoryItem } from "@/types/agent.types";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Building2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StatusFilter = "all" | "pending" | "processing" | "success" | "failed";

export default function AgentBankWithdrawalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const { data: overviewData, refetch: refetchOverview } = useAgentBankWithdrawals({
    page: 1,
    limit: 10,
  });
  const { data: pendingOverview, refetch: refetchPendingOverview } = useAgentBankWithdrawals({
    page: 1,
    limit: 1,
    status: "pending",
  });
  const { data: processingOverview, refetch: refetchProcessingOverview } = useAgentBankWithdrawals({
    page: 1,
    limit: 1,
    status: "processing",
  });

  const { data, isLoading, refetch, isFetching } = useAgentBankWithdrawals({
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
  });

  const requests = data?.data ?? [];
  const pagination = data?.pagination;
  const overviewRequests = [...(overviewData?.data ?? [])].sort((left, right) => {
    const leftTime = new Date(left.requestedAt).getTime() || 0;
    const rightTime = new Date(right.requestedAt).getTime() || 0;
    return rightTime - leftTime;
  });
  const activeRequest = overviewRequests.find(
    (item) => item.status === "pending" || item.status === "processing"
  );
  const pendingCount = pendingOverview?.pagination?.total ?? 0;
  const processingCount = processingOverview?.pagination?.total ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchOverview(),
        refetchPendingOverview(),
        refetchProcessingOverview(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (value: BankWithdrawalHistoryItem["status"]) => {
    switch (value) {
      case "success":
        return "#22c55e";
      case "processing":
        return "#2563eb";
      case "failed":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Date unavailable";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Date unavailable";
    return parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const maskAccountNumber = (value: string) => {
    if (!value) return "No account number";
    if (value.length <= 4) return value;
    return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
  };

  const renderItem = ({ item }: { item: BankWithdrawalHistoryItem }) => (
    <View
      style={[
        styles.requestCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestHeaderMain}>
          <Text style={[styles.requestAmount, { color: colors.foreground }]}>
            ₦{item.amount.toLocaleString()}
          </Text>
          <Text style={[styles.requestBank, { color: colors.textSecondary }]}>
            {item.bankName} • {maskAccountNumber(item.accountNumber)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.statusMessage,
          { color: item.status === "failed" ? "#ef4444" : colors.textSecondary },
        ]}
      >
        {getBankWithdrawalStatusMessage(item.status)}
      </Text>

      <BankWithdrawalProgressTrack status={item.status} />

      <View style={styles.requestMeta}>
        <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
          Account: {item.accountName}
        </Text>
        <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
          Requested: {formatDate(item.requestedAt)}
        </Text>
        {item.processedAt ? (
          <Text
            style={[styles.requestMetaText, { color: colors.textSecondary }]}
          >
            Processed: {formatDate(item.processedAt)}
          </Text>
        ) : null}
        {item.narration ? (
          <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
            Narration: {item.narration}
          </Text>
        ) : null}
        {item.requestNotes ? (
          <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
            Note: {item.requestNotes}
          </Text>
        ) : null}
        {item.adminNotes ? (
          <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
            Admin note: {item.adminNotes}
          </Text>
        ) : null}
        {item.failureReason ? (
          <Text style={[styles.failureText]}>
            Failure reason: {item.failureReason}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Bank Withdrawal History",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ArrowLeft size={22} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" },
                ]}
              >
                <Building2 size={20} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                  Bank Withdrawal Requests
                </Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                  Track submitted payout requests and monitor their review status.
                </Text>
              </View>
              <View
                style={[
                  styles.processCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.processTitle, { color: colors.foreground }]}>
                  {activeRequest ? "Current Withdrawal Status" : "How It Works"}
                </Text>
                <Text style={[styles.processBody, { color: colors.textSecondary }]}>
                  {activeRequest
                    ? `${getBankWithdrawalStatusLabel(activeRequest.status)} for your ₦${activeRequest.amount.toLocaleString()} request to ${activeRequest.bankName}.`
                    : "After you submit a bank withdrawal request, we will show each stage here so you can track review, processing, and final payout."}
                </Text>
                {activeRequest ? (
                  <>
                    <Text
                      style={[styles.processMeta, { color: colors.textSecondary }]}
                    >
                      Requested on {formatDate(activeRequest.requestedAt)}
                    </Text>
                    <Text
                      style={[
                        styles.processHint,
                        {
                          color:
                            activeRequest.status === "failed"
                              ? "#ef4444"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {getBankWithdrawalStatusMessage(activeRequest.status)}
                    </Text>
                    <BankWithdrawalProgressTrack status={activeRequest.status} />
                  </>
                ) : null}
                <View style={styles.processStatsRow}>
                  <View
                    style={[
                      styles.processStatChip,
                      {
                        backgroundColor: colors.primary + "10",
                        borderColor: colors.primary + "30",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.processStatValue, { color: colors.foreground }]}
                    >
                      {pendingCount}
                    </Text>
                    <Text
                      style={[
                        styles.processStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Pending
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.processStatChip,
                      {
                        backgroundColor: colors.primary + "10",
                        borderColor: colors.primary + "30",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.processStatValue, { color: colors.foreground }]}
                    >
                      {processingCount}
                    </Text>
                    <Text
                      style={[
                        styles.processStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Processing
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.filterRow}>
                {(["all", "pending", "processing", "success", "failed"] as StatusFilter[]).map(
                  (option) => {
                    const selected = status === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: selected ? colors.primary : colors.card,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setStatus(option);
                          setPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: selected ? "#fff" : colors.foreground },
                          ]}
                        >
                          {option === "all"
                            ? "All"
                            : option.charAt(0).toUpperCase() + option.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoading || isFetching ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No bank withdrawals yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Submitted bank transfer requests will appear here.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  <Text style={{ color: page <= 1 ? colors.textSecondary : colors.foreground }}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
                  Page {page} of {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={() =>
                    setPage((current) => Math.min(pagination.totalPages, current + 1))
                  }
                  disabled={page >= pagination.totalPages}
                >
                  <Text
                    style={{
                      color:
                        page >= pagination.totalPages
                          ? colors.textSecondary
                          : colors.foreground,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  processCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  processBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  processMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  processHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  processStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  processStatChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  processStatValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  processStatLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  requestHeaderMain: {
    flex: 1,
    gap: 4,
  },
  requestAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  requestBank: {
    fontSize: 13,
  },
  requestMeta: {
    gap: 6,
  },
  statusMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  requestMetaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  failureText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#ef4444",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  paginationButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
