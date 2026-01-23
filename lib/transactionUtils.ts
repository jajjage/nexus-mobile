/**
 * Transaction Utility Functions
 * Shared helpers for transaction display logic
 * Aligned with frontend implementation per TRANSACTION_DETAIL_RECEIPT_COMPLETE_GUIDE.md
 */

import { Transaction } from "@/types/wallet.types";

// ============= Status Configuration =============

export interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  icon: "check" | "clock" | "x" | "loader";
}

/**
 * Get status icon and color configuration
 * Matches frontend getStatusConfig()
 */
export function getStatusConfig(status: string, isRefund?: boolean): StatusConfig {
  if (isRefund) {
    return {
      icon: "check",
      color: "#16A34A", // green-600
      bgColor: "#DCFCE7", // green-100
      label: "Refunded",
    };
  }

  switch (status.toLowerCase()) {
    case "completed":
    case "received":
    case "success":
      return {
        icon: "check",
        color: "#16A34A", // green-600
        bgColor: "#DCFCE7", // green-100
        label: "Successful",
      };
    case "pending":
      return {
        icon: "clock",
        color: "#D97706", // amber-600
        bgColor: "#FEF3C7", // amber-100
        label: "Pending",
      };
    case "processing":
      return {
        icon: "loader",
        color: "#2563EB", // blue-600
        bgColor: "#DBEAFE", // blue-100
        label: "Processing",
      };
    case "failed":
      return {
        icon: "x",
        color: "#DC2626", // red-600
        bgColor: "#FEE2E2", // red-100
        label: "Failed",
      };
    case "cancelled":
      return {
        icon: "x",
        color: "#6B7280", // gray-500
        bgColor: "#F3F4F6", // gray-100
        label: "Cancelled",
      };
    case "reversed":
      return {
        icon: "x",
        color: "#EA580C", // orange-600
        bgColor: "#FFEDD5", // orange-100
        label: "Reversed",
      };
    case "retry":
      return {
        icon: "loader",
        color: "#2563EB", // blue-600
        bgColor: "#DBEAFE", // blue-100
        label: "Retrying",
      };
    default:
      return {
        icon: "clock",
        color: "#6B7280", // gray-500
        bgColor: "#F3F4F6", // gray-100
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

// ============= Transaction Type Detection =============

/**
 * Detect if a transaction is for data (with fallback for incorrect backend type)
 * Matches frontend isDataTransaction()
 */
export function isDataTransaction(transaction: Transaction): boolean {
  // First check the related.type from backend
  if (transaction.related?.type?.toLowerCase() === "data") {
    return true;
  }

  // Fallback: Check productCode patterns that indicate data products
  const productCode = (transaction.productCode || "").toUpperCase();
  const dataPatterns = ["DATA", "GB", "MB", "TB", "BUNDLE"];

  return dataPatterns.some((pattern) => productCode.includes(pattern));
}

/**
 * Check if a transaction is a refund
 * Credit transaction for a failed/reversed topup
 */
export function isRefundTransaction(transaction: Transaction): boolean {
  const isCredit = transaction.direction === "credit";
  const relatedStatus = transaction.related?.status?.toLowerCase();
  
  return (
    isCredit &&
    transaction.relatedType === "topup_request" &&
    (relatedStatus === "failed" || relatedStatus === "reversed")
  );
}

// ============= Display Labels =============

/**
 * Get user-friendly display status
 * Handles refund as "Refunded" not "Failed"
 * Matches frontend getDisplayStatus()
 */
export function getDisplayStatus(transaction: Transaction): string {
  const status = transaction.related?.status?.toLowerCase() || "";
  const isCredit = transaction.direction === "credit";
  const isDebit = transaction.direction === "debit";

  // Credit transaction (refund) for failed/reversed topup shows "Refunded"
  if (isCredit && (status === "failed" || status === "reversed")) {
    return "Refunded";
  }

  // Debit transaction with "reversed" shows "Failed" (it failed, then was refunded)
  if (isDebit && status === "reversed") {
    return "Failed";
  }

  // Default: capitalize the original status
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get transaction type label (e.g., "Airtime Purchase", "Data Purchase", "Refund")
 * Matches frontend getTransactionTypeLabel()
 */
export function getTransactionTypeLabel(transaction: Transaction): string {
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

  // Topup request
  if (transaction.relatedType === "topup_request") {
    return isDataTransaction(transaction) ? "Data Purchase" : "Airtime Purchase";
  }

  // Incoming payment
  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }

  // Outgoing payment
  if (transaction.relatedType === "outgoing_payment") {
    return "Wallet Debit";
  }

  // Referral withdrawal
  if (transaction.relatedType === "referral_withdrawal") {
    return "Referral Bonus";
  }

  // Default based on direction
  return isCredit ? "Deposit" : "Withdrawal";
}

/**
 * Get transaction description (subtitle text)
 * Matches frontend getTransactionDescription()
 */
export function getTransactionDescription(transaction: Transaction): string {
  const operatorCode = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
  const recipientPhone = transaction.related?.recipient_phone || "N/A";

  if (transaction.relatedType === "topup_request") {
    const productType = isDataTransaction(transaction) ? "Data" : "Airtime";
    return `${productType} to ${operatorCode} - ${recipientPhone}`;
  }

  if (transaction.relatedType === "incoming_payment") {
    return "Wallet top-up";
  }

  if (transaction.relatedType === "outgoing_payment") {
    return "Admin deduction";
  }

  if (transaction.relatedType === "referral_withdrawal") {
    return "Bonus added to wallet";
  }

  return transaction.note || transaction.method || "";
}

/**
 * Get the transaction title for list display
 * For airtime: "MTN ₦100 Airtime"
 * For data: productCode
 */
export function getTransactionTitle(transaction: Transaction): string {
  const isDebit = transaction.direction === "debit";

  if (isDebit && transaction.relatedType === "topup_request") {
    if (isDataTransaction(transaction)) {
      // Data: Show product code as title
      return transaction.productCode || "Data Bundle";
    } else {
      // Airtime: Show "OPERATOR ₦amount Airtime"
      const operator = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
      const denom = transaction.denomAmount
        ? `₦${transaction.denomAmount.toLocaleString()}`
        : "";
      return `${operator} ${denom} Airtime`.trim();
    }
  }

  if (transaction.relatedType === "incoming_payment") {
    return "Incoming Payment";
  }

  if (transaction.relatedType === "outgoing_payment") {
    return "Wallet Debit";
  }

  // Fallback
  return (
    transaction.related?.operatorCode ||
    transaction.relatedType?.replace("_", " ") ||
    "Transaction"
  );
}

/**
 * Get the transaction subtitle for list display
 */
export function getTransactionSubtitle(transaction: Transaction): string {
  if (transaction.relatedType === "topup_request") {
    const operator = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
    const phone = transaction.related?.recipient_phone || "N/A";
    return `to ${operator} (${phone})`;
  }

  if (transaction.relatedType === "incoming_payment") {
    return "Wallet top-up";
  }

  if (transaction.relatedType === "outgoing_payment") {
    return "Admin deduction";
  }

  return transaction.reference || "";
}

// ============= Formatting Helpers =============

/**
 * Format date for display
 * Matches frontend formatDate()
 */
export function formatTransactionDate(date: Date | string | undefined): string {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (dateObj instanceof Date && isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `₦${Math.abs(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get cashback used display
 */
export function getCashbackUsed(transaction: Transaction): string {
  if (transaction.cashbackUsed && transaction.cashbackUsed > 0) {
    return formatCurrency(transaction.cashbackUsed);
  }
  return "₦0.00";
}

/**
 * Get service type label with smart detection
 */
export function getServiceTypeLabel(transaction: Transaction): string {
  return isDataTransaction(transaction) ? "Data" : "Airtime";
}

/**
 * Get the formatted amount for receipt display
 * Matches frontend logic for airtime/data/refund
 */
export function getFormattedAmount(transaction: Transaction): string {
  const isCredit = transaction.direction === "credit";
  const isRefund = isRefundTransaction(transaction);
  const isTopup = transaction.relatedType === "topup_request";
  const isData = isDataTransaction(transaction);

  if (isRefund) {
    // Refund: Show the refunded amount
    return formatCurrency(transaction.amount);
  }

  if (isTopup && !isCredit) {
    if (isData) {
      // Data: Show product code/name
      return transaction.productCode || "Data Bundle";
    } else {
      // Airtime: Show "MTN ₦100 Airtime" format
      const operator = transaction.related?.operatorCode?.toUpperCase() || "Unknown";
      const denom = transaction.denomAmount
        ? `₦${transaction.denomAmount.toLocaleString()}`
        : "";
      return `${operator} ${denom} Airtime`.trim();
    }
  }

  // Other transactions: Show currency amount
  return formatCurrency(transaction.amount);
}

// ============= Operator Logo Mapping =============

const OPERATOR_LOGOS: Record<string, string> = {
  MTN: "/assets/networks/mtn.png",
  AIRTEL: "/assets/networks/airtel.png",
  GLO: "/assets/networks/glo.png",
  "9MOBILE": "/assets/networks/9mobile.png",
  ETISALAT: "/assets/networks/9mobile.png",
};

/**
 * Get operator logo URL
 */
export function getOperatorLogo(transaction: Transaction): string | undefined {
  const operatorCode = transaction.related?.operatorCode?.toUpperCase();
  if (operatorCode && OPERATOR_LOGOS[operatorCode]) {
    return OPERATOR_LOGOS[operatorCode];
  }
  return undefined;
}
