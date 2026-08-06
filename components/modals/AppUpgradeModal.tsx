import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { AppVersionInfo } from "@/types/app-version.types";
import { Check, Sparkles, Smartphone, Layers, Award } from "lucide-react-native";

interface AppUpgradeModalProps {
  visible: boolean;
  isMandatory: boolean;
  versionInfo: AppVersionInfo | null;
  onSkip: () => void;
  onUpgrade: () => void;
}

export function AppUpgradeModal({
  visible,
  isMandatory,
  versionInfo,
  onSkip,
  onUpgrade,
}: AppUpgradeModalProps) {
  const { colors, isDark } = useTheme();

  // Emil Kowalski craft: Scale entrance from 0.95 + opacity 0 (never scale 0)
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible || !versionInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={isMandatory ? undefined : onSkip}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? colors.card : "#FFFFFF",
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Graphic Header Banner */}
          <View style={styles.graphicBanner}>
            <View style={styles.phoneGraphicContainer}>
              <View style={styles.phoneOuter}>
                <View style={styles.phoneScreen}>
                  <View style={styles.appLogoCircle}>
                    <Text style={styles.appLogoText}>N</Text>
                  </View>
                </View>
              </View>

              {/* Floating Graphic Cards */}
              <View style={[styles.floatingCard, styles.cardTopLeft]}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>

              <View style={[styles.floatingCard, styles.cardTopRight]}>
                <Layers size={16} color="#0066FF" />
              </View>

              <View style={[styles.floatingCard, styles.cardBottomRight]}>
                <View style={styles.checkCircle}>
                  <Check size={12} color="#FFFFFF" />
                </View>
              </View>

              <View style={[styles.floatingCard, styles.cardBottomLeft]}>
                <Award size={16} color="#E69E19" />
              </View>
            </View>
          </View>

          {/* Modal Content */}
          <View style={styles.contentBody}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {versionInfo.title || "We have an app upgrade for you"}
            </Text>

            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {versionInfo.subtitle ||
                "We've made the app even better! Update now to enjoy a more seamless experience."}
            </Text>

            <View style={styles.releaseSection}>
              <Text style={[styles.releaseHeader, { color: colors.foreground }]}>
                What's new in v{versionInfo.latestVersion}
              </Text>
              <ScrollView
                style={styles.notesScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.releaseNotes, { color: colors.mutedForeground }]}>
                  {versionInfo.releaseNotes}
                </Text>
              </ScrollView>
            </View>

            {/* Bottom Action Buttons */}
            <View style={styles.buttonRow}>
              {!isMandatory && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onSkip}
                  style={[
                    styles.skipButton,
                    {
                      backgroundColor: isDark ? "#2A3439" : "#EEF2F6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.skipButtonText,
                      { color: colors.primary || "#E69E19" },
                    ]}
                  >
                    Skip
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onUpgrade}
                style={[
                  styles.upgradeButton,
                  isMandatory && styles.fullWidthButton,
                  { backgroundColor: colors.primary || "#E69E19" },
                ]}
              >
                <Sparkles size={16} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 16,
  },
  graphicBanner: {
    height: 190,
    backgroundColor: "#0066FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  phoneGraphicContainer: {
    width: 140,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  phoneOuter: {
    width: 86,
    height: 135,
    backgroundColor: "#0052CC",
    borderRadius: 18,
    padding: 4,
    borderWidth: 2,
    borderColor: "#3385FF",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneScreen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#003D99",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  appLogoText: {
    color: "#0066FF",
    fontWeight: "900",
    fontSize: 20,
  },
  floatingCard: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTopLeft: {
    top: 10,
    left: -15,
  },
  newBadge: {
    backgroundColor: "#E69E19",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  cardTopRight: {
    top: 5,
    right: -10,
    padding: 8,
  },
  cardBottomLeft: {
    bottom: 15,
    left: -10,
    padding: 8,
  },
  cardBottomRight: {
    bottom: 20,
    right: -15,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  contentBody: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  releaseSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 22,
  },
  releaseHeader: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 70,
    width: "100%",
  },
  releaseNotes: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  upgradeButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  fullWidthButton: {
    flex: 1,
    width: "100%",
  },
  buttonIcon: {
    marginRight: 6,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
