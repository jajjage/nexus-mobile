/**
 * useSecurityVerification Hook
 * Combines biometric and PIN verification for transaction security
 */

import { useCallback, useState } from "react";
import { useBiometricAuth } from "./useBiometric";

export interface VerificationResult {
  success: boolean;
  method: "biometric" | "pin" | null;
  pin?: string;
  verificationToken?: string;
  error?: string;
}

export interface UseSecurityVerificationOptions {
  onBiometricSuccess?: () => void;
  onBiometricFail?: () => void;
  onPinSubmit?: (pin: string) => void;
}

export function useSecurityVerification(
  options: UseSecurityVerificationOptions = {}
) {
  const { authenticate, checkBiometricSupport } = useBiometricAuth();
  const [showPinPad, setShowPinPad] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  /**
   * Start the verification flow
   * Attempts biometric first, falls back to PIN if unavailable or failed
   */
  const startVerification = useCallback(async (): Promise<VerificationResult> => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // Check if biometric is available
      const biometricSupport = await checkBiometricSupport();

      if (biometricSupport.hasHardware && biometricSupport.isEnrolled) {
        // Try biometric authentication
        const biometricSuccess = await authenticate();

        if (biometricSuccess) {
          options.onBiometricSuccess?.();
          setIsVerifying(false);
          return {
            success: true,
            method: "biometric",
            // In a real implementation, this would be a token from the backend
            verificationToken: "biometric-verified",
          };
        } else {
          // Biometric failed or cancelled, fall back to PIN
          options.onBiometricFail?.();
          setShowPinPad(true);
          setIsVerifying(false);
          return {
            success: false,
            method: null,
            error: "Biometric authentication failed. Please use PIN.",
          };
        }
      } else {
        // No biometric available, show PIN directly
        setShowPinPad(true);
        setIsVerifying(false);
        return {
          success: false,
          method: null,
          error: "Biometric not available. Please use PIN.",
        };
      }
    } catch (error) {
      console.error("Verification error:", error);
      // On any error, fall back to PIN
      setShowPinPad(true);
      setIsVerifying(false);
      return {
        success: false,
        method: null,
        error: "Authentication error. Please use PIN.",
      };
    }
  }, [authenticate, checkBiometricSupport, options]);

  /**
   * Handle PIN submission
   */
  const handlePinSubmit = useCallback(
    (pin: string): VerificationResult => {
      setIsVerifying(true);
      setVerificationError(null);

      // Basic validation
      if (pin.length !== 4) {
        setVerificationError("PIN must be 4 digits");
        setIsVerifying(false);
        return {
          success: false,
          method: "pin",
          error: "PIN must be 4 digits",
        };
      }

      options.onPinSubmit?.(pin);
      setShowPinPad(false);
      setIsVerifying(false);

      return {
        success: true,
        method: "pin",
        pin,
      };
    },
    [options]
  );

  /**
   * Close PIN pad modal
   */
  const closePinPad = useCallback(() => {
    setShowPinPad(false);
    setVerificationError(null);
  }, []);

  /**
   * Reset verification state
   */
  const resetVerification = useCallback(() => {
    setShowPinPad(false);
    setIsVerifying(false);
    setVerificationError(null);
  }, []);

  return {
    startVerification,
    handlePinSubmit,
    closePinPad,
    resetVerification,
    showPinPad,
    isVerifying,
    verificationError,
    setVerificationError,
  };
}
