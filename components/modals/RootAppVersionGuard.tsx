import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import { AppUpgradeModal } from "./AppUpgradeModal";

interface RootAppVersionGuardProps {
  children: React.ReactNode;
}

export function RootAppVersionGuard({ children }: RootAppVersionGuardProps) {
  const versionCheck = useAppVersionCheck();

  // If a mandatory update is required, block rendering of children (including Auth/SoftLock/Dashboard)
  if (versionCheck.visible && versionCheck.isMandatory) {
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

  return (
    <View style={styles.flexContainer}>
      {children}
      {versionCheck.visible && !versionCheck.isMandatory && (
        <AppUpgradeModal
          visible={versionCheck.visible}
          isMandatory={false}
          versionInfo={versionCheck.versionInfo}
          onSkip={versionCheck.handleSkip}
          onUpgrade={versionCheck.handleUpgrade}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  blockContainer: {
    flex: 1,
    backgroundColor: "#182125",
  },
});
