import { announcementService } from "@/services/announcement.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const dashboardAnnouncementKey = ["dashboard-announcement"] as const;

export function useDashboardAnnouncement() {
  return useQuery({
    queryKey: dashboardAnnouncementKey,
    queryFn: async () => {
      const response = await announcementService.getDashboardAnnouncement();
      return response.data || null;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useMarkAnnouncementViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      announcementService.markViewed(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardAnnouncementKey });
    },
  });
}
