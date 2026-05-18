import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { triggerHaptic } from "@/utils/haptics";
import { useRouter } from "expo-router";
import { Delete, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PinPadModalProps {
  visible: boolean;
  onSubmit: (pin: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
  returnRoute?: string;
}

const PIN_LENGTH = 4;

export function PinPadModal({
  visible,
  onSubmit,
  onClose,
  title = "Enter PIN",
  subtitle = "Enter your 4-digit transaction PIN",
  isLoading = false,
  error,
  returnRoute,
}: PinPadModalProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const [pin, setPin] = useState("");

  // Clear PIN when modal opens
  useEffect(() => {
    if (visible) {
      setPin("");
    }
  }, [visible]);

  // Handle number press
  const handleNumberPress = useCallback(
    (num: string) => {
      if (isLoading || pin.length >= PIN_LENGTH) return;

      const newPin = pin + num;
      setPin(newPin);
      triggerHaptic.impact();

      // Auto-submit when PIN is complete
      if (newPin.length === PIN_LENGTH) {
        triggerHaptic.notification();
        setTimeout(() => {
          onSubmit(newPin);
          onClose(); // Close modal immediately as requested
        }, 100);
      }
    },
    [pin, isLoading, onSubmit, onClose]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (isLoading || pin.length === 0) return;
    setPin(pin.slice(0, -1));
    triggerHaptic.impact();
  }, [pin, isLoading]);

  // Handle manual submit (if needed, though we auto-submit)
  const handleSubmit = useCallback(() => {
    if (pin.length === PIN_LENGTH && !isLoading) {
      onSubmit(pin);
      onClose();
    }
  }, [pin, isLoading, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setPin("");
      onClose();
    }
  }, [isLoading, onClose]);

  const handleForgotPin = useCallback(() => {
    if (isLoading) return;
    setPin("");
    onClose();
    setTimeout(() => {
      if (returnRoute) {
        router.replace({
          pathname: "/(tabs)/profile/security/pin",
          params: { returnRoute },
        } as any);
      } else {
        router.navigate("/(tabs)/profile/security/pin");
      }
    }, 300);
  }, [isLoading, router, onClose, returnRoute]);

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

  const KeypadButton = ({
    num,
    onPress,
    style,
  }: {
    num: string;
    onPress: () => void;
    style?: any;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      hitSlop={8} // Increase touch target
      style={({ pressed }) => [
        styles.keypadButton,
        { backgroundColor: colors.card, borderColor: "transparent" }, // Transparent border for cleaner look
        pressed && { opacity: 0.7, backgroundColor: colors.muted },
        style,
      ]}
    >
      <Text style={[styles.keypadButtonText, { color: colors.foreground }]}>
        {num}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop - tapping here closes modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Modal content */}
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
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
            <Pressable
              onPress={handleClose}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* PIN Dots */}
          {renderDots()}

          {/* Error Message */}
          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : (
            <View style={{ height: 24 }} /> // Spacer to prevent jump
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Verifying PIN...
              </Text>
            </View>
          )}

          {/* Custom Numeric Keypad */}
          {!isLoading && (
            <View style={styles.keypadContainer}>
              {/* Row 1: 1 2 3 */}
              <View style={styles.keypadRow}>
                <KeypadButton num="1" onPress={() => handleNumberPress("1")} />
                <KeypadButton num="2" onPress={() => handleNumberPress("2")} />
                <KeypadButton num="3" onPress={() => handleNumberPress("3")} />
              </View>

              {/* Row 2: 4 5 6 */}
              <View style={styles.keypadRow}>
                <KeypadButton num="4" onPress={() => handleNumberPress("4")} />
                <KeypadButton num="5" onPress={() => handleNumberPress("5")} />
                <KeypadButton num="6" onPress={() => handleNumberPress("6")} />
              </View>

              {/* Row 3: 7 8 9 */}
              <View style={styles.keypadRow}>
                <KeypadButton num="7" onPress={() => handleNumberPress("7")} />
                <KeypadButton num="8" onPress={() => handleNumberPress("8")} />
                <KeypadButton num="9" onPress={() => handleNumberPress("9")} />
              </View>

              {/* Row 4: Forgot 0 Delete */}
              <View style={styles.keypadRow}>
                {/* Forgot PIN Button (Bottom Left) */}
                 <Pressable
                  onPress={handleForgotPin}
                  disabled={isLoading}
                   style={({ pressed }) => [
                    styles.keypadButton,
                    { backgroundColor: "transparent" },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                   <Text style={[styles.forgotText, { color: colors.primary, fontSize: 12, textAlign: 'center' }]}>
                    Forgot?
                  </Text>
                </Pressable>

                <KeypadButton num="0" onPress={() => handleNumberPress("0")} />

                <Pressable
                  onPress={handleDelete}
                  disabled={isLoading || pin.length === 0}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    { backgroundColor: "transparent" },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Delete size={28} color={colors.foreground} />
                </Pressable>
              </View>
            </View>
          )}
          
          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
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
    // paddingBottom handled by SafeAreaView
    minHeight: 450,
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
    marginTop: designTokens.spacing.md,
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
    height: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: designTokens.spacing.xl,
    gap: designTokens.spacing.md,
    height: 300, // Approximate height of keypad to keep layout stable
  },
  loadingText: {
    fontSize: designTokens.fontSize.sm,
  },
  keypadContainer: {
    marginTop: designTokens.spacing.xl,
    gap: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.xl,
    alignItems: 'center', // Center the entire keypad
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center", // Center buttons row-wise
    gap: 60, // Fixed gap to prevent scattering
    width: '100%',
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: designTokens.fontSize.sm,
    fontWeight: "600",
  },
});
