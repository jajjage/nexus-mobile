/**
 * Transaction Detail Screen
 * Displays comprehensive transaction details with timeline and share functionality
 * Aligned with frontend transaction-detail-page.tsx
 */

import { ShareTransactionSheet } from "@/components/ShareTransactionSheet";
import { TransactionTimelineFromTx } from "@/components/transactions/TransactionTimeline";
import { useTheme } from "@/context/ThemeContext";
import { useTransaction } from "@/hooks/useWallet";
import {
    formatCurrency,
    formatTransactionDate,
    getCashbackUsed,
    getDisplayStatus,
    getFormattedAmount,
    getServiceTypeLabel,
    getStatusConfig,
    getTransactionDescription,
    getTransactionTypeLabel,
    isRefundTransaction,
} from "@/lib/transactionUtils";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Copy,
    Loader2,
    Phone,
    Share2,
    Wifi,
    XCircle,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { colors, isDark } = useTheme();
  
  const { data: txResponse, isLoading, error } = useTransaction(id || "");
  const transaction = txResponse?.data;
  
  const [showShareModal, setShowShareModal] = useState(false);

  // Back navigation
  const handleBack = () => {
    if (from === "transactions") {
      router.push("/transactions");
    } else {
      router.back();
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${label} copied`);
  };

  // Share receipt
  const handleShare = () => {
    if (!transaction) return;
    setShowShareModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading transaction...</Text>
      </View>
    );
  }

  // Error state
  if (error || !transaction) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Transaction Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.centerContent}>
          <XCircle size={48} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>Transaction not found</Text>
          <Pressable onPress={handleBack} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Transaction data
  const isCredit = transaction.direction === "credit";
  const isRefund = isRefundTransaction(transaction);
  const status = transaction.related?.status || "pending";
  const statusConfig = getStatusConfig(status, isRefund);
  const typeLabel = getTransactionTypeLabel(transaction);
  const description = getTransactionDescription(transaction);
  const formattedAmount = getFormattedAmount(transaction);
  const displayStatus = getDisplayStatus(transaction);

  // Get transaction icon
  const renderTransactionIcon = () => {
    const iconSize = 32;
    
    if (transaction.relatedType === "topup_request") {
      const isData = transaction.productCode?.toLowerCase().includes("data") ||
        transaction.productCode?.toLowerCase().includes("gb");
      
      if (isData) {
        return (
          <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(147, 51, 234, 0.2)" : "#F3E8FF" }]}>
            <Wifi size={iconSize} color="#9333EA" />
          </View>
        );
      }
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "#DBEAFE" }]}>
          <Phone size={iconSize} color="#2563EB" />
        </View>
      );
    }

    if (isCredit) {
      return (
        <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(22, 163, 74, 0.2)" : "#DCFCE7" }]}>
          <ArrowDownLeft size={iconSize} color="#16A34A" />
        </View>
      );
    }

    return (
      <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.2)" : "#FEE2E2" }]}>
        <ArrowUpRight size={iconSize} color="#DC2626" />
      </View>
    );
  };

  // Render status icon
  const renderStatusIcon = () => {
    const iconSize = 16;
    switch (statusConfig.icon) {
      case "check":
        return <CheckCircle2 size={iconSize} color={statusConfig.color} />;
      case "clock":
        return <Clock size={iconSize} color={statusConfig.color} />;
      case "loader":
        return <Loader2 size={iconSize} color={statusConfig.color} />;
      case "x":
        return <XCircle size={iconSize} color={statusConfig.color} />;
      default:
        return <Clock size={iconSize} color={statusConfig.color} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Transaction Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? "#000" : "#000" }]}>
          {/* Icon & Title Section */}
          <View style={[styles.topSection, { borderBottomColor: colors.border }]}>
            {renderTransactionIcon()}
            
            <Text style={[styles.typeLabel, { color: colors.foreground }]}>{typeLabel}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
            
            {/* Amount */}
            <Text style={[styles.amount, { color: colors.foreground }]}>{formattedAmount}</Text>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: isDark ? `${statusConfig.color}20` : statusConfig.bgColor }]}>
              {renderStatusIcon()}
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Date */}
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {formatTransactionDate(transaction.createdAt)}
            </Text>
          </View>

          {/* Timeline Section */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TRANSACTION STATUS</Text>
            <TransactionTimelineFromTx transaction={transaction} />
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TRANSACTION DETAILS</Text>
            
            {/* Recipient Phone */}
            {transaction.related?.recipient_phone && (
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Recipient Phone</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {transaction.related.recipient_phone}
                </Text>
              </View>
            )}

            {/* Amount Paid */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>

            {/* Cashback Used */}
            {transaction.relatedType === "topup_request" && (
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cashback Used</Text>
                <Text style={[styles.detailValue, { color: "#DC2626" }]}>
                  -{getCashbackUsed(transaction)}
                </Text>
              </View>
            )}

            {/* Service Type */}
            {transaction.relatedType === "topup_request" && (
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Service Type</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {getServiceTypeLabel(transaction)}
                </Text>
              </View>
            )}

            {/* Transaction ID - Copyable */}
            <View style={styles.transactionIdRow}>
              <View style={styles.transactionIdHeader}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Transaction ID</Text>
                <Pressable
                  onPress={() => copyToClipboard(transaction.id, "Transaction ID")}
                  style={styles.copyButton}
                >
                  <Copy size={14} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text style={[styles.transactionIdValue, { color: colors.textTertiary }]} numberOfLines={2}>
                {transaction.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Share Button */}
        <Pressable
          onPress={handleShare}
          style={[styles.shareButton, { backgroundColor: colors.primary }]}
        >
          <Share2 size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </Pressable>
      </ScrollView>

      {/* Share Receipt Sheet */}
      {transaction && (
        <ShareTransactionSheet
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          transaction={transaction}
        />
      )}
    </View>
  );
}

// ============= Styles =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topSection: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
    maxWidth: "60%",
  },
  transactionIdRow: {
    paddingTop: 12,
  },
  transactionIdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  copyButton: {
    padding: 4,
  },
  transactionIdValue: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
