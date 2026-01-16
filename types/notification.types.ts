export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error" | "alert";
  category?: string;
  publish_at?: string;
  sent?: boolean;
  archived?: boolean;
  // targetCriteria?: Record<string, any>;
}

export interface Notification {
  id: string; // user_notif_id
  notification_id: string;
  user_id: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  notification: NotificationData;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    unreadCount: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    unreadCount: number;
  };
  statusCode: number;
}

export interface MarkNotificationAsReadRequest {
  notificationId: string;
}
