/**
 * Transaction Timeline Component
 * Shows visual progress of transaction status
 * Aligned with frontend transaction-timeline.tsx
 */

import { useTheme } from "@/context/ThemeContext";
import { isRefundTransaction } from "@/lib/transactionUtils";
import { Transaction } from "@/types/wallet.types";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// ============= Types =============

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  timestamp?: string;
}

interface TransactionTimelineProps {
  status: string;
  createdAt: string;
  completedAt?: string;
  transactionType?: string;
  isRefund?: boolean;
}

// ============= Step Definitions =============

function getStepsForType(
  transactionType: string | undefined,
  createdAt: string,
  completedAt?: string
): TimelineStep[] {
  // Incoming payment - 2 steps
  if (transactionType === "incoming_payment") {
    return [
      {
        status: "received",
        label: "Payment Received",
        description: "Payment received successfully.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Wallet Credited",
        description: "Funds added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Referral withdrawal - 2 steps
  if (transactionType === "referral_withdrawal") {
    return [
      {
        status: "pending",
        label: "Withdrawal Initiated",
        description: "Referral bonus withdrawal requested.",
        timestamp: createdAt,
      },
      {
        status: "completed",
        label: "Funds Credited",
        description: "Bonus added to your wallet.",
        timestamp: completedAt,
      },
    ];
  }

  // Topup request - 3 steps
  if (transactionType === "topup_request") {
    return [
      {
        status: "pending",
        label: "Transaction Initiated",
        description: "We've received your request.",
        timestamp: createdAt,
      },
      {
        status: "processing",
        label: "Processing",
        description: "Working with provider to complete your top-up.",
      },
      {
        status: "completed",
        label: "Completed",
        description: "Transaction successful!",
        timestamp: completedAt,
      },
    ];
  }

  // Default - 2 steps
  return [
    {
      status: "pending",
      label: "Transaction Initiated",
      description: "Transaction has been initiated.",
      timestamp: createdAt,
    },
    {
      status: "completed",
      label: "Completed",
      description: "Transaction completed successfully.",
      timestamp: completedAt,
    },
  ];
}

// ============= Main Component =============

export function TransactionTimeline({
  status,
  createdAt,
  completedAt,
  transactionType,
  isRefund = false,
}: TransactionTimelineProps) {
  const { colors, isDark } = useTheme();
  const currentStatus = status.toLowerCase();
  const steps = getStepsForType(transactionType, createdAt, completedAt);

  // Determine step state (completed, active, upcoming, failed)
  const getStepState = (
    stepStatus: string,
    index: number
  ): "completed" | "active" | "upcoming" | "failed" => {
    // For refund transactions, all steps show as completed
    if (isRefund) {
      return "completed";
    }

    // Handle failed/cancelled/reversed states
    if (
      currentStatus === "failed" ||
      currentStatus === "cancelled" ||
      currentStatus === "reversed"
    ) {
      if (index === 0) return "completed"; // Initiated succeeded
      return "failed"; // Rest failed
    }

    // Handle completed/received/success
    if (
      currentStatus === "completed" ||
      currentStatus === "received" ||
      currentStatus === "success"
    ) {
      return "completed";
    }

    // For 2-step timelines
    if (steps.length === 2) {
      if (currentStatus === "pending") {
        return index === 0 ? "completed" : "active";
      }
      return index === 0 ? "completed" : "upcoming";
    }

    // For 3-step timelines (topup_request)
    if (steps.length === 3) {
      if (currentStatus === "pending") {
        return index === 0 ? "completed" : "upcoming";
      }
      if (currentStatus === "processing") {
        return index <= 1 ? "completed" : "active";
      }
      return "completed";
    }

    return "upcoming";
  };

  // Format date for display
  const formatStepDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-NG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Get icon for step state
  const renderStepIcon = (state: "completed" | "active" | "upcoming" | "failed") => {
    switch (state) {
      case "completed":
        return <CheckCircle2 size={20} color="#FFFFFF" />;
      case "active":
        return <Loader2 size={20} color={colors.primary} />;
      case "failed":
        return <XCircle size={20} color="#DC2626" />;
      default:
        return <Clock size={16} color={colors.textTertiary} />;
    }
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepState = getStepState(step.status, index);
        const isLast = index === steps.length - 1;

        // Dynamic styles based on theme and state
        const getDotStyle = () => {
          switch(stepState) {
            case "completed":
              return { backgroundColor: "#16A34A", borderColor: "#16A34A" };
            case "active":
              return { 
                backgroundColor: isDark ? `${colors.primary}20` : "#DBEAFE", 
                borderColor: colors.primary 
              };
            case "failed":
              return { backgroundColor: "#FEE2E2", borderColor: "#DC2626" };
            default: // upcoming
              return { 
                backgroundColor: isDark ? colors.card : "#F3F4F6", 
                borderColor: isDark ? colors.border : "#D1D5DB" 
              };
          }
        };

        const getConnectorStyle = () => {
           if (stepState === "completed") return { backgroundColor: "#16A34A" };
           if (stepState === "failed") return { backgroundColor: "#DC2626" };
           return { backgroundColor: isDark ? colors.border : "#D1D5DB" };
        };

        return (
          <View key={step.label} style={styles.stepRow}>
            {/* Dot and line column */}
            <View style={styles.dotColumn}>
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  getDotStyle()
                ]}
              >
                {renderStepIcon(stepState)}
              </View>

              {/* Connector line */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    getConnectorStyle()
                  ]}
                />
              )}
            </View>

            {/* Content column */}
            <View style={styles.contentColumn}>
              <Text
                style={[
                  styles.stepLabel,
                  { color: colors.foreground },
                  stepState === "failed" && styles.stepLabelFailed,
                ]}
              >
                {step.label}
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>{step.description}</Text>
              {step.timestamp && (
                <Text style={[styles.stepTimestamp, { color: colors.textTertiary }]}>
                  {formatStepDate(step.timestamp)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============= Styles =============

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 80,
  },
  dotColumn: {
    alignItems: "center",
    width: 40,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepLabelFailed: {
    color: "#DC2626",
  },
  stepDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  stepTimestamp: {
    fontSize: 11,
  },
});

// ============= Convenience Wrapper =============

interface TransactionTimelineFromTxProps {
  transaction: Transaction;
}

/**
 * Convenience wrapper that accepts a Transaction object
 */
export function TransactionTimelineFromTx({
  transaction,
}: TransactionTimelineFromTxProps) {
  const status = transaction.related?.status || "pending";
  const createdAt =
    typeof transaction.createdAt === "string"
      ? transaction.createdAt
      : transaction.createdAt.toISOString();

  return (
    <TransactionTimeline
      status={status}
      createdAt={createdAt}
      transactionType={transaction.relatedType}
      isRefund={isRefundTransaction(transaction)}
    />
  );
}
