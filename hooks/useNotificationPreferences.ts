import { notificationPreferenceService } from "@/services/notification-preference.service";
import {
  NotificationPreferencesResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/notification-preference.types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationPreferenceService.getPreferences(),
  });
}

export function useUpdateNotificationPreference() {
  return useMutation<
    NotificationPreferencesResponse,
    AxiosError<any>,
    UpdateNotificationPreferenceRequest
  >({
    mutationFn: (data) => notificationPreferenceService.updatePreference(data),
    onSuccess: (response) => {
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
