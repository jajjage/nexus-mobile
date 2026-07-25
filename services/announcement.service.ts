import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import { DashboardAnnouncement } from "@/types/announcement.types";

export const announcementService = {
  getDashboardAnnouncement: async (): Promise<
    ApiResponse<DashboardAnnouncement | null>
  > => {
    const response = await apiClient.get<
      ApiResponse<DashboardAnnouncement | null>
    >("/dashboard-announcement");
    console.log(
      "[DEBUG-announcement] GET /dashboard-announcement response",
      JSON.stringify(response.data)
    );
    return response.data;
  },

  markViewed: async (announcementId: string): Promise<ApiResponse> => {
    console.log(
      "[DEBUG-announcement] POST announcement viewed",
      announcementId
    );
    const response = await apiClient.post<ApiResponse>(
      `/announcements/${announcementId}/view`
    );
    console.log(
      "[DEBUG-announcement] POST announcement viewed response",
      JSON.stringify(response.data)
    );
    return response.data;
  },
};
