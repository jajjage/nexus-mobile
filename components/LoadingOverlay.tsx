/**
 * LoadingOverlay Component
 * Full-screen loading overlay with animated Nexus logo
 */

import { darkColors, designTokens, lightColors } from "@/constants/palette";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    Modal,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = "Processing...",
}: LoadingOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in the overlay
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Create pulsing animation for logo
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Animated Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require("@/assets/images/logo-3.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Loading Message */}
          <Text style={[styles.message, { color: colors.primaryForeground }]}>
            {message}
          </Text>

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            <LoadingDot delay={0} />
            <LoadingDot delay={150} />
            <LoadingDot delay={300} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// Animated loading dot component
function LoadingDot({ delay }: { delay: number }) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacityAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: opacityAnim,
          backgroundColor: lightColors.primary,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: designTokens.spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  message: {
    fontSize: designTokens.fontSize.lg,
    fontWeight: "600",
    textAlign: "center",
    marginTop: designTokens.spacing.md,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
