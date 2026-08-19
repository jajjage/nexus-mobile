import { darkColors, lightColors } from "@/constants/palette";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

export interface PortedNumberBypassProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function PortedNumberBypass({
  enabled,
  onChange,
  disabled = false,
}: PortedNumberBypassProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onChange(!enabled);
  };

  return (
    <View style={[styles.row, { opacity: disabled ? 0.6 : 1 }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="Bypass number validator for ported number"
        accessibilityState={{ checked: enabled, disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={[
          styles.checkbox,
          {
            backgroundColor: enabled ? colors.primary : "transparent",
            borderColor: enabled ? colors.primary : colors.textSecondary,
          },
        ]}
      >
        {enabled && <Check size={13} strokeWidth={3} color={colors.card} />}
      </Pressable>
      <Pressable disabled={disabled} onPress={handlePress} style={styles.labelPressable}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Bypass number validator for ported number
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minHeight: 24,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  labelPressable: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  label: {
    fontSize: 12.5,
    fontWeight: "500",
    lineHeight: 16,
  },
});
