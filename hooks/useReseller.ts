/**
 * Reseller Hooks
 * React Query hooks for reseller-specific features
 */

"use client";

import { resellerService } from "@/services/reseller.service";
import type {
  BulkTopupRequest,
  CreateApiKeyRequest,
} from "@/types/reseller.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

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
 * Shows success toast with warning about one-time display
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
 * Shows detailed result toast with success/failure counts
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
        toast.warning(`${successCount} succeeded, ${failedCount} failed`, {
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
        toast.error(
          "You don't have permission. Contact support to upgrade to Reseller."
        );
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
  const getStatus = (): { pending: boolean; submittedAt: string | null } => {
    if (typeof window === "undefined") {
      return { pending: false, submittedAt: null };
    }

    const data = localStorage.getItem(UPGRADE_REQUEST_KEY);
    if (!data) {
      return { pending: false, submittedAt: null };
    }

    try {
      const parsed = JSON.parse(data);
      return { pending: true, submittedAt: parsed.submittedAt };
    } catch {
      return { pending: false, submittedAt: null };
    }
  };

  const markAsPending = () => {
    localStorage.setItem(
      UPGRADE_REQUEST_KEY,
      JSON.stringify({ submittedAt: new Date().toISOString() })
    );
  };

  const clearPending = () => {
    localStorage.removeItem(UPGRADE_REQUEST_KEY);
  };

  return { getStatus, markAsPending, clearPending };
}

/**
 * Request upgrade to reseller status
 * For regular users (role=user) to apply for reseller account
 * Automatically marks request as pending on success
 */
export function useRequestResellerUpgrade() {
  const { markAsPending } = useResellerUpgradeStatus();

  return useMutation({
    mutationFn: (message: string) => resellerService.requestUpgrade(message),
    onSuccess: () => {
      // Mark as pending so user can't submit again
      markAsPending();
      toast.success("Application submitted!", {
        description: "We will review your request and contact you shortly.",
      });
    },
    onError: (error: AxiosError<any>) => {
      const message =
        error.response?.data?.message || "Failed to submit request";
      toast.error(message);
    },
  });
}
