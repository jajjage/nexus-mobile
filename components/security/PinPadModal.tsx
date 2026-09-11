import { darkColors, designTokens, lightColors } from "@/constants/palette";
import { useRouter } from "expo-router";
import { Delete, Eye, EyeOff, ScanFace } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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
  onBiometricPress?: () => void | Promise<void>;
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
  onBiometricPress,
}: PinPadModalProps) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const keyBackgroundColor = colorScheme === "dark" ? "#454a4d" : "#e7eaf0";
  const [pin, setPin] = useState("");
  const [isPinVisible, setIsPinVisible] = useState(false);
  const translateY = React.useRef(new Animated.Value(0)).current;
  const isDismissing = React.useRef(false);

  const animateDismiss = useCallback(() => {
    if (isLoading || isDismissing.current) return;

    isDismissing.current = true;
    Animated.timing(translateY, {
      toValue: Dimensions.get("window").height,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        isDismissing.current = false;
        return;
      }

      translateY.setValue(0);
      isDismissing.current = false;
      onClose();
    });
  }, [isLoading, onClose, translateY]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => visible && !isLoading,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          visible &&
          !isLoading &&
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 120 || gestureState.vy > 0.8) {
            animateDismiss();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 260,
            mass: 0.8,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 260,
            mass: 0.8,
          }).start();
        },
      }),
    [animateDismiss, isLoading, translateY, visible]
  );

  // Clear PIN when modal opens
  useEffect(() => {
    if (visible) {
      setPin("");
      setIsPinVisible(false);
      translateY.setValue(0);
      isDismissing.current = false;
    }
  }, [translateY, visible]);

  // Handle number press
  const handleNumberPress = useCallback(
    (num: string) => {
      if (isLoading || pin.length >= PIN_LENGTH) return;

      const newPin = pin + num;
      setPin(newPin);

      // Auto-submit when PIN is complete
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          onSubmit(newPin);
          // Don't call onClose() here — let the parent control the modal
          // lifecycle. The parent closes via setShowPinModal(false) after
          // the async payment flow completes, preventing race conditions
          // where the screen unmounts mid-payment.
        }, 100);
      }
    },
    [pin, isLoading, onSubmit, onClose]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (isLoading || pin.length === 0) return;
    setPin(pin.slice(0, -1));
  }, [pin, isLoading]);

  // Handle manual submit (if needed, though we auto-submit)
  const handleSubmit = useCallback(() => {
    if (pin.length === PIN_LENGTH && !isLoading) {
      onSubmit(pin);
      animateDismiss();
    }
  }, [animateDismiss, pin, isLoading, onSubmit]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setPin("");
    animateDismiss();
  }, [animateDismiss, isLoading]);

  const handleForgotPin = useCallback(() => {
    if (isLoading) return;
    setPin("");
    animateDismiss();
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
  }, [animateDismiss, isLoading, router, returnRoute]);

  const renderPinField = () => (
    <View style={[styles.pinField, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.pinText, { color: colors.foreground }]}>
        {isPinVisible ? pin : "•".repeat(pin.length)}
      </Text>
      <Pressable
        onPress={() => setIsPinVisible((current) => !current)}
        disabled={isLoading}
        hitSlop={10}
        style={styles.eyeButton}
      >
        {isPinVisible ? (
          <EyeOff size={26} color={colors.textSecondary} />
        ) : (
          <Eye size={26} color={colors.textSecondary} />
        )}
      </Pressable>
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
        pressed && { opacity: 0.65 },
        style,
      ]}
    >
      <View style={[styles.keyCircle, { backgroundColor: keyBackgroundColor }]}>
        <Text style={[styles.keypadButtonText, { color: colors.foreground }]}>
          {num}
        </Text>
      </View>
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
      <View style={styles.overlay} collapsable={false}>
        {/* Backdrop - tapping here closes modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Modal content */}
        <Animated.View
          collapsable={false}
          style={[
            styles.container,
            { backgroundColor: colors.background },
            { transform: [{ translateY }] },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleHitArea}>
            <View style={[styles.sheetHandle, { backgroundColor: "#E69E19" }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title === "Enter PIN" ? "Enter Pin" : title}
            </Text>
          </View>

          {/* PIN field */}
          {renderPinField()}

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
              <View style={[styles.loadingIcon, { backgroundColor: "#EAF2FF" }]}>
                <ActivityIndicator size="large" color="#0B57D0" />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Verifying your PIN</Text>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Please wait a moment...</Text>
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
                <Pressable
                  onPress={onBiometricPress}
                  disabled={isLoading || !onBiometricPress}
                   style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.keyCircle, { backgroundColor: keyBackgroundColor }]}>
                    <ScanFace size={30} color={colors.foreground} />
                  </View>
                </Pressable>

                <KeypadButton num="0" onPress={() => handleNumberPress("0")} />

                <Pressable
                  onPress={handleDelete}
                  disabled={isLoading || pin.length === 0}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.keyCircle, { backgroundColor: keyBackgroundColor }]}>
                    <Delete size={28} color={colors.foreground} />
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable onPress={handleForgotPin} disabled={isLoading} style={styles.forgotButton}>
          <Text style={[styles.forgotText, { color: colors.destructive }]}>Forgot Pin?</Text>
          </Pressable>
          
          <SafeAreaView edges={['bottom']} />
        </Animated.View>
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
    paddingTop: designTokens.spacing.md,
    // paddingBottom handled by SafeAreaView
    height: "66%",
    minHeight: 680,
  },
  sheetHandle: {
    width: 110,
    height: 8,
    borderRadius: 4,
  },
  handleHitArea: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: designTokens.spacing.lg,
  },
  title: {
    fontSize: designTokens.fontSize["2xl"],
    fontWeight: "700",
    textAlign: "center",
  },
  pinField: {
    height: 70,
    borderWidth: 2,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
  },
  pinText: {
    fontSize: 34,
    fontWeight: "600",
    letterSpacing: 10,
  },
  eyeButton: {
    position: "absolute",
    right: 22,
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
    paddingVertical: designTokens.spacing.lg,
    gap: 10,
    height: 300, // Approximate height of keypad to keep layout stable
  },
  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingText: {
    fontSize: designTokens.fontSize.sm,
  },
  keypadContainer: {
    marginTop: 0,
    gap: 20,
    paddingBottom: designTokens.spacing.lg,
    alignItems: 'center', // Center the entire keypad
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center", // Center buttons row-wise
    gap: 20,
    width: '100%',
  },
  keypadButton: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  keyCircle: {
    width: 70,
    height: 70,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonText: {
    fontSize: 36,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 18,
    fontWeight: "600",
  },
  forgotButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
