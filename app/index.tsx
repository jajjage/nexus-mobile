import { useAuth } from "@/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const ONBOARDING_KEY = "@nexus_onboarding_complete";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingComplete(value === "true");
    } catch {
      setOnboardingComplete(false);
    }
  };

  if (isLoading || onboardingComplete === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E69E19" />
      </View>
    );
  }

  // Priority 1: Onboarding not complete -> Go to Onboarding
  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  // Priority 2: Not authenticated -> Go to Login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Priority 3: Authenticated -> Go to Dashboard
  return <Redirect href="/(tabs)" />;
}
