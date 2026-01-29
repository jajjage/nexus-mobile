/**
 * Transaction Receipt
 * Displays transaction receipt matching the web frontend design
 * Uses actual transaction data from the transaction object
 */

import {
  formatCurrency,
  formatTransactionDate,
  getCashbackUsed,
  getFormattedAmount,
  getLocalOperatorLogo,
  getServiceTypeLabel,
  getStatusConfig,
  getTransactionDescription,
  getTransactionTypeLabel,
  isDataTransaction,
  isRefundTransaction
} from "@/lib/transactionUtils";
import { Transaction } from "@/types/wallet.types";
import * as Clipboard from "expo-clipboard";
import { Copy, CreditCard, Phone, Wifi } from "lucide-react-native";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface TransactionReceiptProps {
  transaction: Transaction;
  showLogo?: boolean;
}

export const TransactionReceipt = React.forwardRef<View, TransactionReceiptProps>(
  ({ transaction, showLogo = true }, ref) => {
    const isCredit = transaction.direction === "credit";
    const relatedStatus = transaction.related?.status?.toLowerCase();

    // Check if refund
    const isRefund =
      isCredit &&
      transaction.relatedType === "topup_request" &&
      (relatedStatus === "failed" || relatedStatus === "reversed");

    const isTopupRequest = transaction.relatedType === "topup_request";
    const isDataProduct = isDataTransaction(transaction);

    // Get formatted amount for main display
    const formattedAmount = getFormattedAmount(transaction);

    const formattedAmountPaid = formatCurrency(transaction.amount);

    const operatorLogo = getLocalOperatorLogo(transaction);
    
    const statusConfig = getStatusConfig(transaction.related?.status || "pending", isRefund);

    const handleCopyId = async () => {
      await Clipboard.setStringAsync(transaction.id);
      // Show toast or feedback
    };

    const renderIcon = () => {
      const iconSize = 32;
      if (isTopupRequest) {
        if (operatorLogo) {
          return <Image source={operatorLogo} style={styles.logo} resizeMode="cover" />;
        }
        if (isDataProduct) return <Wifi size={iconSize} color="#9333EA" />;
        return <Phone size={iconSize} color="#2563EB" />;
      }
      return <CreditCard size={iconSize} color="#9CA3AF" />;
    };

    return (
      <View ref={ref} style={styles.container}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Logo / Icon Container */}
          <View style={[styles.logoContainer, isTopupRequest && isDataProduct && { backgroundColor: '#F3E8FF' }, isTopupRequest && !isDataProduct && { backgroundColor: '#DBEAFE' }, operatorLogo && { backgroundColor: '#F8FAFC' }]}>
            {showLogo ? (
              renderIcon()
            ) : (
              <CreditCard size={32} color="#9CA3AF" />
            )}
          </View>

          {/* Transaction Type */}
          <Text style={styles.transactionType}>{getTransactionTypeLabel(transaction)}</Text>

          {/* Description */}
          <Text style={styles.description}>{getTransactionDescription(transaction)}</Text>

          {/* Amount / Bundle Name */}
          <Text style={styles.amount} numberOfLines={2}>{formattedAmount}</Text>

          {/* Status */}
          <Text style={[styles.status, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>

          {/* Date */}
          <Text style={styles.date}>{formatTransactionDate(transaction.createdAt)}</Text>
        </View>

        {/* Dotted Separator */}
        <View style={styles.separator} />

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>TRANSACTION DETAILS</Text>

          {/* Recipient Phone */}
          {transaction.related?.recipient_phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recipient Phone</Text>
              <Text style={styles.detailValue}>{transaction.related.recipient_phone}</Text>
            </View>
          )}

          {/* Amount Paid */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>{formattedAmountPaid}</Text>
          </View>

          {/* Cashback Used */}
          {isTopupRequest && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cashback Used</Text>
              <Text style={[styles.detailValue, styles.cashbackValue]}>
                -{getCashbackUsed(transaction)}
              </Text>
            </View>
          )}

          {/* Service Type */}
          {isTopupRequest && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{getServiceTypeLabel(transaction)}</Text>
                <Text style={styles.detailValueSubtext}>
                  {transaction.productCode || transaction.related?.productCode || "N/A"}
                </Text>
              </View>
            </View>
          )}

          {/* Transaction ID */}
          <View style={styles.transactionIdSection}>
            <View style={styles.transactionIdHeader}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <TouchableOpacity onPress={handleCopyId} style={styles.copyButton}>
                <Copy size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.transactionId}>{transaction.id}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>nexus-mobile.com</Text>
        </View>
      </View>
    );
  }
);

TransactionReceipt.displayName = "TransactionReceipt";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  topSection: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  logo: {
    width: 64,
    height: 64,
  },
  creditIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  creditIconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  transactionType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 250,
  },
  amount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 8,
    textAlign: "center",
  },
  date: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  separator: {
    marginHorizontal: 16,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
  },
  detailsSection: {
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  detailValueContainer: {
    alignItems: "flex-end",
  },
  detailValueSubtext: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  cashbackValue: {
    color: "#EF4444",
  },
  transactionIdSection: {
    marginTop: 8,
  },
  transactionIdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyButton: {
    padding: 4,
  },
  transactionId: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#475569",
    marginTop: 4,
  },
  footer: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
});