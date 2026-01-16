/**
 * Reseller Types
 * Types for reseller-specific features: Bulk Topup and API Key Management
 */

// ============= Bulk Topup Types =============

/**
 * Single item in a bulk topup batch
 */
export interface BulkTopupItem {
  recipientPhone: string;
  amount: number;
  productCode: string;
}

/**
 * Request payload for bulk topup
 */
export interface BulkTopupRequest {
  batchName?: string;
  pin?: string; // Required for JWT auth
  requests: BulkTopupItem[];
}

/**
 * Result of a single topup in the batch
 */
export interface BulkTopupResult {
  recipientPhone: string;
  productCode: string;
  status: "success" | "failed";
  topupId?: string; // Present if success
  reason?: string; // Present if failed
}

/**
 * Response from bulk topup endpoint
 */
export interface BulkTopupResponseData {
  batchId: string;
  successCount: number;
  failedCount: number;
  totalCost: number;
  results: BulkTopupResult[];
}

// ============= API Key Types =============

/**
 * API Key as returned from the server (prefix only, not full key)
 */
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string; // e.g., "nx_live_abcd..."
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

/**
 * Request to create a new API key
 */
export interface CreateApiKeyRequest {
  name: string;
  isLive: boolean;
}

/**
 * Response when creating an API key
 * WARNING: The full key is returned ONLY ONCE
 */
export interface CreateApiKeyResponseData {
  id: string;
  key: string; // Full key - must be shown to user immediately
}

/**
 * Response for listing API keys
 */
export interface ApiKeysListData {
  keys: ApiKey[];
}

// ============= CSV Import Types =============

/**
 * Parsed row from CSV import
 */
export interface CsvTopupRow {
  recipientPhone: string;
  amount: string; // String from CSV, needs parsing
  productCode: string;
}

/**
 * Validation result for a CSV row
 */
export interface CsvValidationResult {
  row: number;
  isValid: boolean;
  errors: string[];
  data?: BulkTopupItem;
}
