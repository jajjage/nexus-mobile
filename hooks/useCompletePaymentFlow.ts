/**
 * Complete Payment Flow Hook
 * Orchestrates: Biometric → PIN → Transaction
 * Per PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md
 */

import { useAuth } from "@/hooks/useAuth";
import { useTopup } from "@/hooks/useTopup";
import {
    buildTopupRequest,
    determinePaymentMethod,
    verifyBiometricAndGetToken,
} from "@/lib/payment-flow";
import { calculateFinalPrice, validatePurchase } from "@/lib/price-calculator";
import { Product } from "@/types/product.types";
import { TopupRequest } from "@/types/topup.types";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

export interface PaymentFlowResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface PaymentFlowHookOptions {
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to manage the complete payment flow
 */
export function useCompletePaymentFlow(
  options: PaymentFlowHookOptions = {}
) {
  const { user } = useAuth();
  const topupMutation = useTopup();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "biometric" | "pin" | "transaction"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * Process payment with selected verification method
   */
  const processPayment = useCallback(
    async (args: {
      product: Product;
      phoneNumber: string;
      useCashback: boolean;
      markupPercent?: number; // Supplier markup percentage
      pin?: string; // If user provided PIN
      userCashbackBalance?: number;
    }): Promise<PaymentFlowResult> => {
      try {
        setIsProcessing(true);
        setError(null);

        const {
          product,
          phoneNumber,
          useCashback,
          markupPercent = 0,
          pin,
          userCashbackBalance = 0,
        } = args;

        // Step 1: Validate purchase
        console.log("[CompletePayment] Step 1: Validating purchase");
        const validation = validatePurchase(
          phoneNumber,
          product,
          parseFloat(user?.balance || "0"),
          undefined
        );

        if (!validation.isValid) {
          const errorMsg = validation.errors.join(". ");
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Step 2: Calculate final price
        console.log("[CompletePayment] Step 2: Calculating price");
        const priceDetails = calculateFinalPrice(
          product,
          useCashback,
          userCashbackBalance,
          markupPercent
        );

        // Step 3: Determine payment method (biometric → PIN fallback)
        let verificationToken: string | undefined;
        let pinToUse: string | undefined;

        if (!pin) {
          // No PIN provided, try biometric first
          console.log("[CompletePayment] Step 3: Determining payment method (biometric-first)");
          const paymentMethod = await determinePaymentMethod(
            user?.hasBiometric || false
          );

          if (paymentMethod === "biometric") {
            console.log("[CompletePayment] Step 4: Attempting biometric verification");
            setCurrentStep("biometric");
            try {
              verificationToken = await verifyBiometricAndGetToken();
              console.log("[CompletePayment] Biometric verification successful");
            } catch (bioError) {
              console.warn(
                "[CompletePayment] Biometric failed, fallback to PIN required"
              );
              // Biometric failed - caller should show PIN modal
              setCurrentStep("pin");
              return {
                success: false,
                error: "Biometric verification failed. Please use PIN.",
              };
            }
          } else {
            // User doesn't have biometric or device doesn't support it
            // Show PIN modal
            console.log("[CompletePayment] User needs PIN authentication");
            setCurrentStep("pin");
            return {
              success: false,
              error: "PIN verification required. Please enter your PIN.",
            };
          }
        } else {
          pinToUse = pin;
        }

        // Step 4: Build and submit topup request
        console.log("[CompletePayment] Step 5: Building topup request");
        const baseRequest: Omit<TopupRequest, "pin" | "verificationToken"> = {
          amount: priceDetails.payableAmount,
          productCode: product.productCode,
          recipientPhone: phoneNumber,
          supplierSlug: product.supplierOffers?.[0]?.supplierSlug,
          supplierMappingId: product.supplierOffers?.[0]?.mappingId,
          useCashback: useCashback,
          offerId: product.activeOffer?.id,
        };

        const topupRequest = buildTopupRequest(baseRequest, {
          pin: pinToUse,
          verificationToken: verificationToken,
        });

        console.log("[CompletePayment] Step 6: Submitting topup request");
        setCurrentStep("transaction");

        // Submit mutation (handles optimistic updates)
        await topupMutation.mutateAsync(topupRequest);

        console.log("[CompletePayment] Transaction successful");
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        options.onSuccess?.(topupRequest.toString());

        return { success: true, transactionId: topupRequest.toString() };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Payment processing failed";

        console.error("[CompletePayment] Error:", errorMessage);
        setError(errorMessage);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );

        options.onError?.(errorMessage);

        return { success: false, error: errorMessage };
      } finally {
        setIsProcessing(false);
        setCurrentStep("idle");
      }
    },
    [user, topupMutation, options]
  );

  /**
   * Submit PIN after biometric fails
   */
  const submitPIN = useCallback(
    async (args: {
      product: Product;
      phoneNumber: string;
      useCashback: boolean;
      markupPercent?: number;
      pin: string;
      userCashbackBalance?: number;
    }) => {
      return processPayment(args);
    },
    [processPayment]
  );

  /**
   * Reset payment state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setCurrentStep("idle");
    setError(null);
  }, []);

  return {
    processPayment,
    submitPIN,
    reset,
    isProcessing,
    currentStep,
    error,
    isLoading: isProcessing || topupMutation.isPending,
  };
}
