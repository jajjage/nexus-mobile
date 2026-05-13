export type BillCategoryType = "electricity" | "cable";
export type BillPaymentStatus =
  | "pending"
  | "success"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed"
  | "retry";

export interface BillCategory {
  id: string;
  code: string;
  type: BillCategoryType;
  name: string;
  country: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Biller {
  id: string;
  categoryId: string;
  categoryType?: BillCategoryType;
  code: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  requiresValidation: boolean;
  supportsVariations: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface BillVariation {
  id: string;
  billerId: string;
  code: string;
  name: string;
  amount?: number | null;
  isFixedPrice: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface BillValidationRequest {
  billerCode: string;
  customerIdentifier: string;
  meterType?: "prepaid" | "postpaid";
  supplierSlug?: string;
}

export interface BillValidationResult {
  isValid: boolean;
  customerName?: string | null;
  minimumAmount?: number | null;
  renewalAmount?: number | null;
  raw?: Record<string, unknown>;
}

export interface BillPaymentRequest extends BillValidationRequest {
  amount: number;
  phone: string;
  variationCode?: string;
  subscriptionType?: "change" | "renew";
  pin?: string;
  verificationToken?: string;
  idempotencyKey?: string;
  supplierMappingId?: string;
}

export interface BillPayment {
  id: string;
  userId: string;
  sourceChannel: "user_app" | "reseller_api";
  categoryType: BillCategoryType;
  billerId: string;
  supplierId?: string;
  variationId?: string | null;
  customerIdentifier: string;
  customerName?: string | null;
  phone: string;
  amount: number;
  cost?: number | null;
  status: BillPaymentStatus;
  externalReference: string;
  providerReference?: string | null;
  tokenPayload?: Record<string, unknown>;
  transactionId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
