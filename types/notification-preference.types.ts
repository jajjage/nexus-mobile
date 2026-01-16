export interface NotificationPreference {
  category: string;
  subscribed: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  message: string;
  data: NotificationPreference[];
}

export interface UpdateNotificationPreferenceRequest {
  category: string;
  subscribed: boolean;
}
