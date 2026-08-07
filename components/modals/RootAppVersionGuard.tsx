import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import { AppUpgradeModal } from "./AppUpgradeModal";

interface RootAppVersionGuardProps {
  children: React.ReactNode;
}

export function RootAppVersionGuard({ children }: RootAppVersionGuardProps) {
  const versionCheck = useAppVersionCheck();

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
