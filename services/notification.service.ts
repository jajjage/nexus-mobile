import apiClient from "@/lib/api-client";
import {
  registerServiceWorker,
  requestAndGetFcmToken,
} from "@/lib/firebase-client";

/**
 * Storage key for tracking the last FCM token sent to backend
 * Prevents unnecessary API calls when token hasn't changed
 */
const LAST_FCM_TOKEN_KEY = "last_fcm_token";
const FCM_TOKEN_TIMESTAMP_KEY = "fcm_token_timestamp";

/**
 * Get the last FCM token saved in localStorage
 */
function getLastSentToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_FCM_TOKEN_KEY);
}

/**
 * Save the current FCM token to localStorage
 */
function saveLastSentToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_FCM_TOKEN_KEY, token);
  localStorage.setItem(FCM_TOKEN_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Clear the saved FCM token from localStorage
 */
function clearSavedToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_FCM_TOKEN_KEY);
  localStorage.removeItem(FCM_TOKEN_TIMESTAMP_KEY);
}

/**
 * Syncs the FCM token with the backend, checking localStorage to avoid redundant API calls
 * This is the main function to use - it handles token comparison and only sends if changed
 *
 * @param platform - Optional platform identifier (default: 'web')
 * @returns true if sync succeeded or token was already in sync, false if failed
 *
 * Flow:
 * 1. Get current FCM token from Firebase
 * 2. Check if it's different from the last sent token (via localStorage)
 * 3. Only send to backend if different
 * 4. Save the token to localStorage to prevent future redundant calls
 *
 * Called in these scenarios:
 * - User Registration: Establish first link between device and user
 * - User Login: Link this specific device to the user account
 * - App Open: Ensure token hasn't expired/refreshed
 * - App Lifecycle: Called on relevant user actions
 */
export async function syncFcmToken(platform: string = "web"): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    // 1. Register the service worker if not already done
    await registerServiceWorker();

    // 2. Get the current FCM token from Firebase
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;
    const currentToken = await requestAndGetFcmToken(vapidKey);

    if (!currentToken) {
      console.warn("No FCM token available for sync");
      return false;
    }

    // 3. Check if token is different from last sent token
    const lastSentToken = getLastSentToken();

    if (currentToken === lastSentToken) {
      console.log(
        "FCM token unchanged, skipping sync (already up-to-date with backend)"
      );
      return true; // Already synced, no action needed
    }

    console.log("New or updated FCM token detected, syncing with backend");

    // 4. Send to backend
    // The HTTP-only cookie with accessToken is automatically sent by apiClient
    const response = await apiClient.post("/notifications/tokens", {
      token: currentToken,
      platform,
    });

    if (response.status >= 200 && response.status < 300) {
      // 5. Save to localStorage so we don't spam the API
      saveLastSentToken(currentToken);
      console.log("FCM token synced successfully with backend", {
        token: currentToken.substring(0, 20) + "...",
        platform,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return false;
  } catch (err) {
    console.error("FCM token sync failed:", err);
    return false;
  }
}

/**
 * Legacy function name for backward compatibility
 * Use syncFcmToken() instead for new code
 *
 * @param platform - Optional platform identifier (default: 'web')
 * @returns true if registration succeeded, false otherwise
 */
export async function registerFcmToken(
  platform: string = "web"
): Promise<boolean> {
  return syncFcmToken(platform);
}

/**
 * Unlinks/Deletes the FCM token from the backend before logout
 * Important: Prevents notifications from being delivered to the next user on the same device
 *
 * Called in these scenarios:
 * - User Logout: Remove device token so next user doesn't get alerts
 * - User Account Deletion: Clean up token from system
 *
 * @returns true if unlinking succeeded, false if failed
 */
export async function unlinkFcmToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const lastToken = getLastSentToken();

    if (!lastToken) {
      console.log("No FCM token to unlink (user may not have registered)");
      return true;
    }

    console.log("Unlinking FCM token before logout");

    // Call backend to delete/deactivate the token
    const response = await apiClient.post("/notifications/tokens/unlink", {
      token: lastToken,
    });

    if (response.status >= 200 && response.status < 300) {
      // Clear from localStorage after successful unlink
      clearSavedToken();
      console.log("FCM token unlinked successfully");
      return true;
    }

    return false;
  } catch (err) {
    console.error("FCM token unlink failed:", err);
    // Clear localStorage anyway to ensure the token is cleared locally
    clearSavedToken();
    return false;
  }
}

/**
 * Request browser notification permission from user
 * Should be called before attempting to get FCM token
 *
 * @returns true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!("Notification" in window)) {
    console.warn("Notifications not supported in this browser");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Check if notifications are enabled for this user
 * @returns true if notifications are permitted, false otherwise
 */
export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;

  if (!("Notification" in window)) {
    return false;
  }

  return Notification.permission === "granted";
}
