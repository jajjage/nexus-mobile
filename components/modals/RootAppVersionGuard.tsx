import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import { useAuthContext } from "@/context/AuthContext";
import { AppUpgradeModal } from "./AppUpgradeModal";

interface RootAppVersionGuardProps {
  children: React.ReactNode;
}

export function RootAppVersionGuard({ children }: RootAppVersionGuardProps) {
  const versionCheck = useAppVersionCheck();
  const { isLoading: isAuthLoading } = useAuthContext();

  // Hide the native splash screen ONLY when backend version check is completed and auth is loaded.
  // This extends the native splash screen over the network fetch phase to prevent white screen flickers.
  useEffect(() => {
    if (versionCheck.isChecked && !isAuthLoading) {
      void SplashScreen.hideAsync().catch((error) => {
        console.warn("[SplashScreen] Failed to hide splash screen after version check:", error);
      });
    }
  }, [versionCheck.isChecked, isAuthLoading]);

  // Whenever an app update screen is visible (mandatory or optional), block rendering of children
  // so SoftLock and Biometrics do not trigger or mount until the update screen is skipped/dismissed
  if (versionCheck.visible) {
    return (
      <View style={styles.blockContainer}>
        <AppUpgradeModal
          visible={versionCheck.visible}
          isMandatory={versionCheck.isMandatory}
          versionInfo={versionCheck.versionInfo}
          onSkip={versionCheck.handleSkip}
          onUpgrade={versionCheck.handleUpgrade}
        />
      </View>
    );
  }

  return <View style={styles.flexContainer}>{children}</View>;
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  blockContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
