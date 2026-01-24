// app/(tabs)/referral.tsx
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import {
    useAvailableBalanceV2,
    useClaimReferralBonusV2,
    useReferralLink,
    useReferralsList,
    useReferralStatsV2,
    useRegenerateReferralCode,
    useRequestWithdrawalV2,
} from "@/hooks/useReferrals";
import { Referral } from "@/types/referral.types";
import * as Clipboard from "expo-clipboard";
import {
    Banknote,
    Clock,
    Copy,
    Gift,
    RefreshCw,
    Share2,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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

// ==================== Components ====================

function ReferralActionCard() {
  const { data: stats } = useReferralStatsV2();
  const { data: referrerBalance } = useAvailableBalanceV2("referrer");
  const { data: referredBalance } = useAvailableBalanceV2("referred");
  const { mutate: claimBonus, isPending: isClaiming } = useClaimReferralBonusV2();

  const [showWithdrawalModal, setShowWithdrawalModal] = useState<
    "referrer" | "referred" | null
  >(null);

  const canClaimBonus = stats?.referredStats?.referralStatus === "pending";
  const referrerAmount = referrerBalance?.totalAvailable || 0;
  const referredAmount = referredBalance?.totalAvailable || 0;

  // Colors
  const { colors, isDark } = useTheme();

  if (!canClaimBonus && referrerAmount === 0 && referredAmount === 0) {
    return null;
  }

  return (
    <View style={[styles.actionCard, { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }]}>
      <View style={styles.actionHeader}>
        <View style={styles.giftIcon}>
          <Gift size={20} color="#d97706" />
        </View>
        <Text style={[styles.actionTitle, { color: "#92400E" }]}>
          {canClaimBonus ? "Claim Your Reward" : "Available Rewards"}
        </Text>
      </View>

      <Text style={[styles.actionSubtitle, { color: "#B45309" }]}>
        {canClaimBonus
          ? `You were referred by ${stats?.referredStats?.referrerName}. Claim your signup bonus now!`
          : "Collect your referral earnings."}
      </Text>

      {/* Balances Display */}
      <View style={styles.balancesRow}>
        {(canClaimBonus || referredAmount > 0) && (
          <View>
            <Text style={[styles.balanceLabel, { color: "#92400E" }]}>Signup Bonus</Text>
            <Text style={[styles.balanceAmount, { color: "#B45309" }]}>
              ₦{(referredAmount || 250).toLocaleString()}
            </Text>
          </View>
        )}
        {referrerAmount > 0 && (
          <View>
            <Text style={[styles.balanceLabel, { color: "#92400E" }]}>Referral Earnings</Text>
            <Text style={[styles.balanceAmount, { color: "#B45309" }]}>
              ₦{referrerAmount.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {canClaimBonus && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => claimBonus()}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Gift size={16} color="#fff" />
                <Text style={styles.claimButtonText}>Claim Bonus</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {referredAmount > 0 && !canClaimBonus && (
          <TouchableOpacity
            style={[styles.withdrawButton, { borderColor: "#F59E0B" }]}
            onPress={() => setShowWithdrawalModal("referred")}
          >
            <Wallet size={16} color="#B45309" />
            <Text style={{ color: "#B45309", fontWeight: "600" }}>Withdraw Bonus</Text>
          </TouchableOpacity>
        )}

        {referrerAmount > 0 && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => setShowWithdrawalModal("referrer")}
          >
            <Wallet size={16} color="#fff" />
            <Text style={styles.claimButtonText}>Withdraw Earnings</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        visible={showWithdrawalModal !== null}
        userType={showWithdrawalModal || "referrer"}
        onClose={() => setShowWithdrawalModal(null)}
      />
    </View>
  );
}

function ReferralStatsCards() {
  const { data: stats, isLoading: isLoadingStats } = useReferralStatsV2();
  const { data: referrerBalance } = useAvailableBalanceV2("referrer");
  const { data: referredBalance } = useAvailableBalanceV2("referred");
  const { colors, isDark } = useTheme();

  const totalWithdrawable =
    (referrerBalance?.totalAvailable || 0) +
    (referredBalance?.totalAvailable || 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

  if (isLoadingStats) {
    return (
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={100} style={styles.statCard} />
        ))}
      </View>
    );
  }

  const referrer = stats?.referrerStats;
  const referred = stats?.referredStats;

  const cardStyle = [styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }];
  const titleStyle = [styles.statTitle, { color: colors.textSecondary }];
  const valueStyle = [styles.statValue, { color: colors.foreground }];
  const subtextStyle = [styles.statSubtext, { color: colors.textTertiary }];

  return (
    <View style={styles.statsGrid}>
      {/* Invited Friends */}
      <View style={cardStyle}>
        <View style={styles.statHeader}>
          <Text style={titleStyle}>Invited Friends</Text>
          <Users size={16} color={colors.textSecondary} />
        </View>
        <Text style={valueStyle}>{referrer?.totalReferralsInvited || 0}</Text>
        <Text style={subtextStyle}>
          {referrer?.claimedReferrals || 0} claimed, {referrer?.pendingClaimReferrals || 0}{" "}
          pending
        </Text>
      </View>

      {/* Inviter Earnings */}
      <View style={cardStyle}>
        <View style={styles.statHeader}>
          <Text style={titleStyle}>Inviter Earnings</Text>
          <TrendingUp size={16} color={colors.textSecondary} />
        </View>
        <Text style={valueStyle}>
          {formatCurrency(referrer?.totalReferrerEarnings || 0)}
        </Text>
        <Text style={subtextStyle}>Lifetime earnings</Text>
      </View>

      {/* Signup Bonus */}
      <View style={cardStyle}>
        <View style={styles.statHeader}>
          <Text style={titleStyle}>Signup Bonus</Text>
          <Banknote size={16} color={colors.textSecondary} />
        </View>
        <Text style={valueStyle}>
          {formatCurrency(referred?.totalReferredEarnings || 0)}
        </Text>
        <Text style={subtextStyle}>
          {referred ? `Referred by ${referred.referrerName}` : "Not referred"}
        </Text>
      </View>

      {/* Withdrawable */}
      <View style={cardStyle}>
        <View style={styles.statHeader}>
          <Text style={titleStyle}>Withdrawable</Text>
          <Clock size={16} color={colors.textSecondary} />
        </View>
        <Text style={[styles.statValue, { color: "#d97706" }]}>
          {formatCurrency(totalWithdrawable)}
        </Text>
        <Text style={subtextStyle}>Claimed rewards ready</Text>
      </View>
    </View>
  );
}

function ReferralLinkSection() {
  const { data: linkData, isLoading, refetch } = useReferralLink();
  const { mutate: regenerateCode, isPending: isRegenerating } =
    useRegenerateReferralCode();
  const [isCopied, setIsCopied] = useState(false);
  const { colors, isDark } = useTheme();

  const handleCopy = async () => {
    if (!linkData?.referralLink) return;
    await Clipboard.setStringAsync(linkData.referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const handleShare = async () => {
    if (!linkData) return;
    try {
      await Share.share({
        message:
          linkData.sharingMessage ||
          `Use my code ${linkData.referralCode} to join!`,
        url: linkData.referralLink,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      "Regenerate Referral Code?",
      "This will invalidate your current referral link. Any old links shared will no longer work.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            regenerateCode(undefined, { onSuccess: () => refetch() }),
        },
      ]
    );
  };

  const cardStyle = [styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }];
  const titleStyle = [styles.linkTitle, { color: colors.foreground }];
  const subtitleStyle = [styles.linkSubtitle, { color: colors.textSecondary }];

  if (isLoading) {
    return (
      <View style={cardStyle}>
        <Skeleton height={24} width={150} />
        <Skeleton height={48} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (!linkData) {
    return (
      <View style={cardStyle}>
        <Text style={styles.noLinkText}>No referral link active.</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <ActivityIndicator color={"#fff"} />
          ) : (
             <Text style={{color: '#fff', fontWeight: '600'}}>Generate Referral Link</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <View style={styles.linkHeader}>
        <View>
          <Text style={titleStyle}>Your Referral Link</Text>
          <Text style={subtitleStyle}>
            Share this link to earn rewards when friends sign up.
          </Text>
        </View>
        <TouchableOpacity onPress={handleRegenerate}>
          <RefreshCw size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Link Input */}
      <View style={[styles.linkInputContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
        <TextInput
          style={[styles.linkInput, { color: colors.foreground }]}
          value={linkData.referralLink}
          editable={false}
        />
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>Code: {linkData.referralCode}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.linkActions}>
        <TouchableOpacity
          style={[styles.copyButton, { borderColor: colors.border }]}
          onPress={handleCopy}
          disabled={isCopied}
        >
          <Copy size={16} color={colors.foreground} />
          <Text style={{ color: colors.foreground }}>{isCopied ? "Copied" : "Copy"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: '600' }}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      {linkData.qrCodeUrl && (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: linkData.qrCodeUrl }}
            style={styles.qrCode}
          />
        </View>
      )}
    </View>
  );
}

function ReferralsTable() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useReferralsList({ page, limit: 10 });
  const { colors, isDark } = useTheme();

  const referrals = response?.referrals || [];
  const pagination = response?.pagination;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "claimed":
        return "#22c55e";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const renderItem = ({ item }: { item: Referral }) => (
    <View style={[styles.referralRow, { borderBottomColor: colors.border }]}>
      <View style={styles.referralInfo}>
        <Text style={[styles.referralName, { color: colors.foreground }]}>
          {item.referredUser?.fullName ||
            item.referredUser?.email ||
            "User Joined"}
        </Text>
        <Text style={styles.referralEmail}>{item.referredUser?.email}</Text>
      </View>
      <Text style={styles.referralDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) + '20' }, // 20% opacity
        ]}
      >
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status === "claimed" ? "Success" : item.status}
        </Text>
      </View>
      <Text style={[styles.referralAmount, { color: colors.foreground }]}>₦{item.rewardAmount}</Text>
    </View>
  );

  const cardStyle = [styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }];
  const titleStyle = [styles.tableTitle, { color: colors.foreground }];

  if (isLoading) {
    return (
      <View style={cardStyle}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (referrals.length === 0) {
    return (
      <View style={cardStyle}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No referrals yet. Share your link to get started!
        </Text>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <Text style={titleStyle}>Invited Friends</Text>
      <Text style={styles.tableSubtitle}>
        Track status of people you've invited.
      </Text>

      <FlatList
        data={referrals}
        keyExtractor={(item) => item.referralId}
        renderItem={renderItem}
        scrollEnabled={false}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={[
              styles.pageButton,
              page <= 1 && styles.pageButtonDisabled,
            ]}
          >
            <Text style={{color: colors.foreground}}>Previous</Text>
          </TouchableOpacity>
          <Text style={{color: colors.textSecondary}}>
            Page {page} of {pagination.totalPages}
          </Text>
          <TouchableOpacity
            onPress={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page >= pagination.totalPages}
            style={[
              styles.pageButton,
              page >= pagination.totalPages && styles.pageButtonDisabled,
            ]}
          >
            <Text style={{color: colors.foreground}}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function WithdrawalModal({
  visible,
  userType,
  onClose,
}: {
  visible: boolean;
  userType: "referrer" | "referred";
  onClose: () => void;
}) {
  const { data: balance, isLoading } = useAvailableBalanceV2(userType);
  const { mutate: requestWithdrawal, isPending } = useRequestWithdrawalV2();
  const { colors, isDark } = useTheme();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const availableAmount = balance?.totalAvailable || 0;

  useEffect(() => {
    if (visible) {
      setAmount(availableAmount.toString());
      setError("");
    }
  }, [visible, availableAmount]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      setError("Minimum withdrawal is ₦100");
      return;
    }
    if (numAmount > 1000000) {
      setError("Maximum withdrawal is ₦1,000,000");
      return;
    }
    if (numAmount > availableAmount) {
      setError("Amount exceeds available balance");
      return;
    }

    requestWithdrawal(
      { userType, amount: numAmount },
      {
        onSuccess: () => {
          onClose();
          setAmount("");
        },
      }
    );
  };

  const title =
    userType === "referrer"
      ? "Withdraw Referral Earnings"
      : "Withdraw Signup Bonus";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Transfer your earnings to your main wallet balance.
          </Text>

          {/* Available Balance */}
          <View style={[styles.balanceDisplay, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
            <Text style={{ color: colors.textSecondary }}>Available to Withdraw:</Text>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.balanceValue, { color: colors.foreground }]}>
                ₦{availableAmount.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Amount Input */}
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Amount to Withdraw</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.foreground, borderColor: colors.border }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={styles.inputHint}>
            Minimum withdrawal amount is ₦100.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Actions */}
          <View style={{ gap: 12 }}>
             <TouchableOpacity
                style={[
                styles.confirmButton,
                (isPending || availableAmount < 100) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isPending || availableAmount < 100}
            >
                {isPending ? (
                <ActivityIndicator color="#fff" />
                ) : (
                <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={onClose}>
                <Text style={{ color: colors.foreground }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          
        </View>
      </View>
    </Modal>
  );
}

// ==================== Main Screen ====================

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Use stats query to handle refresh
  const { refetch } = useReferralStatsV2();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    // Also refetch other queries if needed, usually just stats is main trigger
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Referrals</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Invite friends and earn rewards
        </Text>

        <ReferralActionCard />
        <ReferralStatsCards />
        <ReferralLinkSection />
        <ReferralsTable />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  // Action Card
  actionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  giftIcon: {
    marginRight: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  balancesRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  claimButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%", // adjust for gap
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 10,
  },
  // Link Section
  linkCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  linkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  linkInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  linkInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  codeBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  codeBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  linkActions: {
    flexDirection: "row",
    gap: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
    gap: 8,
  },
  generateButton: {
      backgroundColor: "#F59E0B",
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12
  },
  noLinkText: {
      textAlign: 'center',
      color: '#6b7280'
  },
  qrContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  // Table
  tableCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  tableSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
  },
  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: "500",
  },
  referralEmail: {
    fontSize: 12,
    color: "#6b7280",
  },
  referralDate: {
    fontSize: 12,
    color: "#6b7280",
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  referralAmount: {
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  pageButton: {
    padding: 8,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  balanceDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: "#F59E0B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  errorText: {
      color: '#ef4444',
      marginBottom: 16
  }
});
