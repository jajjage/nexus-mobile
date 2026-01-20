// components/dashboard/BalanceCard.tsx
// Following detailed Balance Card specs from user
import { lightColors } from "@/constants/palette";
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
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
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
    backgroundColor: lightColors.primary, // #E69E19
    paddingHorizontal: 16, // 24 on tablet+
    paddingVertical: 16,   // 24 on tablet+
    marginHorizontal: 16,
    // Rounded top corners only - connects to transaction card below
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // Shadow per specs
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10, // stacks above transaction history
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
    gap: 8, // gap-2
  },
  labelText: {
    color: "rgba(255,251,245,0.9)", // primary-foreground with 0.9 opacity
    fontSize: 12, // text-xs, 14 on tablet+
    fontWeight: "500",
  },
  addMoneyButton: {
    flexDirection: "row",
    alignItems: "center",
    // Glassmorphism style per specs
    backgroundColor: "rgba(255, 255, 255, 0.2)", // bg-white/20
    height: 36, // h-9, 40 on tablet+
    paddingHorizontal: 12, // px-3, 16 on tablet+
    borderRadius: 9999, // fully rounded / pill shape
    gap: 6, // gap-1.5, 8 on tablet+
  },
  addMoneyText: {
    color: "#FFFBF5", // primary-foreground
    fontSize: 12, // text-xs, 14 on tablet+
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
    fontSize: 24, // text-2xl, 30 on tablet+
    fontWeight: "700",
  },
});
