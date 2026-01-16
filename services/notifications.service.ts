import apiClient from "@/lib/api-client";
import {
  NotificationsResponse,
  UnreadCountResponse,
} from "@/types/notification.types";

export const notificationsService = {
  async getNotifications(): Promise<NotificationsResponse> {
    const response =
      await apiClient.get<NotificationsResponse>("/notifications");
    return response.data;
  },

  async getNotificationById(
    notificationId: string
  ): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>(
      `/notifications/${notificationId}`
    );
    return response.data;
  },

  async unreadNotificationsCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      "/notifications/unread-count/count"
    );
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<NotificationsResponse> {
    const response = await apiClient.put<NotificationsResponse>(
      `/notifications/${notificationId}/read`,
      {}
    );
    return response.data;
  },

  async markAllAsRead(): Promise<NotificationsResponse> {
    const response = await apiClient.put<NotificationsResponse>(
      "/notifications/read-all/mark",
      {}
    );
    return response.data;
  },

  async deleteNotification(
    notificationId: string
  ): Promise<NotificationsResponse> {
    const response = await apiClient.delete<NotificationsResponse>(
      `/notifications/${notificationId}`
    );
    return response.data;
  },

  async unreadNotification(
    notificationId: string
  ): Promise<NotificationsResponse> {
    const response = await apiClient.put<NotificationsResponse>(
      `/notifications/${notificationId}/unread/`
    );
    return response.data;
  },
};
