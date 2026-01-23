import { useAuthContext } from '@/context/AuthContext';
import { notificationService } from '@/services/mobile-notification.service';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export function useMobileFcm() {
  // Use AuthContext directly since useAuth might be complex or not exposing exactly what we need for "isAuthenticated" as a simple boolean
  // Wait, in AuthContext.tsx:
  // export function AuthProvider({ children }: { children: ReactNode }) {
  //   const [user, setUser] = useState<User | null>(null);
  // ...
  // So checking if `user` is not null is a good proxy for isAuthenticated.
  
  const { user } = useAuthContext();
  const isAuthenticated = !!user;

  // Determine if running inside Expo Go (SDK 53+ removed push support)
  const isExpoGo =
    Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

  // 1. Sync on Mount (if logged in) - skip in Expo Go
  useEffect(() => {
    if (isAuthenticated && !isExpoGo) {
      notificationService.syncToken();
    } else if (isExpoGo && isAuthenticated) {
      console.log(
        '[useMobileFcm] Skipping FCM sync in Expo Go. Use a development build for push notifications.'
      );
    }
  }, [isAuthenticated]);

  // 2. Sync on App Resume (Background -> Foreground) - skip in Expo Go
  useEffect(() => {
    if (isExpoGo) return; // nothing to do in Expo Go

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
