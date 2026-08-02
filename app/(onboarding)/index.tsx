// app/(onboarding)/index.tsx
import { lightColors } from "@/constants/palette";
import { triggerHaptic } from "@/utils/haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ONBOARDING_KEY = "@nexus_onboarding_complete";
const SWIPE_THRESHOLD = 30;

interface SlideData {
  id: string;
  image: any;
  title: string;
  description: string;
}

const slides: SlideData[] = [
  {
    id: "1",
    image: require("@/assets/images/onboarding-connectivity.png"),
    title: "Stay Connected",
    description: "Buy data bundles and airtime instantly for any network.",
  },
  {
    id: "2",
    image: require("@/assets/images/onboarding-utilities.png"),
    title: "Pay Bills Easily",
    description: "Settle electricity (KEDCO) and other utility bills in seconds.",
  },
  {
    id: "3",
    image: require("@/assets/images/onboarding-speed.png"),
    title: "Fast & Secure",
    description: "Enjoy lightning-fast transactions with bank-level security.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const animationDirectionRef = useRef<1 | -1>(1);

  const animateSlideContent = () => {
    contentOpacity.setValue(0.2);
    contentTranslateX.setValue(animationDirectionRef.current * 24);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateX, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateSlideContent();
  }, [currentIndex]);

  const goToIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, slides.length - 1));
    if (boundedIndex !== currentIndex) {
      triggerHaptic.impact();
      setCurrentIndex(boundedIndex);
    }
  };

  const completeOnboarding = async () => {
    triggerHaptic.notification();
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(auth)/register");
  };

  const handleNext = () => {
    triggerHaptic.impact();
    if (currentIndex < slides.length - 1) {
      animationDirectionRef.current = 1;
      goToIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    triggerHaptic.impact();
    completeOnboarding();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 8,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_THRESHOLD && currentIndex < slides.length - 1) {
            animationDirectionRef.current = 1;
            goToIndex(currentIndex + 1);
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD && currentIndex > 0) {
            animationDirectionRef.current = -1;
            goToIndex(currentIndex - 1);
            return;
          }
        },
      }),
    [currentIndex]
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hidden pre-loader so all images decode in memory instantly */}
      <View style={styles.preloadContainer} pointerEvents="none">
        {slides.map((slide) => (
          <Image key={slide.id} source={slide.image} style={styles.preloadImage} />
        ))}
      </View>

      <View style={styles.sliderViewport} {...panResponder.panHandlers}>
        <Animated.View
          collapsable={false}
          style={[
            styles.slide,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentTranslateX }],
            },
          ]}
        >
          <View style={styles.illustrationContainer}>
            <Image
              source={slides[currentIndex].image}
              style={{
                width: width * 0.75,
                height: width * 0.85,
              }}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{slides[currentIndex].title}</Text>
            <Text style={styles.description}>
              {slides[currentIndex].description}
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {renderDots()}

        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FontAwesome
            name="arrow-right"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  preloadContainer: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
  preloadImage: {
    width: 1,
    height: 1,
  },
  sliderViewport: {
    flex: 1,
    overflow: "hidden",
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: "#eceae4ff",
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 20,
  },
  textContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: lightColors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: lightColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: lightColors.background,
    zIndex: 20,
    elevation: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: lightColors.textSecondary,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: lightColors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: lightColors.border,
    width: 8,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightColors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: lightColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
