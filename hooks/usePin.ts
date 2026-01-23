import { useAuthContext } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { authKeys } from "./useAuth";

export function useSetPin() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthContext();

  return useMutation({
    mutationFn: async (data: { pin: string }) => {
      if (!/^\d{4}$/.test(data.pin)) {
        throw new Error("PIN must be 4 digits");
      }
      return userService.setPin({
        pin: data.pin,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      updateUser({ hasPin: true });
      toast.success("Transaction PIN set successfully");
    },
    onError: (error: any) => {
        const message = error.response?.data?.message || "Failed to set PIN";
        toast.error(message);
    }
  });
}
