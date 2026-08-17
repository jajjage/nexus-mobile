// hooks/useBiometric.ts
import * as LocalAuthentication from "expo-local-authentication";

let cachedSupport: {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
} | null = null;

export function useBiometricAuth() {
  const authenticate = async (): Promise<boolean> => {
    const { hasHardware, isEnrolled } = await checkBiometricSupport();

    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to continue",
      disableDeviceFallback: true,
      fallbackLabel: "Use PIN",
    });

    return result.success;
  };

  const checkBiometricSupport = async (forceRefresh = false): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> => {
    if (cachedSupport && !forceRefresh) {
      return cachedSupport;
    }

    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    cachedSupport = { hasHardware, isEnrolled, supportedTypes };
    return cachedSupport;
  };

  return { authenticate, checkBiometricSupport };
}
