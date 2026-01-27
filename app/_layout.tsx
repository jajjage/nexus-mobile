import '@/lib/crypto-polyfill';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';

import { darkColors, lightColors } from '@/constants/palette';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { SoftLockProvider } from '@/context/SoftLockContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useMobileNotificationNavigation } from '@/hooks/useMobileNotificationNavigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';


import { LoadingOverlay } from '@/components/LoadingOverlay';
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
SplashScreen.preventAutoHideAsync();

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
// Also handles the global loading overlay
function AppInitializer() {
  usePushNotifications();
  useMobileNotificationNavigation();
  
  const { isLoading } = useAuthContext();
  
  return <LoadingOverlay visible={isLoading} />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark, colors } = useTheme();

  // Set the root view background color to match the theme
  // This prevents white flashes during navigation transitions
  useEffect(() => {
    const setRootBackground = async () => {
      await SystemUI.setBackgroundColorAsync(colors.background);
    };
    setRootBackground();
  }, [colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode={isDark ? 'dark' : 'light'}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SoftLockProvider>
            <AppInitializer />
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <NavThemeProvider value={isDark ? NexusDarkTheme : NexusLightTheme}>
              <Stack screenOptions={{ animation: 'slide_from_right' }}>
                <Stack.Screen name="(setup)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
                <Stack.Screen name="transactions" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="airtime" options={{ headerShown: false }} />
                <Stack.Screen name="data" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
              <Toaster />
            </NavThemeProvider>
            </SoftLockProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}

