import { notificationsService } from '@/services/notifications.service';
import { useQuery } from '@tanstack/react-query';

export const notificationKeys = {
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useUnreadNotificationCount() {
  const query = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const response = await notificationsService.unreadNotificationsCount();
      return response.data?.unreadCount ?? 0;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
