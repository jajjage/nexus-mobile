/**
 * components/security/BiometricVerificationModal.tsx
 *
 * Modal UI for biometric transaction verification
 * Shows during checkout when user selects "Verify with Biometric"
 */

import { darkColors, lightColors } from "@/constants/palette";
import { useBiometricTransaction } from "@/hooks/useBiometricTransaction";
import { useBiometricType } from "@/hooks/useBiometricType";
import { CheckCircle, XCircle } from "lucide-react-native";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

interface BiometricVerificationModalProps {
  visible: boolean;
  onSuccess: (verificationToken: string) => void;
  onCancel: () => void;
  onFallbackToPin: () => void;
  transactionDescription?: string;
}

export function BiometricVerificationModal({
  visible,
  onSuccess,
  onCancel,
  onFallbackToPin,
  transactionDescription = "Verify Transaction",
}: BiometricVerificationModalProps) {
  const { authenticate, isLoading, error, reset } = useBiometricTransaction();
  const { label, isAvailable } = useBiometricType();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const [state, setState] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Auto-trigger biometric when modal opens
  useEffect(() => {
    if (!visible) {
      setState("idle");
      reset();
      return;
    }

    if (!isAvailable) {
      setState("error");
      return;
    }

    handleStartVerification();
  }, [visible]);

  const handleStartVerification = async () => {
    setState("loading");
    try {
      const result = await authenticate();
      setState("success");

      // Auto-close and call success after 1 second
      setTimeout(() => {
        onSuccess(result.verificationToken);
      }, 1000);
    } catch (err) {
      console.error("[BioModal] Verification error:", err);
      setState("error");
    }
  };

  const handleFallbackToPin = () => {
    reset();
    setState("idle");
    onFallbackToPin();
  };

  const handleRetry = async () => {
    await handleStartVerification();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 24,
            width: "85%",
            maxWidth: 350,
          }}
        >
          {state === "idle" && (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Ready to Verify
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  opacity: 0.7,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                {transactionDescription}
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleStartVerification}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFDF7",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Start {label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    flex: 1,
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state === "loading" && (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {transactionDescription}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  opacity: 0.7,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                Verify with {label}
              </Text>
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.foreground,
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                {isLoading ? "Verifying..." : "Waiting for confirmation..."}
              </Text>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle
                size={48}
                color="#4CAF50"
                style={{ alignSelf: "center", marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Verified!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  opacity: 0.7,
                  textAlign: "center",
                }}
              >
                {label} verification successful. Processing transaction...
              </Text>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle
                size={48}
                color={colors.destructive}
                style={{ alignSelf: "center", marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.foreground,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Verification Failed
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  opacity: 0.7,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                {error?.message ||
                  `${label} verification was cancelled or failed`}
              </Text>

              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleRetry}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFDF7",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFallbackToPin}
                  style={{
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Use PIN Instead
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
