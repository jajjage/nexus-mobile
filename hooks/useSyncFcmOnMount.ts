"use client";
import { syncFcmToken } from "@/services/notification.service";
import { useEffect } from "react";
import { useAuth } from "./useAuth";

/**
 * Hook to sync FCM token when app opens (if user is already logged in)
 * This ensures token hasn't expired/refreshed and device is properly linked
 *
 * Usage:
 * Call this hook in your root layout or main app component
 * It will automatically sync the token when the app mounts if user is authenticated
 *
 * Example:
 * export function RootLayout({ children }) {
 *   useSyncFcmOnMount();
 *   return <>{children}</>;
 * }
 */
export function useSyncFcmOnMount() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // 1. Sync on Mount
      syncFcmToken("web").catch(console.warn);

      // 2. Sync on Tab Focus (Replaces onTokenRefresh)
      // If the user leaves the tab open for days, this updates the token
      // when they click back on the window.
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          console.log("Tab active: verifying FCM token...");
          syncFcmToken("web").catch(console.warn);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [isLoading, isAuthenticated]);
}
