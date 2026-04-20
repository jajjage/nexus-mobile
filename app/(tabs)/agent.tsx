// app/(tabs)/agent.tsx
import {
    BankWithdrawalProgressTrack,
    getBankWithdrawalStatusLabel,
    getBankWithdrawalStatusMessage,
} from "@/components/agent/BankWithdrawalStatus";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import {
    useAgentBankWithdrawals,
    useActivateAgent,
    useAgentAccount,
    useAgentCommissions,
    useAgentCustomers,
    useAgentStats,
    useAvailableAgentBalance,
    useRequestBankWithdrawal,
    useRegenerateAgentCode,
    useWithdrawToWallet,
} from "@/hooks/useAgent";
import {
    AgentCommission,
    AgentCustomer,
    BankWithdrawalHistoryItem,
    BankWithdrawalRequest,
} from "@/types/agent.types";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
    ArrowRight,
    Banknote,
    Building2,
    Briefcase,
    Copy,
    RefreshCw,
    Share2,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// ==================== Main Screen ====================

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data: account, refetch: refetchAccount, isLoading: isLoadingAccount } = useAgentAccount();
  const { refetch: refetchStats } = useAgentStats();
  const { refetch: refetchBalance } = useAvailableAgentBalance();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAccount(), refetchStats(), refetchBalance()]);
    } finally {
      setRefreshing(false);
    }
  };

  const scrollStyle = [
    styles.container,
    { backgroundColor: colors.background },
  ];

  const contentContainerStyle = [
    styles.scrollContent,
    {
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 20,
    },
  ];

  return (
    <ScrollView
      style={scrollStyle}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Briefcase size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Agent Dashboard
        </Text>
      </View>

      {isLoadingAccount ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : account ? (
        <>
          {/* Agent Active - Show Dashboard */}
          <AgentDashboardContent account={account} />
        </>
      ) : (
        <>
          {/* Agent Inactive - Show CTA */}
          <BecomeAgentSection />
        </>
      )}
    </ScrollView>
  );
}

// ==================== Become Agent Section ====================

