import apiClient from "@/lib/api-client";
import {
  NotificationPreferencesResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification-preference.types";

export const notificationPreferenceService = {
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    const response = await apiClient.get<NotificationPreferencesResponse>(
      "/notification-preferences"
    );
    return response.data;
  },

  async updatePreference(
    data: UpdateNotificationPreferenceRequest
  ): Promise<NotificationPreferencesResponse> {
    const response = await apiClient.put<NotificationPreferencesResponse>(
      "/notification-preferences",
      data
    );
    return response.data;
  },
};
