import { useTheme } from "@/context/ThemeContext";
import { BankWithdrawalHistoryItem } from "@/types/agent.types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type BankWithdrawalStatus = BankWithdrawalHistoryItem["status"];

const STATUS_STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "processing", label: "Processing" },
  { key: "success", label: "Paid" },
] as const;

type StepState = "complete" | "active" | "upcoming" | "failed";

function getStepState(
  status: BankWithdrawalStatus,
  index: number
): StepState {
  if (status === "pending") {
    return index === 0 ? "active" : "upcoming";
  }

  if (status === "processing") {
    if (index === 0) return "complete";
    if (index === 1) return "active";
    return "upcoming";
  }

  if (status === "success") {
    return index < 2 ? "complete" : "active";
  }

  if (index < 2) {
    return "complete";
  }

  return "failed";
}

export function getBankWithdrawalStatusLabel(status: BankWithdrawalStatus) {
  switch (status) {
    case "pending":
      return "Waiting for review";
    case "processing":
      return "Processing";
    case "success":
      return "Paid successfully";
    case "failed":
      return "Transfer failed";
    default:
      return "Status update";
  }
}

export function getBankWithdrawalStatusMessage(status: BankWithdrawalStatus) {
  switch (status) {
    case "pending":
      return "Your withdrawal will be processed in the next 24 hours.";
    case "processing":
      return "Your withdrawal request is currently being processed.";
    case "success":
      return "Your withdrawal was paid successfully.";
    case "failed":
      return "This withdrawal was not completed. Review the reason and submit a new request if needed.";
    default:
      return "";
  }
}

export function BankWithdrawalProgressTrack({
  status,
}: {
  status: BankWithdrawalStatus;
}) {
  const { colors } = useTheme();

  const getStepColors = (stepState: StepState) => {
    switch (stepState) {
      case "complete":
        return {
          fill: colors.primary,
          border: colors.primary,
          text: colors.foreground,
          line: colors.primary,
        };
      case "active":
        return {
          fill: status === "success" ? "#22c55e" : colors.primary,
          border: status === "success" ? "#22c55e" : colors.primary,
          text: colors.foreground,
          line: colors.primary,
        };
      case "failed":
        return {
          fill: "#ef4444",
          border: "#ef4444",
          text: "#ef4444",
          line: "#ef4444",
        };
      default:
        return {
          fill: "transparent",
          border: colors.border,
          text: colors.textSecondary,
          line: colors.border,
        };
    }
  };

  return (
    <View style={styles.trackRow}>
      {STATUS_STEPS.map((step, index) => {
        const stepState = getStepState(status, index);
        const palette = getStepColors(stepState);

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepBlock}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: palette.fill,
                    borderColor: palette.border,
                  },
                ]}
              />
              <Text style={[styles.stepLabel, { color: palette.text }]}>
                {stepState === "failed" ? "Failed" : step.label}
              </Text>
            </View>
            {index < STATUS_STEPS.length - 1 ? (
              <View
                style={[
                  styles.stepConnector,
                  {
                    backgroundColor:
                      getStepState(status, index + 1) === "upcoming"
                        ? colors.border
                        : palette.line,
                  },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepBlock: {
    width: 74,
    alignItems: "center",
    gap: 8,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginTop: 7,
    marginHorizontal: 6,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
});