function BecomeAgentSection() {
  const { colors } = useTheme();
  const { mutate: activate, isPending } = useActivateAgent();

  return (
    <View style={[styles.section, styles.becomeAgentSection]}>
      <View style={[styles.ctaCard, { backgroundColor: colors.primary + "15" }]}>
        <Briefcase size={32} color={colors.primary} style={{ marginBottom: 12 }} />
        <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
          Become an Agent
        </Text>
        <Text style={[styles.ctaSubtitle, { color: colors.textSecondary }]}>
          Start earning commissions by referring customers to Nexus Data. Get your unique agent code and start sharing!
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={() => activate()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaButtonText}>Activate Agent Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== Dashboard Content ====================

function AgentDashboardContent({ account }: { account: any }) {
  return (
    <View style={styles.content}>
      {/* Agent Code Section */}
      <AgentCodeSection agentCode={account.agentCode} />

      {/* Stats Cards */}
      <AgentStatsCards />

      {/* Available Balance & Withdrawal */}
      <WithdrawalSection />

      {/* Commissions List */}
      <CommissionsSection />

      {/* Customers List */}
      <CustomersSection />
    </View>
  );
}

// ==================== Agent Code Section ====================

function AgentCodeSection({ agentCode }: { agentCode: string }) {
  const { colors, isDark } = useTheme();
  const [isCopied, setIsCopied] = useState(false);
  const { mutate: regenerate, isPending: isRegenerating } =
    useRegenerateAgentCode();

  const handleCopy = async () => {
    if (!agentCode) return;
    await Clipboard.setStringAsync(agentCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Agent code copied to clipboard");
  };

  const handleShare = async () => {
    try {
      const inviteLink = `https://nexusdata.app/signup?agentCode=${agentCode}`;
      await Share.share({
        message: `Join Nexus Data using my agent code: ${agentCode}\n\n${inviteLink}`,
        url: inviteLink,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      "Regenerate Agent Code?",
      "This will invalidate your current code. Any old invite links will no longer work.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: () => regenerate(),
        },
      ]
    );
  };

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  return (
    <View style={[styles.section, { paddingHorizontal: 16 }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Your Agent Code
      </Text>
      <View style={cardStyle}>
        {/* Code Input */}
        <View
          style={[
            styles.codeInputContainer,
            { backgroundColor: isDark ? colors.background : "#F3F4F6" },
          ]}
        >
          <TextInput
            style={[styles.codeInput, { color: colors.foreground }]}
            value={agentCode}
            editable={false}
          />
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>Code</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.codeActions}>
          <TouchableOpacity
            style={[styles.codeButton, { borderColor: colors.border }]}
            onPress={handleCopy}
            disabled={isCopied}
          >
            <Copy size={16} color={colors.foreground} />
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {isCopied ? "Copied" : "Copy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareCodeButton, { backgroundColor: colors.primary }]}
            onPress={handleShare}
          >
            <Share2 size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "600" }}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.codeButton, { borderColor: colors.border }]}
            onPress={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <>
                <RefreshCw size={16} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  Regenerate
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ==================== Stats Cards ====================

function AgentStatsCards() {
  const { data: stats, isLoading } = useAgentStats();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={100} style={styles.statCard} />
          ))}
        </View>
      </View>
    );
  }

  if (!stats) return null;

  const cardStyle = [
    styles.statCard,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];
  const titleStyle = [styles.statTitle, { color: colors.textSecondary }];
  const valueStyle = [styles.statValue, { color: colors.foreground }];

  return (
    <View style={[styles.section, { paddingHorizontal: 16 }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Performance Overview
      </Text>
      <View style={styles.statsGrid}>
        {/* Total Customers */}
        <View style={cardStyle}>
          <View style={styles.statHeader}>
            <Text style={titleStyle}>Customers</Text>
            <Users size={16} color={colors.textSecondary} />
          </View>
          <Text style={valueStyle}>{stats?.totalCustomers ?? 0}</Text>
        </View>

        {/* Total Commissions */}
        <View style={cardStyle}>
          <View style={styles.statHeader}>
            <Text style={titleStyle}>Total Earned</Text>
            <TrendingUp size={16} color={colors.textSecondary} />
          </View>
          <Text style={valueStyle}>
            ₦{(stats?.lifetimeEarnings ?? 0).toLocaleString()}
          </Text>
        </View>

        {/* Monthly Earnings */}
        <View style={cardStyle}>
          <View style={styles.statHeader}>
            <Text style={titleStyle}>This Month</Text>
            <Banknote size={16} color={colors.textSecondary} />
          </View>
          <Text style={valueStyle}>
            ₦{(stats?.monthlyEarnings ?? 0).toLocaleString()}
          </Text>
        </View>

        {/* Pending */}
        <View style={cardStyle}>
          <View style={styles.statHeader}>
            <Text style={titleStyle}>Pending</Text>
            <Wallet size={16} color={colors.textSecondary} />
          </View>
          <Text style={[valueStyle, { color: "#d97706" }]}>
            ₦{(stats?.pendingCommissions ?? 0).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ==================== Withdrawal Section ====================

function WithdrawalSection() {
  const router = useRouter();
  const { data: balance, isLoading } = useAvailableAgentBalance();
  const { data: pendingRequests } = useAgentBankWithdrawals({
    page: 1,
    limit: 100,
    status: "pending",
  });
  const { data: processingRequests } = useAgentBankWithdrawals({
    page: 1,
    limit: 100,
    status: "processing",
  });
  const { mutate: withdrawToWallet, isPending: isPendingWalletWithdrawal } =
    useWithdrawToWallet();
  const {
    mutate: requestBankWithdrawal,
    isPending: isPendingBankWithdrawal,
  } = useRequestBankWithdrawal();
  const { colors } = useTheme();
  const [activeModal, setActiveModal] = useState<
    null | "method" | "wallet" | "bank"
  >(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankCode: "",
    accountName: "",
    accountNumber: "",
    narration: "",
    requestNotes: "",
  });

  if (isLoading || !balance) return null;

  const maxAmount = balance?.totalAvailable ?? 0;
  const pendingBankRequests = (pendingRequests?.data ?? []).filter(
    (item) => item.status === "pending"
  );
  const processingBankRequests = (processingRequests?.data ?? []).filter(
    (item) => item.status === "processing"
  );
  const activeBankRequests = [
    ...pendingBankRequests,
    ...processingBankRequests,
  ].sort(
    (left, right) => {
      const leftTime = new Date(left.requestedAt).getTime() || 0;
      const rightTime = new Date(right.requestedAt).getTime() || 0;
      return rightTime - leftTime;
    }
  );
  const pendingBankRequestsCount = pendingBankRequests.length;
  const processingBankRequestsCount = processingBankRequests.length;
  const activeBankRequestsCount = activeBankRequests.length;
  const activeBankRequest = activeBankRequests[0];
  const reservedActiveAmount = activeBankRequests.reduce(
    (total, item) => total + item.amount,
    0
  );
  const withdrawableBalance = Math.max(0, maxAmount - reservedActiveAmount);
  const isSubmitting =
    isPendingWalletWithdrawal || isPendingBankWithdrawal;

  const getBankStatusColor = (status: BankWithdrawalHistoryItem["status"]) => {
    switch (status) {
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

  const formatRequestedDate = (value?: string | null) => {
    if (!value) return "Date unavailable";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Date unavailable";
    return parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const setMaxWithdrawalAmount = () => {
    onAmountChangeSafe(withdrawableBalance.toString());
  };

  const onAmountChangeSafe = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    const normalized =
      parts.length <= 2 ? sanitized : `${parts[0]}.${parts.slice(1).join("")}`;
    setWithdrawalAmount(normalized);
  };

  const handleWalletWithdraw = () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > withdrawableBalance) {
      toast.error(
        reservedActiveAmount > 0
          ? "Part of your balance is tied to an active withdrawal request"
          : "Insufficient balance"
      );
      return;
    }

    withdrawToWallet(
      {
        method: "wallet",
        amount,
      },
      {
        onSuccess: () => {
          setWithdrawalAmount("");
          setActiveModal(null);
        },
      }
    );
  };

  const handleBankFormChange = (
    field: keyof typeof bankForm,
    value: string
  ) => {
    if (field === "accountNumber") {
      setBankForm((current) => ({
        ...current,
        [field]: value.replace(/\s+/g, "").replace(/[^0-9]/g, ""),
      }));
      return;
    }

    setBankForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleBankWithdraw = () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > withdrawableBalance) {
      toast.error(
        reservedActiveAmount > 0
          ? "Part of your balance is tied to an active withdrawal request"
          : "Insufficient balance"
      );
      return;
    }

    const payload: BankWithdrawalRequest = {
      method: "bank",
      amount,
      bankName: bankForm.bankName.trim(),
      bankCode: bankForm.bankCode.trim() || undefined,
      accountName: bankForm.accountName.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      narration: bankForm.narration.trim() || undefined,
      requestNotes: bankForm.requestNotes.trim() || undefined,
    };

    if (!payload.bankName) {
      toast.error("Bank name is required");
      return;
    }
    if (!payload.accountName) {
      toast.error("Account name is required");
      return;
    }
    if (!payload.accountNumber) {
      toast.error("Account number is required");
      return;
    }

    requestBankWithdrawal(payload, {
      onSuccess: () => {
        setWithdrawalAmount("");
        setBankForm({
          bankName: "",
          bankCode: "",
          accountName: "",
          accountNumber: "",
          narration: "",
          requestNotes: "",
        });
        setActiveModal(null);
      },
    });
  };

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.primary + "15" },
  ];

  return (
    <View style={[styles.section, { paddingHorizontal: 16 }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Available for Withdrawal
      </Text>
      <View style={cardStyle}>
        <View style={styles.balanceDisplay}>
          <Wallet size={32} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Available Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.primary }]}>
              ₦{maxAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        {reservedActiveAmount > 0 ? (
          <View
            style={[
              styles.withdrawalAvailabilityCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.withdrawalAvailabilityRow}>
              <Text
                style={[
                  styles.withdrawalAvailabilityLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Available to withdraw now
              </Text>
              <Text
                style={[
                  styles.withdrawalAvailabilityValue,
                  { color: colors.foreground },
                ]}
              >
                ₦{withdrawableBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.withdrawalAvailabilityRow}>
              <Text
                style={[
                  styles.withdrawalAvailabilityLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Reserved by active requests
              </Text>
              <Text
                style={[
                  styles.withdrawalAvailabilityValue,
                  { color: "#d97706" },
                ]}
              >
                ₦{reservedActiveAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        ) : null}
        {activeBankRequestsCount > 0 ? (
          <View
            style={[
              styles.pendingInfoBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.pendingInfoTextBlock}>
              <Text
                style={[styles.pendingInfoTitle, { color: colors.foreground }]}
              >
                {activeBankRequestsCount} active withdrawal request
                {activeBankRequestsCount > 1 ? "s" : ""}
              </Text>
              <Text
                style={[
                  styles.pendingInfoSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {withdrawableBalance > 0
                  ? `₦${reservedActiveAmount.toLocaleString()} is already tied to request${activeBankRequestsCount > 1 ? "s" : ""} in progress. You can only withdraw the remaining balance for now.`
                  : `₦${reservedActiveAmount.toLocaleString()} is tied to request${activeBankRequestsCount > 1 ? "s" : ""} in progress. New withdrawals will unlock once ${activeBankRequestsCount > 1 ? "they are" : "it is"} resolved.`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/agent-bank-withdrawals")}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                Track
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {activeBankRequest ? (
          <View
            style={[
              styles.withdrawalStatusCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.withdrawalStatusHeader}>
              <View style={styles.withdrawalStatusInfo}>
                <Text
                  style={[styles.withdrawalStatusTitle, { color: colors.foreground }]}
                >
                  Withdrawal In Progress
                </Text>
                <Text
                  style={[
                    styles.withdrawalStatusMeta,
                    { color: colors.textSecondary },
                  ]}
                >
                  ₦{activeBankRequest.amount.toLocaleString()} to{" "}
                  {activeBankRequest.bankName}
                </Text>
                <Text
                  style={[
                    styles.withdrawalStatusMeta,
                    { color: colors.textSecondary },
                  ]}
                >
                  Submitted {formatRequestedDate(activeBankRequest.requestedAt)}
                </Text>
              </View>
              <View
                style={[
                  styles.withdrawalStatusBadge,
                  {
                    backgroundColor:
                      getBankStatusColor(activeBankRequest.status) + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.withdrawalStatusBadgeText,
                    { color: getBankStatusColor(activeBankRequest.status) },
                  ]}
                >
                  {getBankWithdrawalStatusLabel(activeBankRequest.status)}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.withdrawalStatusMessage,
                {
                  color:
                    activeBankRequest.status === "failed"
                      ? "#ef4444"
                      : colors.textSecondary,
                },
              ]}
            >
              {getBankWithdrawalStatusMessage(activeBankRequest.status)}
            </Text>

            <BankWithdrawalProgressTrack status={activeBankRequest.status} />

            <TouchableOpacity
              style={[
                styles.withdrawalStatusLink,
                { borderColor: colors.border },
              ]}
              onPress={() => router.push("/agent-bank-withdrawals")}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                View Bank Withdrawal History
              </Text>
              <ArrowRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.withdrawButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setMaxWithdrawalAmount();
            setActiveModal("method");
          }}
          disabled={withdrawableBalance === 0}
        >
          <Text style={styles.withdrawButtonText}>
            Withdraw {withdrawableBalance === 0 ? "(Locked By Active Request)" : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.withdrawHistoryButton,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
          onPress={() => router.push("/agent-bank-withdrawals")}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            View Bank Withdrawal History
          </Text>
        </TouchableOpacity>
      </View>

      <WithdrawMethodModal
        visible={activeModal === "method"}
        maxAmount={withdrawableBalance}
        activeBankRequestsCount={activeBankRequestsCount}
        reservedAmount={reservedActiveAmount}
        onWalletPress={() => setActiveModal("wallet")}
        onBankPress={() => setActiveModal("bank")}
        onHistoryPress={() => {
          setActiveModal(null);
          router.push("/agent-bank-withdrawals");
        }}
        onClose={() => setActiveModal(null)}
      />
      <WalletWithdrawalModal
        visible={activeModal === "wallet"}
        maxAmount={withdrawableBalance}
        amount={withdrawalAmount}
        onAmountChange={onAmountChangeSafe}
        onUseMax={setMaxWithdrawalAmount}
        onWithdraw={handleWalletWithdraw}
        isLoading={isSubmitting}
        onClose={() => {
          setActiveModal(null);
        }}
      />
      <BankWithdrawalModal
        visible={activeModal === "bank"}
        maxAmount={withdrawableBalance}
        amount={withdrawalAmount}
        form={bankForm}
        onAmountChange={onAmountChangeSafe}
        onUseMax={setMaxWithdrawalAmount}
        onFormChange={handleBankFormChange}
        onWithdraw={handleBankWithdraw}
        isLoading={isSubmitting}
        onClose={() => {
          setActiveModal(null);
        }}
      />
    </View>
  );
}

// ==================== Commissions Section ====================

function CommissionsSection() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useAgentCommissions(page, 10);
  const { colors } = useTheme();

  const commissions = response?.data ?? [];
  const pagination = response?.pagination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#22c55e";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const renderItem = ({ item }: { item: AgentCommission }) => (
    <View style={[styles.listRow, { borderBottomColor: colors.border }]}>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: colors.foreground }]}>
          {item.customerName || item.customerId}
        </Text>
        <Text style={styles.listEmail}>{item.customerEmail}</Text>
      </View>
      <View style={styles.listMeta}>
        <Text style={[styles.listAmount, { color: colors.foreground }]}>
          ₦{item.amount.toLocaleString()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  if (commissions.length === 0 && !isLoading) {
    return (
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent Commissions
        </Text>
        <View style={cardStyle}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No commissions yet. Share your agent code to start earning!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { paddingHorizontal: 16 }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Recent Commissions
      </Text>
      <View style={cardStyle}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={commissions}
            keyExtractor={(item) => item.commissionId}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <Text style={{ color: colors.foreground }}>Previous</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textSecondary }}>
              Page {page} of {pagination.totalPages}
            </Text>
            <TouchableOpacity
              onPress={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
            >
              <Text style={{ color: colors.foreground }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ==================== Customers Section ====================

function CustomersSection() {
  const router = useRouter();
  const { data: response, isLoading } = useAgentCustomers({
    page: 1,
    limit: 5,
    isActive: true,
  });
  const { colors } = useTheme();

  const customers = response?.data ?? [];

  const getLinkStatusColor = (isActive?: boolean) =>
    isActive === false ? "#ef4444" : "#22c55e";

  const formatJoinedDate = (value?: string) => {
    if (!value) return "Join date unavailable";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Join date unavailable";

    return `Joined ${parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const renderItem = ({ item }: { item: AgentCustomer }) => (
    <View style={[styles.listRow, { borderBottomColor: colors.border }]}>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: colors.foreground }]}>
          {item.customer?.fullName || item.fullName || item.customer?.email || item.email || "Customer"}
        </Text>
        <Text style={styles.listEmail}>
          {item.customer?.email || item.email || "No email available"}
        </Text>
        <Text style={styles.listSubtext}>
          {item.customer?.phoneNumber || item.phoneNumber || "No phone number"}
        </Text>
        <Text style={styles.listSubtext}>
          {formatJoinedDate(item.joinedAt)}
        </Text>
      </View>
      <View style={styles.listMeta}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getLinkStatusColor(item.isActive) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getLinkStatusColor(item.isActive) },
            ]}
          >
            {item.isActive === false ? "Inactive" : "Active"}
          </Text>
        </View>
        <Text style={styles.listSubtext}>
          {item.agentCodeUsed || "No code"}
        </Text>
      </View>
    </View>
  );

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.card, borderColor: colors.border },
  ];

  if (customers.length === 0 && !isLoading) {
    return (
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        <SectionHeader
          title="Recent Active Customers"
          actionLabel="View all"
          onPress={() => router.push("/agent-customers")}
        />
        <View style={cardStyle}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No customers yet. Share your agent code to acquire customers!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { paddingHorizontal: 16 }]}>
      <SectionHeader
        title="Recent Active Customers"
        actionLabel="View all"
        onPress={() => router.push("/agent-customers")}
      />
      <View style={cardStyle}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.linkId || item.customerId}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onPress,
}: {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, styles.sectionTitleCompact, { color: colors.foreground }]}>
        {title}
      </Text>
      {actionLabel && onPress ? (
        <TouchableOpacity style={styles.sectionAction} onPress={onPress}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>
            {actionLabel}
          </Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ==================== Withdrawal Modal ====================

function WithdrawMethodModal({
  visible,
  maxAmount,
  activeBankRequestsCount,
  reservedAmount,
  onWalletPress,
  onBankPress,
  onHistoryPress,
  onClose,
}: {
  visible: boolean;
  maxAmount: number;
  activeBankRequestsCount: number;
  reservedAmount: number;
  onWalletPress: () => void;
  onBankPress: () => void;
  onHistoryPress: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, paddingTop: 24 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Choose Withdrawal Method
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Available Balance
            </Text>
            <Text
              style={[
                styles.modalBalance,
                { color: colors.primary },
              ]}
            >
              ₦{maxAmount.toLocaleString()}
            </Text>
            <View
              style={[
                styles.methodCard,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <View style={styles.methodCardIcon}>
                <Wallet size={20} color={colors.primary} />
              </View>
              <View style={styles.methodCardBody}>
                <Text style={[styles.methodCardTitle, { color: colors.foreground }]}>
                  Move to Wallet
                </Text>
                <Text style={[styles.methodCardText, { color: colors.textSecondary }]}>
                  Receive this withdrawal instantly in your app wallet.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.methodCardButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onWalletPress}
              >
                <Text style={styles.methodCardButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.methodCard,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <View style={styles.methodCardIcon}>
                <Building2 size={20} color={colors.primary} />
              </View>
              <View style={styles.methodCardBody}>
                <Text style={[styles.methodCardTitle, { color: colors.foreground }]}>
                  Request Bank Transfer
                </Text>
                <Text style={[styles.methodCardText, { color: colors.textSecondary }]}>
                  Submit this payout for admin processing.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.methodCardButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onBankPress}
              >
                <Text style={styles.methodCardButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.historyLink, { borderColor: colors.border }]}
              onPress={onHistoryPress}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                View Bank Withdrawal History
              </Text>
            </TouchableOpacity>
            {activeBankRequestsCount > 0 ? (
              <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
                You currently have {activeBankRequestsCount} active withdrawal
                {" "}request{activeBankRequestsCount > 1 ? "s" : ""}. Only the
                {" "}remaining ₦{maxAmount.toLocaleString()} can be withdrawn now.
              </Text>
            ) : null}
            {reservedAmount > 0 ? (
              <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
                ₦{reservedAmount.toLocaleString()} is reserved in the app until
                those withdrawal requests are resolved.
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WalletWithdrawalModal({
  visible,
  maxAmount,
  amount,
  onAmountChange,
  onUseMax,
  onWithdraw,
  isLoading,
  onClose,
}: {
  visible: boolean;
  maxAmount: number;
  amount: string;
  onAmountChange: (value: string) => void;
  onUseMax: () => void;
  onWithdraw: () => void;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, paddingTop: 24 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Withdraw to Wallet
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Available Balance
            </Text>
            <Text style={[styles.modalBalance, { color: colors.primary }]}>
              ₦{maxAmount.toLocaleString()}
            </Text>

            <Text
              style={[
                styles.modalLabel,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              Amount to Withdraw
            </Text>
            <TouchableOpacity
              style={[
                styles.useMaxButton,
                { borderColor: colors.border, backgroundColor: colors.primary + "12" },
              ]}
              onPress={onUseMax}
              disabled={isLoading || maxAmount === 0}
            >
              <Text style={[styles.useMaxButtonText, { color: colors.primary }]}>
                Use max amount
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: isDark ? colors.background : "#F3F4F6",
                },
              ]}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={onAmountChange}
            />
            <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
              Your commission will be moved to your wallet immediately.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { borderColor: colors.border },
                ]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onWithdraw}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BankWithdrawalModal({
  visible,
  maxAmount,
  amount,
  form,
  onAmountChange,
  onUseMax,
  onFormChange,
  onWithdraw,
  isLoading,
  onClose,
}: {
  visible: boolean;
  maxAmount: number;
  amount: string;
  form: {
    bankName: string;
    bankCode: string;
    accountName: string;
    accountNumber: string;
    narration: string;
    requestNotes: string;
  };
  onAmountChange: (value: string) => void;
  onUseMax: () => void;
  onFormChange: (
    field: "bankName" | "bankCode" | "accountName" | "accountNumber" | "narration" | "requestNotes",
    value: string
  ) => void;
  onWithdraw: () => void;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();

  const inputStyle = [
    styles.modalInput,
    {
      borderColor: colors.border,
      color: colors.foreground,
      backgroundColor: isDark ? colors.background : "#F3F4F6",
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, paddingTop: 24 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Request Bank Transfer
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.textSecondary }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bankModalScroll}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Available Balance
            </Text>
            <Text style={[styles.modalBalance, { color: colors.primary }]}>
              ₦{maxAmount.toLocaleString()}
            </Text>

            <Text
              style={[
                styles.modalLabel,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              Amount to Withdraw
            </Text>
            <TouchableOpacity
              style={[
                styles.useMaxButton,
                { borderColor: colors.border, backgroundColor: colors.primary + "12" },
              ]}
              onPress={onUseMax}
              disabled={isLoading || maxAmount === 0}
            >
              <Text style={[styles.useMaxButtonText, { color: colors.primary }]}>
                Use max amount
              </Text>
            </TouchableOpacity>
            <TextInput
              style={inputStyle}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={onAmountChange}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Bank Name
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Access Bank"
              placeholderTextColor={colors.textSecondary}
              value={form.bankName}
              onChangeText={(value) => onFormChange("bankName", value)}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Bank Code
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="Optional bank code"
              placeholderTextColor={colors.textSecondary}
              value={form.bankCode}
              onChangeText={(value) => onFormChange("bankCode", value)}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Account Name
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="Account holder name"
              placeholderTextColor={colors.textSecondary}
              value={form.accountName}
              onChangeText={(value) => onFormChange("accountName", value)}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Account Number
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="0123456789"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={form.accountNumber}
              onChangeText={(value) => onFormChange("accountNumber", value)}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Narration
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="Optional narration"
              placeholderTextColor={colors.textSecondary}
              value={form.narration}
              onChangeText={(value) => onFormChange("narration", value)}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              Request Note
            </Text>
            <TextInput
              style={[inputStyle, styles.notesInput]}
              placeholder="Optional note for admin review"
              placeholderTextColor={colors.textSecondary}
              value={form.requestNotes}
              onChangeText={(value) => onFormChange("requestNotes", value)}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.modalHint, { color: colors.textSecondary }]}>
              This request will be reviewed by admin. Your commission balance is
              deducted only after the transfer succeeds.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { borderColor: colors.border },
                ]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={onWithdraw}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Submit Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  content: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  becomeAgentSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitleCompact: {
    marginBottom: 0,
    paddingHorizontal: 0,
    flex: 1,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },

  // CTA Card
  ctaCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Agent Code Section
  codeInputContainer: {
    flexDirection: "row",
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  codeInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E69E1980",
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E69E19",
  },
  codeActions: {
    flexDirection: "row",
    gap: 8,
  },
  codeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  shareCodeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Balance Display
  balanceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  withdrawButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawHistoryButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  pendingInfoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  pendingInfoTextBlock: {
    flex: 1,
    gap: 4,
  },
  pendingInfoTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  pendingInfoSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  withdrawalAvailabilityCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  withdrawalAvailabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  withdrawalAvailabilityLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  withdrawalAvailabilityValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  withdrawalStatusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  withdrawalStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  withdrawalStatusInfo: {
    flex: 1,
    gap: 4,
  },
  withdrawalStatusTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  withdrawalStatusMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  withdrawalStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  withdrawalStatusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  withdrawalStatusMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  withdrawalStatusLink: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  // List Items
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  listEmail: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  listMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  listAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  listSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },

  // Empty State
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalBalance: {
    fontSize: 24,
    fontWeight: "700",
  },
  methodCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  methodCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E69E191F",
  },
  methodCardBody: {
    flex: 1,
    gap: 4,
  },
  methodCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  methodCardText: {
    fontSize: 12,
    lineHeight: 17,
  },
  methodCardButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodCardButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  historyLink: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  bankModalScroll: {
    maxHeight: 520,
  },
  useMaxButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  useMaxButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  notesInput: {
    minHeight: 96,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
