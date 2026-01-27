import { useTheme } from "@/context/ThemeContext";
import React, { useEffect } from "react";
import { Image, ImageRequireSource, Modal, StyleSheet, View } from "react-native";
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
  /** dim background - IGNORED in this version */
  dimBackground?: boolean;
}

/**
 * Pulsing logo loader.
 * - Shows the logo inside a white circular pulsing container.
 * - The logo remains full size ("diameter") while the white background provides ample spacing.
 */
export function LoadingOverlay({
  visible,
  diameter = 80,
  logo = require("@/assets/images/logo-3.png"),
}: LoadingLogoProps) {
  const { colors } = useTheme();
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

  if (!visible) return null;

  // Background circle size includes extra padding so logo isn't cramped
  const containerSize = diameter + 50; 

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: 'transparent' }]}>
        <View style={styles.center} pointerEvents="box-none">
          {/* Animated Container (White Circle + Pulse) */}
          <Animated.View
            style={[
              styles.logoContainer,
              animatedContainerStyle,
              {
                width: containerSize,
                height: containerSize,
                borderRadius: containerSize / 2,
                backgroundColor: colors.card, // Match card color for the pulse circle
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Background color set dynamically via style prop
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    // Background color set dynamically via style prop
    justifyContent: "center",
    alignItems: "center",
    // Optional: Add shadow if desired for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
