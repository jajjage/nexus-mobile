import { notificationPreferenceService } from "@/services/notification-preference.service";
import {
  NotificationPreferencesResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification-preference.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner-native";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationPreferenceService.getPreferences(),
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationPreferencesResponse,
    AxiosError<any>,
    UpdateNotificationPreferenceRequest
  >({
    mutationFn: (data) => notificationPreferenceService.updatePreference(data),
    onSuccess: (response, variables) => {
      // Optimistically update the cache to toggle the switch immediately if needed, 
      // or just invalidate to refetch.
      // Since backend response might not be the full list, invalidation is safest.
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      
      toast.success("Preference updated", {
        description:
          response.message || "Your notification preference has been updated.",
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update preference. Please try again.";
      toast.error("Update failed", {
        description: errorMessage,
      });
    },
  });
}
