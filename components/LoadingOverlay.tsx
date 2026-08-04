import { useTheme } from "@/context/ThemeContext";
import React, { useEffect } from "react";
import { Image, ImageRequireSource, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface LoadingLogoProps {
  visible: boolean;
  /** diameter of the logo image itself */
  diameter?: number;
  /** logo image (require) - defaults to project logo */
  logo?: ImageRequireSource;
  /** optional message - IGNORED in this version */
  message?: string | null;
  /** dim background - defaults to true so underlying screen content stays visible */
  dimBackground?: boolean;
}

/**
 * Pulsing logo loader.
 * - Shows the logo inside a white circular pulsing container.
 * - Rendered with a translucent backdrop so the underlying screen (e.g. Data Plans grid) remains visible.
 */
export function LoadingOverlay({
  visible,
  diameter = 80,
  logo = require("@/assets/images/logo-3.png"),
  dimBackground = true,
}: LoadingLogoProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Pulse animation: 1 -> 1.2 -> 1
      scale.value = withRepeat(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }
  }, [visible, scale]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Background circle size includes extra padding so logo isn't cramped
  const containerSize = diameter + 50;

  if (!visible) {
    return null;
  }

  // Translucent backdrop allows the underlying screen (Data Plans list) to stay visible
  const backdropColor = dimBackground
    ? isDark
      ? "rgba(0, 0, 0, 0.65)"
      : "rgba(0, 0, 0, 0.4)"
    : colors.background;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: backdropColor, zIndex: 999999 },
      ]}
      collapsable={false}
    >
      <View style={styles.center} pointerEvents="box-none" collapsable={false}>
        {/* Animated Container (White Circle + Pulse) */}
        <Animated.View
          collapsable={false}
          style={[
            styles.logoContainer,
            animatedContainerStyle,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              backgroundColor: colors.card,
            },
          ]}
        >
          {/* Logo Image (Full Size) */}
          <Image
            source={logo}
            resizeMode="contain"
            style={{ width: diameter, height: diameter }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
