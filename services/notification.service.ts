import apiClient from '@/lib/api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const LAST_FCM_TOKEN_KEY = 'last_fcm_token';

// Check if we are in Expo Go
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Configure notification handler (foreground behavior)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export class NotificationService {
  
  // Request permissions
  static async requestPermissions(): Promise<boolean> {
    if (isExpoGo) {
        console.log('Skipping permission request in Expo Go');
        return false;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  // Get Expo Push Token
  static async getExpoPushToken(): Promise<string | null> {
    if (isExpoGo) return null;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Get Device Push Token (FCM for Android, APNs for iOS)
  static async getDevicePushToken(): Promise<string | null> {
    if (isExpoGo) return null;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = await Notifications.getDevicePushTokenAsync();
      console.log('Device Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  // Sync token with backend
  static async syncToken(): Promise<void> {
    if (isExpoGo) return;

    try {
      // Prioritize device token (FCM/APNs) for native push, fallback to Expo token if needed
      // But typically for "remote notifications" via Expo, getDevicePushTokenAsync() is what we want for direct FCM
      // OR getExpoPushTokenAsync() if using Expo's push service. 
      // The snippet used getDevicePushTokenAsync, so assuming direct FCM/APNs.
      const currentToken = await this.getDevicePushToken() || await this.getExpoPushToken();
      
      if (!currentToken) return;

      const lastToken = await AsyncStorage.getItem(LAST_FCM_TOKEN_KEY);

      if (currentToken === lastToken) {
        console.log('Token unchanged, skipping sync');
        return;
      }

      console.log('Syncing new token:', currentToken);

      await apiClient.post('/notifications/tokens', {
        token: currentToken,
        platform: Platform.OS,
      });

      await AsyncStorage.setItem(LAST_FCM_TOKEN_KEY, currentToken);
    } catch (error) {
      console.error('Failed to sync token:', error);
    }
  }

  // Configure Android notification channel
  static async configureAndroidChannel() {
    if (isExpoGo) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });
    }
  }

  // Schedule local notification
  static async scheduleNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    if (isExpoGo) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true, // boolean | undefined in types? 'true' might be invalid string literal if strict. 
        // type definition says sound?: string | boolean | null. 'default' is string. boolean true is allowed sometimes?
        // Let's stick to true or 'default' if it complains.
      },
      trigger: trigger || null, // null = show immediately
    });
  }

  // Listen for notifications
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Cancel all notifications
  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get badge count (iOS)
  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Set badge count (iOS)
  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}
