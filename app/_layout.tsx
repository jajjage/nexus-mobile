import '@/lib/crypto-polyfill';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkColors, lightColors } from '@/constants/palette';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { SoftLockProvider } from '@/context/SoftLockContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useAppRating } from '@/hooks/useAppRating';
import { useMobileNotificationNavigation } from '@/hooks/useMobileNotificationNavigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { installReferrerService } from '@/services/install-referrer.service';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { RootAppVersionGuard } from '@/components/modals';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';

/**
 * Nexus Light Theme for React Navigation
 * Uses the golden Nexus brand colors
 */
const NexusLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,           // #E69E19 - Nexus Gold
    background: lightColors.background,     // #FAFAFA
    card: lightColors.card,                 // #FAFAFA
    text: lightColors.foreground,           // #2E2E33
    border: lightColors.border,             // #D4DADC
    notification: lightColors.destructive,  // #E63636
  },
};

/**
 * Nexus Dark Theme for React Navigation
 * Uses the golden Nexus brand colors with dark backgrounds
 */
const NexusDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,            // #E69E19 - Nexus Gold
    background: darkColors.background,      // #182125
    card: darkColors.card,                  // #182125
    text: darkColors.foreground,            // #FCF3E1
    border: darkColors.border,              // #3A4346
    notification: darkColors.destructive,   // #E62E2E
  },
};

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Start with onboarding for new users
  initialRouteName: '(onboarding)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('[SplashScreen] Failed to prevent auto hide:', error);
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Helper component to initialize app-wide logic that depends on providers
function AppInitializer() {
  usePushNotifications();
  useMobileNotificationNavigation();
  useAppRating();
  
  const { isLoading } = useAuthContext();

  useEffect(() => {
    void installReferrerService.captureInstallReferrerOnce().catch((error) => {
      console.warn('[InstallReferrer] Startup capture failed:', error);
    });
  }, []);
  
  return <LoadingOverlay visible={isLoading} />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [fontLoadTimedOut, setFontLoadTimedOut] = useState(false);
  const fontsReady = loaded || fontLoadTimedOut || !!error;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.warn('[Fonts] Failed to load custom fonts; continuing with system fonts:', error);
    }
  }, [error]);

  // Hide splash screen as soon as fonts and root resources are ready
  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync().catch((hideError) => {
        console.warn('[SplashScreen] Failed to hide splash screen:', hideError);
      });
    }
  }, [fontsReady]);

  useEffect(() => {
    // Global safety fallback timer to force font ready state if font loading hangs
    const fallback = setTimeout(() => {
      setFontLoadTimedOut(true);
    }, 3000);

    return () => clearTimeout(fallback);
  }, []);

  if (!fontsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark, colors } = useTheme();

  // Set the root view background color to match the theme
  // This prevents white flashes during navigation transitions
  useEffect(() => {
    const setRootBackground = async () => {
      try {
        await SystemUI.setBackgroundColorAsync(colors.background);
      } catch (error) {
        console.warn('[SystemUI] Failed to set root background:', error);
      }
    };
    setRootBackground();
  }, [colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootAppVersionGuard>
              <SoftLockProvider>
                <View style={{ flex: 1, backgroundColor: colors.background }} collapsable={false}>
                  <AppInitializer />
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                  <NavThemeProvider value={isDark ? NexusDarkTheme : NexusLightTheme}>
                    <View style={{ flex: 1, backgroundColor: colors.background }} collapsable={false}>
                      <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }}>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
                        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="transactions" options={{ headerShown: false }} />
                        <Stack.Screen name="notifications" options={{ headerShown: false }} />
                        <Stack.Screen name="airtime" options={{ headerShown: false }} />
                        <Stack.Screen name="data" options={{ headerShown: false }} />
                        <Stack.Screen name="subscription" options={{ headerShown: false }} />
                        <Stack.Screen name="pay-bills" options={{ headerShown: false }} />
                        <Stack.Screen name="more-services" options={{ headerShown: false }} />
                        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                      </Stack>
                      <Toaster />
                    </View>
                  </NavThemeProvider>
                </View>
              </SoftLockProvider>
            </RootAppVersionGuard>
          </AuthProvider>
        </QueryClientProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
