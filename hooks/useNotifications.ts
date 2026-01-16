import { notificationsService } from "@/services/notifications.service";
import { NotificationsResponse } from "@/types/notification.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  detail: (id: string) => [...notificationsKeys.all, "detail", id] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: () => notificationsService.unreadNotificationsCount(),
    staleTime: 10 * 1000, // 10 seconds - more frequent for bell icon
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useNotificationById(notificationId: string) {
  return useQuery({
    queryKey: notificationsKeys.detail(notificationId),
    queryFn: () => notificationsService.getNotificationById(notificationId),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!notificationId, // Only run query if notificationId is provided
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationsResponse, AxiosError<any>, string>({
    mutationFn: (notificationId) =>
      notificationsService.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Optimistic update: mark as read in cache
      await queryClient.cancelQueries({ queryKey: notificationsKeys.list() });
      const previousNotifications =
        queryClient.getQueryData<NotificationsResponse>(
          notificationsKeys.list()
        );

      if (previousNotifications?.data) {
        queryClient.setQueryData(notificationsKeys.list(), {
          ...previousNotifications,
          data: {
            ...previousNotifications.data,
            notifications: previousNotifications.data.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          },
        });
      }

      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("Notification marked as read");
    },
    onError: (error, _, context: any) => {
      // Restore previous data on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsKeys.list(),
          context.previousNotifications
        );
      }

      // Handle 404 errors gracefully
      if (error.response?.status === 404) {
        console.warn(
          "Notification not found - may have been deleted elsewhere"
        );
        toast.info("Notification was already deleted");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to mark notification as read";
        toast.error(errorMessage);
      }
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationsResponse, AxiosError<any>>({
    mutationFn: () => notificationsService.markAllAsRead(),
    onMutate: async () => {
      // Optimistic update: mark all as read
      await queryClient.cancelQueries({ queryKey: notificationsKeys.list() });
      const previousNotifications =
        queryClient.getQueryData<NotificationsResponse>(
          notificationsKeys.list()
        );

      if (previousNotifications?.data) {
        queryClient.setQueryData(notificationsKeys.list(), {
          ...previousNotifications,
          data: {
            ...previousNotifications.data,
            notifications: previousNotifications.data.notifications.map(
              (n) => ({
                ...n,
                read: true,
              })
            ),
          },
        });
      }

      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
    },
    onError: (error, _, context: any) => {
      // Restore previous data on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsKeys.list(),
          context.previousNotifications
        );
      }

      if (error.response?.status === 404) {
        console.warn("Some notifications may have been deleted elsewhere");
        toast.info("Updated notifications");
      } else {
        const errorMessage =
          error.response?.data?.message || "Failed to mark all as read";
        toast.error(errorMessage);
      }
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation<NotificationsResponse, AxiosError<any>, string>({
    mutationFn: (notificationId) =>
      notificationsService.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      // Optimistic update: remove from cache immediately
      await queryClient.cancelQueries({ queryKey: notificationsKeys.list() });
      const previousNotifications =
        queryClient.getQueryData<NotificationsResponse>(
          notificationsKeys.list()
        );

      if (previousNotifications?.data) {
        queryClient.setQueryData(notificationsKeys.list(), {
          ...previousNotifications,
          data: {
            ...previousNotifications.data,
            notifications: previousNotifications.data.notifications.filter(
              (n) => n.id !== notificationId
            ),
          },
        });
      }

      return { previousNotifications };
    },
    onSuccess: () => {
      toast.success("Notification deleted");
    },
    onError: (error, notificationId, context: any) => {
      // Handle 404 and 500 errors gracefully - notification may have been deleted/soft-deleted on backend
      // This happens when a notification is marked as read (soft deleted) and then user tries to delete it
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn(
          "Notification not found or already deleted - may have been soft-deleted when marked as read"
        );
        // Keep it deleted from UI since it's gone/soft-deleted on backend
        toast.info("Notification already deleted");

        // Don't restore - keep it deleted from UI
        // The notification is already gone or soft-deleted on backend
        return;
      }

      // For other errors, restore previous data
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsKeys.list(),
          context.previousNotifications
        );
      }

      const errorMessage =
        error.response?.data?.message || "Failed to delete notification";
      toast.error(errorMessage);
    },
  });
}
