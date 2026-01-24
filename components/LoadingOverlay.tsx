import { darkColors, lightColors } from "@/constants/palette";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    Modal,
    StyleSheet,
    View,
    useColorScheme,
} from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
}: LoadingOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Create pulsating animation
      const pulseAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.5,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
          ]),
          Animated.sequence([
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.5,
                duration: 1000,
                useNativeDriver: true,
              }),
          ])
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        scaleAnim.setValue(1);
        opacityAnim.setValue(0.5);
      };
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
          {/* Pulse Effect */}
          <Animated.View
            style={[
              styles.circle,
              {
                backgroundColor: colors.primary,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo-3.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.2)', // Very subtle background
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});
