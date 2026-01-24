// components/dashboard/BalanceCard.tsx
// Following detailed Balance Card specs from user
import { useTheme } from "@/context/ThemeContext";
import { Eye, EyeOff, Plus } from "lucide-react-native";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface BalanceCardProps {
  balance: number;
  onAddMoney?: () => void;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
}

export function BalanceCard({ 
  balance, 
  onAddMoney,
  isBalanceVisible,
  onToggleBalance 
}: BalanceCardProps) {
  const { colors } = useTheme();
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        
        {/* Right: Add Money Button - Glassmorphism style */}
        <Pressable style={styles.addMoneyButton} onPress={onAddMoney}>
          <Plus size={14} color="#FFFBF5" />
          <Text style={styles.addMoneyText}>Add Money</Text>
        </Pressable>
      </View>

      {/* Balance Amount */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>
          {isBalanceVisible ? `₦${formatCurrency(balance)}` : "*****"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 6,
  },
  addMoneyText: {
    color: "#FFFBF5",
    fontSize: 12,
    fontWeight: "600",
  },
  balanceContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginTop: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
});

