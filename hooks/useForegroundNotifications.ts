// hooks/useForegroundNotifications.ts
"use client";

import { getFirebaseApp } from "@/lib/firebase-client";
import { getMessaging, onMessage } from "firebase/messaging";
import { useEffect } from "react";
import { toast } from "sonner";

export function useForegroundNotifications() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // 1. Get the app instance
    const app = getFirebaseApp();
    if (!app) return; // Guard clause in case init failed

    try {
      const messaging = getMessaging(app);

      // 2. Listen for messages while app is open
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("[Foreground] Message received:", payload);

        const notificationTitle =
          payload.notification?.title || "New Notification";
        const notificationBody =
          payload.notification?.body || "You have a new notification";
        const notificationId = payload.data?.notificationId || "";

        // Show toast notification
        toast.success(notificationBody, {
          duration: 5000,
          position: "top-right",
          description: notificationId
            ? "Click notification center to view details"
            : undefined,
        });

        // Also try to show system notification if permission is granted
        if (
          Notification.permission === "granted" &&
          "serviceWorker" in navigator
        ) {
          navigator.serviceWorker.ready.then((registration) => {
            try {
              registration.showNotification(notificationTitle, {
                body: notificationBody,
                icon:
                  payload.notification?.image ||
                  "/images/notification-icon.png",
                badge: "/images/notification-badge.png",
                tag: notificationId || "foreground-notification",
                data: {
                  notificationId: notificationId,
                  ...payload.data,
                },
              });
              console.log(
                "[Foreground] System notification shown for ID:",
                notificationId
              );
            } catch (error) {
              console.error(
                "[Foreground] Failed to show system notification:",
                error
              );
            }
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error(
        "[Foreground] Error setting up foreground listener:",
        error
      );
    }
  }, []);
}
