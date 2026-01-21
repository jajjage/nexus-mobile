# Mobile Login & FCM Token Flow Guide (Expo)

This guide details how to integrate Firebase Cloud Messaging (FCM) tokens into the authentication flow for a React Native/Expo app. It covers obtaining the token, syncing it to the backend, and configuring the notification icon for Android.

---

## 1. Dependencies

Install the required Expo packages:

```bash
npx expo install expo-notifications expo-device expo-constants
```

---

## 2. Logic Overview

The flow mirrors the web implementation but uses native APIs:

1.  **User Logs In**: Authentication succeeds.
2.  **Get Token**: App requests notification permissions and retrieves the FCM token.
3.  **Compare**: Check if this token matches the last one sent to the backend (stored in `AsyncStorage`).
4.  **Sync**: If different, send `POST /notifications/tokens` to the API.
5.  **Cache**: Save the new token to `AsyncStorage` to prevent future redundant API calls.

---

## 3. Implementation

### A. Token Service (`services/mobile-notification.service.ts`)

Create a service to handle the logic. This replaces the web's `notification.service.ts`.

```typescript
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/lib/api-client'; // Your Axios instance

const LAST_FCM_TOKEN_KEY = 'last_fcm_token';

// Configure notification handler (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * 1. Get Push Token from Expo/FCM
   */
  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Project ID is required for Expo Push Token (if using EAS)
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      // Get Token
      const tokenData = await Notifications.getDevicePushTokenAsync();
      // Or if using Expo Push Service:
      // const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  /**
   * 2. Sync Token with Backend
   * Checks AsyncStorage to avoid redundant calls
   */
  async syncToken(): Promise<try {
    const currentToken = await this.getPushToken();
    if (!currentToken) return;

    // Check last sent token
    const lastToken = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);

    // If exact match, skip sync
    if (currentToken === lastToken) {
      console.log('FCM token unchanged, skipping sync');
      return;
    }

    console.log('Syncing new FCM token:', currentToken);

    // Send to Backend
    await apiClient.post('/notifications/tokens', {
      token: currentToken,
      platform: Platform.OS, // 'ios' or 'android'
    });

    // Save to local storage
    await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, currentToken);
  } catch (error) {
    console.error('Failed to sync FCM token:', error);
  }
  },

  /**
   * 3. Clear Token (On Logout)
   */
  async clearToken(): Promise<void> {
     try {
       await AsyncStorage.removeItem(LAST_FCM_TOKEN_KEY);
       // Optional: Call backend to unlink if API supports it
       // await apiClient.post('/notifications/tokens/unlink');
     } catch (error) {
       console.error('Error clearing token:', error);
     }
  }
};
```

### B. Hook for Login Flow (`hooks/useMobileFcm.ts`)

Execute the sync automatically when the user is authenticated.

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/mobile-notification.service';
import { AppState } from 'react-native';

export function useMobileFcm() {
  const { isAuthenticated } = useAuth();

  // 1. Sync on Mount (if logged in)
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.syncToken();
    }
  }, [isAuthenticated]);

  // 2. Sync on App Resume (Background -> Foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        notificationService.syncToken();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);
}
```

### C. Usage in Root Layout

Call the hook in your main layout or root navigator.

```typescript
// app/_layout.tsx
export default function RootLayout() {
  useMobileFcm(); // <--- Initialize here

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

---

## 4. Android Notification Icon (White Icon)

Android requires a **transparent white-only icon** for the status bar. If you use a colored icon, it will appear as a gray square.

### Step 1: Create the Icon
1.  Design a flat icon (transparent background, white foreground).
2.  Save as `notification_icon.png`.
3.  Place it in your assets folder (e.g., `./assets/notification_icon.png`).

### Step 2: Configure `app.json`

Add the `notification` config under `expo`.

```json
{
  "expo": {
    "name": "Nexus App",
    "slug": "nexus-app",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/ic_notification.png",
          "color": "#e69e19"
        }
      ]
    ],
    "android": {
      "package": "com.nexus.app",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

*   `icon`: Path to your transparent white icon.
*   `color`: The accent color (your primary brand color `#e69e19`) used for the text/buttons in the notification shade.

---

## 5. Verification Checklist

1.  **Login**: Log into the mobile app.
2.  **Check Logs**: Confirm "Syncing new FCM token" appears in console.
3.  **Restart App**: Confirm "FCM token unchanged, skipping sync" appears (verifies cache works).
4.  **Send Test**: Trigger a notification from backend.
5.  **Check Icon**: Ensure the small icon in the status bar is **white** (not a gray square) and the accent color is correct.
