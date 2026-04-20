import { useTheme } from "@/context/ThemeContext";
import { useAgentCustomers } from "@/hooks/useAgent";
import { AgentCustomer } from "@/types/agent.types";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  Search,
  Users,
} from "lucide-react-native";
import React, { useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomerFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 20;

export default function AgentCustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const deferredSearchQuery = useDeferredValue(debouncedSearchQuery);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearchQuery, filter]);

  const { data, isLoading, refetch, isFetching } = useAgentCustomers({
    page,
    limit: PAGE_SIZE,
    q: deferredSearchQuery,
    isActive:
      filter === "all" ? undefined : filter === "active",
  });

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const formatJoinedDate = (value?: string) => {
    if (!value) return "Join date unavailable";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Join date unavailable";

    return parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderCustomer = ({ item }: { item: AgentCustomer }) => (
    <View
      style={[
        styles.customerCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerIdentity}>
          <Text style={[styles.customerName, { color: colors.foreground }]}>
            {item.customer?.fullName || item.fullName || item.customer?.email || item.email || "Customer"}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  (item.isActive === false ? "#ef4444" : "#22c55e") + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.isActive === false ? "#ef4444" : "#22c55e" },
              ]}
            >
              {item.isActive === false ? "Inactive link" : "Active link"}
            </Text>
          </View>
        </View>
        <Text style={[styles.codeText, { color: colors.primary }]}>
          {item.agentCodeUsed || "No code"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Mail size={14} color={colors.textSecondary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.customer?.email || item.email || "No email available"}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Phone size={14} color={colors.textSecondary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.customer?.phoneNumber || item.phoneNumber || "No phone number"}
        </Text>
      </View>

      <View style={styles.metaFooter}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Joined {formatJoinedDate(item.joinedAt)}
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {item.isVerified ? "Verified" : "Unverified"}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Agent Customers",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={customers}
          keyExtractor={(item) => item.linkId || item.customerId}
          renderItem={renderCustomer}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" },
                ]}
              >
                <Users size={20} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                  Customer Directory
                </Text>
                <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                  Search by name, email, or phone and review active or inactive customer links.
                </Text>
              </View>

              <View
                style={[
                  styles.searchContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Search size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Search customers"
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.filterRow}>
                {(["all", "active", "inactive"] as CustomerFilter[]).map((option) => {
                  const isSelected = filter === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFilter(option)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isSelected ? "#fff" : colors.foreground },
                        ]}
                      >
                        {option === "all"
                          ? "All"
                          : option === "active"
                            ? "Active"
                            : "Inactive"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
                  No customers found
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try a different search term or switch the active filter.
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
  backButton: {
    marginLeft: 8,
  },
  headerContent: {
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
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
  customerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  customerIdentity: {
    flex: 1,
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  codeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
  },
  metaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  footerText: {
    fontSize: 12,
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
