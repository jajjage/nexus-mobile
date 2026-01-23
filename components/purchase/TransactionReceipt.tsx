/**
 * Transaction Receipt
 * Displays transaction receipt matching the web frontend design
 * Uses actual transaction data from the transaction object
 */

import { Transaction } from "@/types/wallet.types";
import * as Clipboard from "expo-clipboard";
import { Copy, CreditCard } from "lucide-react-native";
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

// Operator logos
const OPERATOR_LOGOS: Record<string, string> = {
  mtn: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/New-mtn-logo.jpg/960px-New-mtn-logo.jpg",
  airtel: "https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg",
  glo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Glo_button.png",
  "9mobile": "https://logosandtypes.com/wp-content/uploads/2020/10/9mobile-1.svg",
};

// Get status config for styling
const getStatusConfig = (status: string, isRefund?: boolean) => {
  if (isRefund) {
    return { color: "#166534", label: "Refunded" };
  }

  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "completed":
    case "received":
    case "success":
      return { color: "#166534", label: "Successful" };
    case "pending":
      return { color: "#B45309", label: "Pending" };
    case "failed":
    case "reversed":
      return { color: "#991B1B", label: "Failed" };
    case "cancelled":
      return { color: "#374151", label: "Cancelled" };
    default:
      return { color: "#374151", label: status };
  }
};

// Check if transaction is for data
const isDataTransaction = (transaction: Transaction): boolean => {
  if (transaction.related?.type?.toLowerCase() === "data") return true;
  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];
  return dataPatterns.some((p) => productCode.includes(p));
};

// Get transaction type label
const getTransactionTypeLabel = (transaction: Transaction): string => {
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();

  // Refund check
  if (
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed")
  ) {
    return "Refund";
  }

  if (transaction.relatedType === "topup_request") {
    const typeLabel = isDataTransaction(transaction) ? "Data" : "Airtime";
    return `${typeLabel} Purchase`;
  }
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }
  return transaction.direction === "debit" ? "Withdrawal" : "Deposit";
};

// Get transaction description
const getTransactionDescription = (transaction: Transaction): string => {
  if (transaction.relatedType === "topup_request") {
    const typeLabel = isDataTransaction(transaction) ? "Data" : "Airtime";
    const operator = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    return `${typeLabel} to ${operator} - ${phone}`;
  }
  return transaction.note || transaction.method || "Transaction";
};

// Format date
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

// Get service type label
const getServiceTypeLabelLocal = (transaction: Transaction): string => {
  return isDataTransaction(transaction) ? "Data Bundle" : "Airtime";
};

// Get cashback display
const getCashbackDisplay = (transaction: Transaction): string => {
  const cashbackUsed = transaction.cashbackUsed || 0;
  return `₦${cashbackUsed.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
};

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
    let formattedAmount: string;
    if (isRefund) {
      formattedAmount = `₦${transaction.amount.toLocaleString("en-NG")}`;
    } else if (isTopupRequest) {
      if (isDataProduct) {
        formattedAmount = transaction.productCode || transaction.related?.productCode || "Data Bundle";
      } else {
        const operator = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
        const denom = transaction.denomAmount ? `₦${transaction.denomAmount.toLocaleString()}` : "";
        formattedAmount = `${operator} ${denom} Airtime`;
      }
    } else {
      formattedAmount = `₦${transaction.amount.toLocaleString("en-NG")}`;
    }

    const formattedAmountPaid = `₦${transaction.amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
    })}`;

    const operatorCode = transaction.related?.operatorCode?.toLowerCase();
    const logoUrl = operatorCode ? OPERATOR_LOGOS[operatorCode] : undefined;
    const statusConfig = getStatusConfig(transaction.related?.status || "pending", isRefund);

    const handleCopyId = async () => {
      await Clipboard.setStringAsync(transaction.id);
      // Show toast or feedback
    };

    return (
      <View ref={ref} style={styles.container}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Logo / Icon */}
          <View style={styles.logoContainer}>
            {showLogo && isTopupRequest && logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
            ) : isCredit ? (
              <View style={styles.creditIcon}>
                <Text style={styles.creditIconText}>IN</Text>
              </View>
            ) : (
              <CreditCard size={32} color="#9CA3AF" />
            )}
          </View>

          {/* Transaction Type */}
          <Text style={styles.transactionType}>{getTransactionTypeLabel(transaction)}</Text>

          {/* Description */}
          <Text style={styles.description}>{getTransactionDescription(transaction)}</Text>

          {/* Amount */}
          <Text style={styles.amount}>{formattedAmount}</Text>

          {/* Status */}
          <Text style={[styles.status, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>

          {/* Date */}
          <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
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
                -{getCashbackDisplay(transaction)}
              </Text>
            </View>
          )}

          {/* Service Type */}
          {isTopupRequest && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{getServiceTypeLabelLocal(transaction)}</Text>
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
          <Text style={styles.footerText}>nexus-data.com</Text>
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
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: "#94A3B8",
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