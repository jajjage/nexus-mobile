import { useAuthContext } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "./useAuth";

export function useSetPin() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthContext();

  return useMutation({
    mutationFn: async (data: { pin: string; currentPassword?: string }) => {
      if (!/^\d{4}$/.test(data.pin)) {
        throw new Error("PIN must be 4 digits");
      }
      return userService.setPin({
        pin: data.pin,
        currentPassword: data.currentPassword,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      updateUser({ hasPin: true });
    },
    onError: (error: any) => {
        const message = error.response?.data?.message || "Failed to set PIN";
        console.error("Set PIN failed:", message);
    }
  });
}
