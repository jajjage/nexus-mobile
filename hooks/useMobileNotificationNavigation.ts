import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function useMobileNotificationNavigation() {
  const router = useRouter();

  // Helper to handle the payload
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Extract IDs from payload (matches Web Service Worker logic)
    const { notificationId, transactionId } = data;
    
    console.log("[Mobile] Notification tapped:", data);

    if (notificationId) {
      // Navigate to Notifications Page
      router.push('/notifications');
    } else if (transactionId) {
      // Navigate to Transaction Details
      router.push({
        pathname: '/transaction-detail',
        params: { id: String(transactionId) }
      });
    }
  };

  useEffect(() => {
    // 1. Handle notification that OPENED the app (Cold Start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // 2. Listen for interactions while app is running (Foreground/Background)
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      subscription.remove();
    };
  }, []);
}
