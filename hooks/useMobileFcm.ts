import { useAuthContext } from '@/context/AuthContext';
import { notificationService } from '@/services/mobile-notification.service';
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
