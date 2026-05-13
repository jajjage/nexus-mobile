import { useAuth } from "@/hooks/useAuth";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import {
  determinePaymentMethod,
  verifyBiometricAndGetToken,
} from "@/lib/payment-flow";
import { billPaymentService } from "@/services/bill-payment.service";
import {
  BillCategoryType,
  BillPayment,
  BillPaymentRequest,
  BillValidationRequest,
} from "@/types/bill-payment.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { useCallback, useState } from "react";

export const billPaymentKeys = {
  all: ["bill-payments"] as const,
  categories: () => [...billPaymentKeys.all, "categories"] as const,
  billers: (category?: string) =>
    [...billPaymentKeys.all, "billers", category || "all"] as const,
  variations: (billerCode?: string) =>
    [...billPaymentKeys.all, "variations", billerCode || "none"] as const,
  payment: (id: string) => [...billPaymentKeys.all, "payment", id] as const,
};

const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
};

export function useBillCategories() {
  return useQuery({
    queryKey: billPaymentKeys.categories(),
    queryFn: () => billPaymentService.getCategories(),
    staleTime: 1000 * 60 * 30,
    select: response => response.data,
  });
}

export function useBillers(category?: BillCategoryType) {
  return useQuery({
    queryKey: billPaymentKeys.billers(category),
    queryFn: () => billPaymentService.getBillers(category),
    staleTime: 1000 * 60 * 10,
    select: response => response.data,
  });
}

export function useBillVariations(billerCode?: string, enabled = true) {
  return useQuery({
    queryKey: billPaymentKeys.variations(billerCode),
    queryFn: () => billPaymentService.getVariations(billerCode!),
    enabled: Boolean(billerCode) && enabled,
    staleTime: 1000 * 60 * 10,
    select: response => response.data,
  });
}

export function useValidateBillCustomer() {
  return useMutation({
    mutationFn: (data: BillValidationRequest) =>
      billPaymentService.validateCustomer(data),
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<any>, BillPaymentRequest>({
    mutationFn: data => billPaymentService.pay(data),
    onSuccess: response => {
      toast.success("Payment submitted", {
        description: response.message || "Your bill payment is being processed.",
      });
    },
    onError: error => {
      const responseData = error.response?.data;
      const errorMessage =
        responseData?.message ||
        responseData?.data?.message ||
        responseData?.error ||
        error.message ||
        "Bill payment failed. Please try again.";

      toast.error("Payment failed", {
        description: errorMessage,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
    },
  });
}

export interface BillPaymentFlowResult {
  success: boolean;
  transactionId?: string;
  paymentId?: string;
  error?: string;
}

export function useBillPaymentFlow(options: {
  onSuccess?: (
    transactionId: string,
    paymentId: string,
    payment: BillPayment
  ) => void;
  onError?: (error: string) => void;
} = {}) {
  const { user } = useAuth();
  const { balance: walletBalance } = useWalletBalance();
  const payBillMutation = usePayBill();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "biometric" | "pin" | "transaction"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(
    async (
      data: Omit<BillPaymentRequest, "pin" | "verificationToken"> & {
        pin?: string;
      }
    ): Promise<BillPaymentFlowResult> => {
      try {
        setIsProcessing(true);
        setError(null);

        if (data.amount > walletBalance) {
          const message = "Insufficient balance. Please add funds to your wallet.";
          setError(message);
          return { success: false, error: message };
        }

        let verificationToken: string | undefined;
        let pinToUse = data.pin;

        if (!pinToUse) {
          const paymentMethod = await determinePaymentMethod(
            user?.hasBiometric || false
          );

          if (paymentMethod === "biometric") {
            setCurrentStep("biometric");
            try {
              verificationToken = await verifyBiometricAndGetToken();
            } catch {
              setCurrentStep("pin");
              return {
                success: false,
                error: "Biometric verification failed. Please use PIN.",
              };
            }
          } else {
            setCurrentStep("pin");
            return {
              success: false,
              error: "PIN verification required. Please enter your PIN.",
            };
          }
        }

        setCurrentStep("transaction");
        const response = await payBillMutation.mutateAsync({
          ...data,
          pin: pinToUse,
          verificationToken,
          idempotencyKey: data.idempotencyKey || `mobile-bill-${Date.now()}`,
        });

        const payment = response.data;
        const transactionId =
          payment.transactionId || payment.providerReference || payment.id;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        options.onSuccess?.(transactionId, payment.id, payment);

        return {
          success: true,
          transactionId,
          paymentId: payment.id,
        };
      } catch (err: any) {
        const responseData = err.response?.data;
        const errorMessage =
          responseData?.message ||
          responseData?.data?.message ||
          err.message ||
          "Bill payment failed. Please try again.";

        setError(errorMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        options.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsProcessing(false);
        setCurrentStep("idle");
      }
    },
    [payBillMutation, user, walletBalance, options]
  );

  return {
    processPayment,
    submitPIN: processPayment,
    isLoading: isProcessing || payBillMutation.isPending,
    currentStep,
    error,
  };
}
