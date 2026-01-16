// hooks/useBiometric.ts
import * as LocalAuthentication from "expo-local-authentication";

export function useBiometricAuth() {
  const authenticate = async (): Promise<boolean> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to continue",
      fallbackLabel: "Use PIN",
    });

    return result.success;
  };

  const checkBiometricSupport = async (): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
  }> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return { hasHardware, isEnrolled, supportedTypes };
  };

  return { authenticate, checkBiometricSupport };
}
