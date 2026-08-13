import { darkColors, designTokens, lightColors } from "@/constants/palette";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";

interface PortedNumberBypassProps {
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
    Haptics.selectionAsync();
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
        {enabled && <Check size={15} strokeWidth={3} color={colors.card} />}
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
    minHeight: 48,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: designTokens.spacing.lg,
  },
  labelPressable: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  label: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
    lineHeight: 20,
  },
});
