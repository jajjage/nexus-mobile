import { useAuthContext } from '@/context/AuthContext';
import { NotificationService } from '@/services/notification.service';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export function usePushNotifications() {
  const { user } = useAuthContext();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.EventSubscription>(undefined);
  const responseListener = useRef<Notifications.EventSubscription>(undefined);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      // Skip setup in Expo Go - just log a message
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('[usePushNotifications] Skipping setup in Expo Go. Push notifications require a development build.');
        return;
      }

      // Configure Android channel
      await NotificationService.configureAndroidChannel();

      // Get tokens and set state
      const expoToken = await NotificationService.getExpoPushToken();
      if (isMounted) setExpoPushToken(expoToken);

      const deviceToken = await NotificationService.getDevicePushToken();
      if (isMounted) setDevicePushToken(deviceToken);

      // Sync with backend if user is logged in
      if (user) {
        await NotificationService.syncToken();
      }
    };

    setup();

    // Listen for notifications received while app is foreground
    notificationListener.current = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (isMounted) setNotification(notification);
      }
    );

    // Listen for user interaction with notification
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        // Handle notification tap
        // const data = response.notification.request.content.data;
        // Navigate or perform action based on data
      }
    );

    return () => {
      isMounted = false;
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [user]); // Re-run setup if user changes (log in/out) to sync token

  // Re-sync on app resume
  useEffect(() => {
     const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
     if (isExpoGo) return; // skip in Expo Go

     const subscription = AppState.addEventListener('change', (nextAppState) => {
       if (nextAppState === 'active' && user) {
         NotificationService.syncToken();
       }
     });

     return () => {
       subscription.remove();
     };
   }, [user]);

  return {
    expoPushToken,
    devicePushToken,
    notification,
    scheduleNotification: NotificationService.scheduleNotification,
    setBadgeCount: NotificationService.setBadgeCount,
  };
}
