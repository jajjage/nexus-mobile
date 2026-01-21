/**
 * Reseller Hooks
 * React Query hooks for reseller-specific features
 */

import { resellerService } from "@/services/reseller.service";
import type {
  BulkTopupRequest,
  CreateApiKeyRequest,
} from "@/types/reseller.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner-native";

// Query keys for cache management
const resellerKeys = {
  all: ["reseller"] as const,
  apiKeys: () => [...resellerKeys.all, "api-keys"] as const,
  bulkTopups: () => [...resellerKeys.all, "bulk-topups"] as const,
};

// ============= API Keys Hooks =============

/**
 * Fetch all API keys for the current reseller
 */
export function useApiKeys() {
  return useQuery({
    queryKey: resellerKeys.apiKeys(),
    queryFn: () => resellerService.getApiKeys(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) =>
      resellerService.createApiKey(data),
    onSuccess: () => {
      toast.success("API key created successfully", {
        description: "Make sure to copy it now - it won't be shown again!",
      });
      queryClient.invalidateQueries({ queryKey: resellerKeys.apiKeys() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to create API key");
    },
  });
}

/**
 * Revoke an API key permanently
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => resellerService.revokeApiKey(keyId),
    onSuccess: () => {
      toast.success("API key revoked successfully");
      queryClient.invalidateQueries({ queryKey: resellerKeys.apiKeys() });
    },
    onError: (error: AxiosError<any>) => {
      toast.error(error.response?.data?.message || "Failed to revoke API key");
    },
  });
}

// ============= Bulk Topup Hooks =============

/**
 * Process a batch of topups
 */
export function useBulkTopup() {
  return useMutation({
    mutationFn: (data: BulkTopupRequest) => resellerService.bulkTopup(data),
    onSuccess: (response) => {
      const { successCount, failedCount } = response.data || {};
      if (failedCount === 0) {
        toast.success(`All ${successCount} topups processed successfully!`);
      } else if (successCount === 0) {
        toast.error(`All ${failedCount} topups failed`);
      } else {
        toast.info(`${successCount} succeeded, ${failedCount} failed`, {
          description: "Check the batch report for details",
        });
      }
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message;
      const status = error.response?.status;

      if (status === 401) {
        toast.error("Invalid PIN or API Key");
      } else if (status === 403) {
        toast.error("Permission denied. Upgrade to Reseller required.");
      } else if (status === 429) {
        toast.error("Too many requests. Please slow down.");
      } else {
        toast.error(message || "Bulk topup failed");
      }
    },
  });
}

// ============= CSV Utilities =============

/**
 * Parse a CSV string into bulk topup items
 * Expected format: recipientPhone,amount,productCode
 */
export function parseCsvToBulkItems(csvContent: string): {
  items: BulkTopupRequest["requests"];
  errors: Array<{ row: number; message: string }>;
} {
  const lines = csvContent.trim().split("\n");
  const items: BulkTopupRequest["requests"] = [];
  const errors: Array<{ row: number; message: string }> = [];

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes("phone") ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((p) => p.trim());

    if (parts.length < 3) {
      errors.push({ row: i + 1, message: "Missing columns (need 3)" });
      continue;
    }

    const [recipientPhone, amountStr, productCode] = parts;
    const amount = parseFloat(amountStr);

    // Validate phone (Nigerian format)
    if (!/^0[789][01]\d{8}$/.test(recipientPhone)) {
      errors.push({ row: i + 1, message: `Invalid phone: ${recipientPhone}` });
      continue;
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: i + 1, message: `Invalid amount: ${amountStr}` });
      continue;
    }

    // Validate product code
    if (!productCode || productCode.length < 3) {
      errors.push({
        row: i + 1,
        message: `Invalid product code: ${productCode}`,
      });
      continue;
    }

    items.push({ recipientPhone, amount, productCode });
  }

  return { items, errors };
}

/**
 * Validate batch size (max 50 items)
 */
export function validateBatchSize(
  items: BulkTopupRequest["requests"]
): string | null {
  if (items.length === 0) {
    return "No items to process";
  }
  if (items.length > 50) {
    return `Batch size exceeds limit (${items.length}/50). Please split into smaller batches.`;
  }
  return null;
}

// ============= Upgrade Request Hook =============

const UPGRADE_REQUEST_KEY = "reseller_upgrade_request";

/**
 * Hook to check and manage reseller upgrade request status
 * Tracks if user has already submitted an upgrade request
 */
export function useResellerUpgradeStatus() {
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(UPGRADE_REQUEST_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.submittedAt) {
          setIsPending(true);
        }
      }
    } catch (error) {
      console.error("Failed to check reseller status", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPending = async () => {
    try {
      await AsyncStorage.setItem(
        UPGRADE_REQUEST_KEY,
        JSON.stringify({ submittedAt: new Date().toISOString() })
      );
      setIsPending(true);
    } catch (error) {
      console.error("Failed to mark reseller status", error);
    }
  };

  const clearPending = async () => {
    try {
      await AsyncStorage.removeItem(UPGRADE_REQUEST_KEY);
      setIsPending(false);
    } catch (error) {
      console.error("Failed to clear reseller status", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { isPending, isLoading, markAsPending, clearPending, refetch: checkStatus };
}

/**
 * Request upgrade to reseller status
 */
export function useRequestResellerUpgrade() {
  const { markAsPending } = useResellerUpgradeStatus();
  // Using useMutation state to expose loading/error to component
  const [requestError, setRequestError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (message: string) => resellerService.requestUpgrade(message),
    onSuccess: async () => {
      // Mark as pending so user can't submit again
      await markAsPending();
      toast.success("Application submitted!", {
        description: "We will review your request shortly.",
      });
    },
    onError: (error: AxiosError<any>) => {
      const message = error.response?.data?.message || "Failed to submit request";
      setRequestError(message);
      toast.error(message);
    },
  });

  return {
    requestUpgrade: mutation.mutateAsync,
    isSubmitting: mutation.isPending, // react-query v5 uses isPending
    error: requestError,
  };
}
