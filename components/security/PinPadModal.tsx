/**
 * PinPadModal Component
 * 4-digit PIN input modal using native keyboard
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { triggerHaptic } from "@/utils/haptics";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";

interface PinPadModalProps {
  visible: boolean;
  onSubmit: (pin: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
  returnRoute?: string; // Route to return to after PIN reset
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
  const inputRef = useRef<TextInput>(null);

  // Clear PIN when modal opens or when there's an error (failed attempt)
  useEffect(() => {
    if (visible) {
      setPin(""); // Clear PIN when modal opens
      // Auto-focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Clear PIN when an error is received (wrong PIN attempt)
  useEffect(() => {
    if (error) {
      setPin(""); // Clear PIN on error so user can re-enter
      inputRef.current?.focus();
    }
  }, [error]);

  const handlePinChange = useCallback(
    (text: string) => {
      if (isLoading) return;

      // Only allow numeric input
      const numericText = text.replace(/[^0-9]/g, "");
      
      if (numericText.length <= PIN_LENGTH) {
        setPin(numericText);
        triggerHaptic.impact();

        // Auto-submit when PIN is complete with small delay for visual feedback
        if (numericText.length === PIN_LENGTH) {
          triggerHaptic.notification();
          Keyboard.dismiss();
          // Small delay to allow dots to render before submission
          setTimeout(() => {
            onSubmit(numericText);
          }, 100);
        }
      }
    },
    [isLoading, onSubmit]
  );

  const handleClose = useCallback(() => {
    setPin("");
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleForgotPin = useCallback(() => {
    Keyboard.dismiss();
    setPin(""); // Clear any entered PIN
    onClose(); // Close the PIN modal first
    
    // Use setTimeout to ensure modal is closed before navigation
    setTimeout(() => {
      // Navigate to PIN reset screen
      if (returnRoute) {
        // Use replace to avoid stack issues
        router.replace({
          pathname: "/(tabs)/profile/security/pin",
          params: { returnRoute },
        } as any);
      } else {
        router.push("/(tabs)/profile/security/pin");
      }
    }, 300);
  }, [onClose, router, returnRoute]);

  const handleContainerPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop - tapping here closes modal */}
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        {/* Modal content - tapping here focuses input */}
        <Pressable 
          style={[styles.container, { backgroundColor: colors.background }]}
          onPress={() => {
            inputRef.current?.focus();
          }}
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

          {/* Hidden TextInput for native keyboard */}
          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            secureTextEntry
            autoFocus
            editable={!isLoading}
            style={styles.hiddenInput}
            selectionColor={colors.primary}
          />

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Verifying PIN...
              </Text>
            </View>
          )}

          {/* Instruction Text */}
          {!isLoading && (
            <Pressable 
              style={styles.instructionContainer}
              onPress={() => inputRef.current?.focus()}
            >
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                Tap anywhere to open keyboard
              </Text>
            </Pressable>
          )}

          {/* Forgot PIN Link */}
          <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPin}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot PIN?
            </Text>
          </TouchableOpacity>
        </Pressable>
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
  backdrop: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: designTokens.radius.xl,
    borderTopRightRadius: designTokens.radius.xl,
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xxl,
    minHeight: 300,
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
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: designTokens.spacing.xl,
    gap: designTokens.spacing.md,
  },
  loadingText: {
    fontSize: designTokens.fontSize.sm,
  },
  instructionContainer: {
    alignItems: "center",
    paddingVertical: designTokens.spacing.lg,
  },
  instructionText: {
    fontSize: designTokens.fontSize.sm,
    fontStyle: "italic",
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
