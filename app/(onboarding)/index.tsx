// app/(onboarding)/index.tsx
import { lightColors } from "@/constants/palette";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const ONBOARDING_KEY = "@nexus_onboarding_complete";

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
    description:
      "Buy data bundles and airtime instantly for any network.",
  },
  {
    id: "2",
    image: require("@/assets/images/onboarding-utilities.png"),
    title: "Pay Bills Easily",
    description:
      "Settle electricity (KEDCO) and other utility bills in seconds.",
  },
  {
    id: "3",
    image: require("@/assets/images/onboarding-speed.png"),
    title: "Fast & Secure",
    description:
      "Enjoy lightning-fast transactions with bank-level security.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ 
        index: currentIndex + 1, 
        animated: true 
      });
      // We manually update state here to ensure UI responsiveness if the user clicks fast,
      // but onMomentumScrollEnd will reconcile it.
      // Actually, relying on scroll end is safer to avoid sync issues, but immediate feedback is nice.
      // Let's rely on scroll end for the source of truth to avoid jumping.
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      {/* Illustration Container */}
      <View style={styles.illustrationContainer}>
        <Image
          source={item.image}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
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
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        getItemLayout={(data, index) => (
          {length: width, offset: width * index, index}
        )}
      />

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        {renderDots()}

        <Pressable onPress={handleNext} style={styles.nextButton}>
          <FontAwesome 
            name="arrow-right" 
            size={20} 
            color={lightColors.primaryForeground} 
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  slide: {
    width,
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
  illustration: {
    width: width * 0.75,
    height: width * 0.85,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: lightColors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: lightColors.border,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 24,
    color: lightColors.primaryForeground,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 28,
  },
});
