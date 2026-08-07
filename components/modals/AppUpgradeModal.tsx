import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { AppVersionInfo } from "@/types/app-version.types";
import { Check, Layers, PieChart } from "lucide-react-native";

interface AppUpgradeModalProps {
  visible: boolean;
  isMandatory: boolean;
  versionInfo: AppVersionInfo | null;
  onSkip: () => void;
  onUpgrade: () => void;
}

// Emil: Strong ease-out for UI interactions — starts fast, feels responsive
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// Emil: Stagger delays should be 30-80ms between items
const STAGGER_DELAY = 50;

export function AppUpgradeModal({
  visible,
  isMandatory,
  versionInfo,
  onSkip,
  onUpgrade,
}: AppUpgradeModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Staggered entrance animations — each element fades + slides in sequentially
  const graphicAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const releaseAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  // Floating cards — individual staggered entrance
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const card4Anim = useRef(new Animated.Value(0)).current;

  // Button press feedback — Emil: scale(0.97) on active, 160ms ease-out
  const skipPressAnim = useRef(new Animated.Value(1)).current;
  const upgradePressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset all
      [
        graphicAnim,
        titleAnim,
        subtitleAnim,
        releaseAnim,
        buttonsAnim,
        card1Anim,
        card2Anim,
        card3Anim,
        card4Anim,
      ].forEach((a) => a.setValue(0));

      // Emil: Stagger entrance — each element animates in with 50ms delay after the previous
      // Duration 250ms with ease-out for that responsive, immediate feedback feel
      const createEntrance = (anim: Animated.Value, delay: number) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 250,
          delay,
          easing: EASE_OUT,
          useNativeDriver: true,
        });

      // Main content stagger
      Animated.parallel([
        createEntrance(graphicAnim, 0),
        createEntrance(titleAnim, STAGGER_DELAY * 1),
        createEntrance(subtitleAnim, STAGGER_DELAY * 2),
        createEntrance(releaseAnim, STAGGER_DELAY * 3),
        createEntrance(buttonsAnim, STAGGER_DELAY * 4),
      ]).start();

      // Floating cards stagger — slightly delayed after graphic appears
      // Emil: Decorative elements can have slightly longer, more playful timing
      const cardBaseDelay = 200;
      Animated.parallel([
        createEntrance(card1Anim, cardBaseDelay),
        createEntrance(card2Anim, cardBaseDelay + STAGGER_DELAY),
        createEntrance(card3Anim, cardBaseDelay + STAGGER_DELAY * 2),
        createEntrance(card4Anim, cardBaseDelay + STAGGER_DELAY * 3),
      ]).start();
    }
  }, [visible]);

  if (!visible || !versionInfo) return null;

  // Emil: Button press handlers — 160ms ease-out for responsive press feedback
  const handlePressIn = (anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 0.97,
      duration: 160,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  };

  // Emil: Never animate from scale(0) — start from 0.95 with opacity 0
  const createStaggerStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0], // Subtle 8px slide-up
        }),
      },
    ],
  });

  // Floating card entrance — scale from 0.95 + opacity (never scale(0))
  const createCardStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  });

  return (
    <Animated.View style={styles.rootContainer}>
      {/* Pure white status bar — no dark area at top */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screenWrapper}>
          {/* Main Scrollable Content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: Math.max(insets.top, Platform.OS === "android" ? 24 : 0) + 12 },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Graphic Card */}
            <Animated.View
              style={[styles.graphicCard, { backgroundColor: colors.primary }, createStaggerStyle(graphicAnim)]}
            >
              <View style={styles.phoneIllustrationContainer}>
                {/* Tilted Smartphone Frame */}
                <View style={styles.phoneBody}>
                  <View style={styles.phoneScreen}>
                    <Image
                      source={require("@/assets/images/icon.png")}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Floating Card 1: Top-Left Orange NEW Badge */}
                <Animated.View
                  style={[
                    styles.floatingCard,
                    styles.cardTopLeft,
                    createCardStyle(card1Anim),
                  ]}
                >
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </Animated.View>

                {/* Floating Card 2: Top-Right Document Card */}
                <Animated.View
                  style={[
                    styles.floatingCard,
                    styles.cardTopRight,
                    createCardStyle(card2Anim),
                  ]}
                >
                  <Layers size={18} color={colors.primary} />
                </Animated.View>

                {/* Floating Card 3: Bottom-Left Pie Chart Card */}
                <Animated.View
                  style={[
                    styles.floatingCard,
                    styles.cardBottomLeft,
                    createCardStyle(card3Anim),
                  ]}
                >
                  <PieChart size={18} color={colors.primary} />
                </Animated.View>

                {/* Floating Card 4: Bottom-Right Green Checkmark Pill */}
                <Animated.View
                  style={[
                    styles.floatingCard,
                    styles.cardBottomRight,
                    createCardStyle(card4Anim),
                  ]}
                >
                  <View style={styles.checkCircle}>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Typography Section — staggered entrance */}
            <Animated.View
              style={[styles.textContainer, createStaggerStyle(titleAnim)]}
            >
              <Text style={styles.title}>
                {versionInfo.title || "We have an app upgrade for you"}
              </Text>
            </Animated.View>

            <Animated.View
              style={[styles.subtitleWrap, createStaggerStyle(subtitleAnim)]}
            >
              <Text style={styles.subtitle}>
                {versionInfo.subtitle ||
                  "We've made the app even better! Update now to enjoy a more seamless experience."}
              </Text>
            </Animated.View>

            <Animated.View
              style={[styles.releaseSection, createStaggerStyle(releaseAnim)]}
            >
              <Text style={styles.releaseTitle}>
                What's new in v{versionInfo.latestVersion}
              </Text>

              <Text style={styles.releaseNotes}>
                {versionInfo.releaseNotes}
              </Text>
            </Animated.View>
          </ScrollView>

          {/* Fixed Bottom Action Bar — Emil: buttons must feel responsive */}
          <Animated.View
            style={[
              styles.fixedBottomBar,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 16) },
              createStaggerStyle(buttonsAnim),
            ]}
          >
            {!isMandatory ? (
              /* Optional Update: Skip on Left, Upgrade Now on Right */
              <View style={styles.dualButtonRow}>
                {/* Skip Button with press feedback */}
                <Animated.View
                  style={[
                    styles.buttonFlex,
                    { transform: [{ scale: skipPressAnim }] },
                  ]}
                >
                  <Pressable
                    onPressIn={() => handlePressIn(skipPressAnim)}
                    onPressOut={() => handlePressOut(skipPressAnim)}
                    onPress={onSkip}
                    style={[styles.skipButton, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Text style={[styles.skipButtonText, { color: colors.primary }]}>Skip</Text>
                  </Pressable>
                </Animated.View>

                {/* Upgrade Button with press feedback */}
                <Animated.View
                  style={[
                    styles.buttonFlex,
                    { transform: [{ scale: upgradePressAnim }] },
                  ]}
                >
                  <Pressable
                    onPressIn={() => handlePressIn(upgradePressAnim)}
                    onPressOut={() => handlePressOut(upgradePressAnim)}
                    onPress={onUpgrade}
                    style={[styles.upgradeButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                  </Pressable>
                </Animated.View>
              </View>
            ) : (
              /* Mandatory Update: Single Full-Width Upgrade Now Button */
              <Animated.View
                style={{ transform: [{ scale: upgradePressAnim }] }}
              >
                <Pressable
                  onPressIn={() => handlePressIn(upgradePressAnim)}
                  onPressOut={() => handlePressOut(upgradePressAnim)}
                  onPress={onUpgrade}
                  style={[styles.upgradeButton, styles.fullWidthButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    zIndex: 999999,
    elevation: 999999,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
  },

  // ── Graphic Card ──────────────────────────────────────────────────────
  graphicCard: {
    width: "100%",
    height: 240,
    backgroundColor: "#E69E19",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible", // Allow floating cards to overflow
    marginTop: 8,
    marginBottom: 28,
  },
  phoneIllustrationContainer: {
    width: 170,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  phoneBody: {
    width: 96,
    height: 154,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-5deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  phoneScreen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  logoImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },

  // ── Floating Cards ────────────────────────────────────────────────────
  floatingCard: {
    position: "absolute",
    backgroundColor: "#EBF3FF",
    borderRadius: 12,
    padding: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTopLeft: {
    top: 10,
    left: -14,
    padding: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  newBadge: {
    backgroundColor: "#E69E19",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: "#E69E19",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardTopRight: {
    top: 8,
    right: -12,
  },
  cardBottomLeft: {
    bottom: 15,
    left: -12,
  },
  cardBottomRight: {
    bottom: 20,
    right: -14,
    padding: 4,
    backgroundColor: "#FFFFFF",
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Typography ────────────────────────────────────────────────────────
  textContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.3, // Tighter tracking for headings — feels more premium
  },
  subtitleWrap: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  releaseSection: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  releaseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },

  // ── Bottom Action Bar ─────────────────────────────────────────────────
  fixedBottomBar: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 20 : 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonFlex: {
    flex: 1,
  },
  skipButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FFF8EB",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E69E19",
  },
  upgradeButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E69E19",
    alignItems: "center",
    justifyContent: "center",
    // Emil: Subtle shadow on primary CTA gives depth
    shadowColor: "#E69E19",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fullWidthButton: {
    width: "100%",
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
