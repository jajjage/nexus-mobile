// components/dashboard/BalanceCard.tsx
import { useTheme } from "@/context/ThemeContext";
import * as Clipboard from "expo-clipboard";
import { Copy, Eye, EyeOff, Plus } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";

interface BalanceCardProps {
  balance: number;
  onAddMoney?: () => void;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  virtualAccountNumber?: string;
  virtualAccountBankName?: string;
}

export function BalanceCard({
  balance,
  onAddMoney,
  isBalanceVisible,
  onToggleBalance,
  virtualAccountNumber,
  virtualAccountBankName,
}: BalanceCardProps) {
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCopyVirtualAccount = async () => {
    if (!virtualAccountNumber) return;
    await Clipboard.setStringAsync(virtualAccountNumber);
    toast.success("Account number copied! 📋", {
      description: "Virtual Account Number copied to clipboard",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {/* Left: Balance Label + Eye Toggle */}
        <Pressable
          style={styles.balanceLabel}
          onPress={onToggleBalance}
        >
          <Text style={styles.labelText}>Available Balance</Text>
          {isBalanceVisible ? (
            <Eye size={16} color="rgba(255,251,245,0.9)" />
          ) : (
            <EyeOff size={16} color="rgba(255,251,245,0.9)" />
          )}
        </Pressable>

        {/* Right: Add Money Button */}
        {onAddMoney && (
          <Pressable style={styles.addMoneyButton} onPress={onAddMoney}>
            <Plus size={14} color="#FFFBF5" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </Pressable>
        )}
      </View>

      {/* Balance Amount */}
      <View style={styles.contentRow}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            {isBalanceVisible ? `₦${formatCurrency(balance)}` : "*****"}
          </Text>
        </View>
      </View>

      {/* Prominent Dedicated Virtual Account Banner for Instant Funding */}
      {Boolean(virtualAccountNumber) && (
        <Pressable
          style={styles.prominentVaContainer}
          onPress={handleCopyVirtualAccount}
        >
          <View style={styles.vaInfoLeft}>
            <Text style={styles.vaHeaderLabel}>DEPOSIT ACCOUNT</Text>
            <Text style={styles.vaBankAndNumberText}>
              {virtualAccountBankName ? `${virtualAccountBankName} • ` : ""}
              <Text style={styles.vaNumberHighlight}>{virtualAccountNumber}</Text>
            </Text>
          </View>

          <View style={styles.copyBadge}>
            <Copy size={14} color="#FFFFFF" />
            <Text style={styles.copyBadgeText}>Copy</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  balanceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelText: {
    color: "rgba(255,251,245,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  addMoneyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9999,
    gap: 4,
  },
  addMoneyText: {
    color: "#FFFBF5",
    fontSize: 11,
    fontWeight: "600",
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
    marginBottom: 12,
  },
  balanceContainer: {
    position: "relative",
    alignSelf: "flex-start",
    borderRadius: 4,
    overflow: "hidden",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  prominentVaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  vaInfoLeft: {
    flex: 1,
  },
  vaHeaderLabel: {
    color: "rgba(255, 251, 245, 0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  vaBankAndNumberText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  vaNumberHighlight: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  copyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
