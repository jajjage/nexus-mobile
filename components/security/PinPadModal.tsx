/**
 * PinPadModal Component
 * 4-digit PIN input modal for transaction verification
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import * as Haptics from "expo-haptics";
import { Delete, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface PinPadModalProps {
  visible: boolean;
  onSubmit: (pin: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
}

const PIN_LENGTH = 4;
const KEYPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "delete"],
];

export function PinPadModal({
  visible,
  onSubmit,
  onClose,
  title = "Enter PIN",
  subtitle = "Enter your 4-digit transaction PIN",
  isLoading = false,
  error,
}: PinPadModalProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [pin, setPin] = useState("");

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isLoading) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (key === "delete") {
        setPin((prev) => prev.slice(0, -1));
      } else if (pin.length < PIN_LENGTH) {
        const newPin = pin + key;
        setPin(newPin);

        // Auto-submit when PIN is complete
        if (newPin.length === PIN_LENGTH) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSubmit(newPin);
        }
      }
    },
    [pin, isLoading, onSubmit]
  );

  const handleClose = useCallback(() => {
    setPin("");
    onClose();
  }, [onClose]);

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: PIN_LENGTH }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index < pin.length ? colors.primary : colors.border,
              transform: [{ scale: index < pin.length ? 1.1 : 1 }],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {KEYPAD.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key, keyIndex) => (
            <TouchableOpacity
              key={keyIndex}
              style={[
                styles.key,
                {
                  backgroundColor: key ? colors.muted : "transparent",
                },
              ]}
              onPress={() => key && handleKeyPress(key)}
              disabled={!key || isLoading}
              activeOpacity={0.7}
            >
              {key === "delete" ? (
                <Delete size={24} color={colors.foreground} />
              ) : (
                <Text style={[styles.keyText, { color: colors.foreground }]}>
                  {key}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {subtitle}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* PIN Dots */}
          {renderDots()}

          {/* Error Message */}
          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}

          {/* Keypad */}
          {renderKeypad()}

          {/* Forgot PIN Link */}
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot PIN?
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: designTokens.radius.xl,
    borderTopRightRadius: designTokens.radius.xl,
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: designTokens.spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
  },
  subtitle: {
    fontSize: designTokens.fontSize.sm,
    marginTop: designTokens.spacing.xs,
  },
  closeButton: {
    padding: designTokens.spacing.xs,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  errorText: {
    textAlign: "center",
    fontSize: designTokens.fontSize.sm,
    marginBottom: designTokens.spacing.md,
  },
  keypad: {
    gap: designTokens.spacing.sm,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: designTokens.spacing.sm,
  },
  key: {
    width: 80,
    height: 60,
    borderRadius: designTokens.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "600",
  },
  forgotLink: {
    alignItems: "center",
    marginTop: designTokens.spacing.lg,
  },
  forgotText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "500",
  },
});
