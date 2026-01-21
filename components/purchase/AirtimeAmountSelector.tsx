/**
 * AirtimeAmountSelector Component
 * Grid of preset amounts + custom input for airtime purchase
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface AirtimeAmountSelectorProps {
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
  disabled?: boolean;
}

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function AirtimeAmountSelector({
  selectedAmount,
  onSelect,
  minAmount = 50,
  maxAmount = 50000,
  disabled = false,
}: AirtimeAmountSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const handlePresetSelect = (amount: number) => {
    if (disabled) return;
    Haptics.selectionAsync();
    setShowCustom(false);
    setCustomAmount("");
    onSelect(amount);
  };

  const handleCustomToggle = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    setShowCustom(true);
    onSelect(0); // Clear selection
  };

  const handleCustomChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    setCustomAmount(numericText);

    const amount = parseInt(numericText, 10);
    if (!isNaN(amount) && amount >= minAmount && amount <= maxAmount) {
      onSelect(amount);
    }
  };

  const isCustomValid =
    customAmount.length > 0 &&
    parseInt(customAmount) >= minAmount &&
    parseInt(customAmount) <= maxAmount;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Select Amount
      </Text>

      {/* Preset Amounts Grid */}
      <View style={styles.grid}>
        {PRESET_AMOUNTS.map((amount) => {
          const isSelected = selectedAmount === amount && !showCustom;
          return (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              onPress={() => handlePresetSelect(amount)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.amountText,
                  {
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
                ]}
              >
                ₦{amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Amount Section */}
      <TouchableOpacity
        style={[
          styles.customButton,
          {
            backgroundColor: showCustom ? `${colors.primary}15` : colors.background,
            borderColor: showCustom ? colors.primary : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={handleCustomToggle}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {showCustom ? (
          <View style={styles.customInputContainer}>
            <Text style={[styles.currencyPrefix, { color: colors.foreground }]}>
              ₦
            </Text>
            <TextInput
              style={[styles.customInput, { color: colors.foreground }]}
              value={customAmount}
              onChangeText={handleCustomChange}
              placeholder="Enter amount"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
        ) : (
          <Text style={[styles.customText, { color: colors.textSecondary }]}>
            Custom Amount
          </Text>
        )}
      </TouchableOpacity>

      {/* Amount Range Hint */}
      {showCustom && (
        <Text
          style={[
            styles.hintText,
            {
              color: isCustomValid ? colors.success : colors.textTertiary,
            },
          ]}
        >
          Enter amount between ₦{minAmount.toLocaleString()} - ₦
          {maxAmount.toLocaleString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: designTokens.spacing.sm,
  },
  label: {
    fontSize: designTokens.fontSize.sm,
    marginBottom: designTokens.spacing.sm,
    marginLeft: designTokens.spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.sm,
  },
  amountButton: {
    width: "31%",
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    fontSize: designTokens.fontSize.base,
    fontWeight: "600",
  },
  customButton: {
    marginTop: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  customText: {
    fontSize: designTokens.fontSize.base,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    fontSize: designTokens.fontSize.xl,
    fontWeight: "600",
    marginRight: designTokens.spacing.xs,
  },
  customInput: {
    flex: 1,
    fontSize: designTokens.fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 100,
  },
  hintText: {
    fontSize: designTokens.fontSize.xs,
    marginTop: designTokens.spacing.xs,
    marginLeft: designTokens.spacing.xs,
    textAlign: "center",
  },
});
