import { useEffect, useMemo, useState } from "react";

export type BiometricType = "face" | "fingerprint" | "mac" | "unknown";

interface BiometricState {
  type: BiometricType;
  label: string;
  isAvailable: boolean;
}

/**
 * Detects biometric type based on User Agent.
 * Runs synchronously so icon is correct on first render.
 */
function getBiometricTypeFromUA(): { type: BiometricType; label: string } {
  if (typeof navigator === "undefined") {
    return { type: "fingerprint", label: "Biometric" };
  }

  const ua = navigator.userAgent;

  // Apple Mobile Devices (iPhone, iPad) -> Face ID
  if (/iPhone|iPad|iPod/.test(ua)) {
    return { type: "face", label: "Face ID" };
  }

  // Mac Devices (MacBooks with TouchID)
  if (/Mac/.test(ua)) {
    return { type: "mac", label: "Touch ID" };
  }

  // Android Devices -> Generic "Biometric"
  if (/Android/.test(ua)) {
    return { type: "fingerprint", label: "Biometric" };
  }

  // Windows Hello / Generic
  return { type: "fingerprint", label: "Biometric" };
}

export function useBiometricType(): BiometricState {
  // Get type synchronously so it's correct on first render
  const detected = useMemo(() => getBiometricTypeFromUA(), []);

  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        if (
          window.PublicKeyCredential &&
          window.PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable
        ) {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsAvailable(available);
        }
      } catch (e) {
        console.error("Biometric availability check failed", e);
      }
    };

    checkAvailability();
  }, []);

  return {
    type: detected.type,
    label: detected.label,
    isAvailable,
  };
}
