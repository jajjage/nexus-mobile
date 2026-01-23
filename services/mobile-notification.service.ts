import apiClient from '@/lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const LAST_FCM_TOKEN_KEY = 'last_fcm_token';

// Check if we are in Expo Go
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Configure notification handler (foreground behavior) - ONLY if NOT in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const notificationService = {
  /**
   * 1. Get Push Token from Expo/FCM
   */
  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Expo Go (SDK 53+) does not support Android Push Notifications (remote)
    // We must return null to prevent a crash.
    if (isExpoGo) {
       console.log('FCM / Push Notifications are not supported in Expo Go. Please use a Development Build.');
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
  async syncToken(): Promise<void> {
    try {
      const currentToken = await this.getPushToken();
      if (!currentToken) return;

      // Check last sent token
      // We'll reuse tokenStorage for this simple key-value or use separate logic if preferred. 
      // Since tokenStorage is a wrapper around SecureStore, it's fine for tokens.
      // However the guide used AsyncStorage. Let's use AsyncStorage if we can, or SecureStore.
      // To match the guide's intent of "persistence", SecureStore is safer.
      // But for just checking "did we send this already", it doesn't strictly need to be secure, but consistency is good.
      // Actually SecureStore is async.
      
      // Let's stick to what we have available. We have `tokenStorage` in `lib/secure-store.ts`.
      // But `tokenStorage` might only have specific methods. Let's verify `lib/secure-store.ts` content again.
      // Ah, I saw `lib/secure-store.ts` is small. I should check if it has generic get/set.
      // If not, I'll import AsyncStorage directly for this non-sensitive "last sent token" check.
      
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
     } catch (error) {
       console.error('Error clearing token:', error);
     }
  }
};
