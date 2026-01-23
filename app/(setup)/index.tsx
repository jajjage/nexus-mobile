import { useAuthContext } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function SetupIndex() {
  const { user, isLoading, updateUser } = useAuthContext();
  const theme = useTheme();
  const [biometricCheckDone, setBiometricCheckDone] = useState(false);
  const [localBiometricCompleted, setLocalBiometricCompleted] = useState(false);

  // Check local storage for biometric setup completion
  // This is a fallback in case backend doesn't persist hasBiometric
  useEffect(() => {
    const checkLocalBiometric = async () => {
      try {
        const completed = await AsyncStorage.getItem('biometric_setup_completed');
        if (completed === 'true') {
          setLocalBiometricCompleted(true);
          // Also sync to user state if not already set
          if (user && !user.hasBiometric) {
            updateUser({ hasBiometric: true });
          }
        }
      } catch (e) {
        console.error('[SetupIndex] Error checking local biometric state:', e);
      } finally {
        setBiometricCheckDone(true);
      }
    };
    
    if (user) {
      checkLocalBiometric();
    } else {
      setBiometricCheckDone(true);
    }
  }, [user]);

  if (isLoading || !biometricCheckDone) {
    return (
        <View style={{flex:1, justifyContent:'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator color={theme.colors.primary} />
        </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Step 1: Transaction PIN
  if (!user.hasPin) {
    return <Redirect href="/(setup)/set-pin" />;
  }
  
  // Step 2: App Passcode (Soft Lock)
  if (!user.hasPasscode) {
    return <Redirect href="/(setup)/set-passcode" />;
  }
  
  // Step 3: Biometrics (optional but encouraged)
  // Check both backend state AND local storage
  const biometricSetupComplete = user.hasBiometric || localBiometricCompleted;
  if (!biometricSetupComplete) {
    return <Redirect href="/(setup)/enable-biometric" />;
  }
  
  // All setup steps complete - redirect to dashboard
  return <Redirect href="/(tabs)" />;
}
