// ============= Profile Types =============
export interface UserProfile {
  id: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  hasPin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  pin?: string; // Transaction PIN for verification
}

export interface UpdatePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface SetPinRequest {
  pin: string;
  currentPassword?: string; // Required if PIN already set
}

// ============= Purchase Types =============
export enum PurchaseStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum PurchaseType {
  AIRTIME = "AIRTIME",
  DATA = "DATA",
  ELECTRICITY = "ELECTRICITY",
  CABLE_TV = "CABLE_TV",
  TOPUP = "TOPUP",
}

export interface Purchase {
  id: string;
  userId: string;
  type: PurchaseType;
  status: PurchaseStatus;
  amount: number;
  operatorCode?: string;
  operatorName?: string;
  recipientPhone?: string;
  recipientAccount?: string;
  reference: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============= Topup Request Types =============
export interface TopupRequest {
  amount: number;
  operatorCode: string;
  recipientPhone: string;
  pin?: string; // Transaction PIN for verification
}

// ============= Request Params =============
export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  status?: PurchaseStatus;
  type?: PurchaseType;
  startDate?: string;
  endDate?: string;
}

export interface GetSupplierMarkupParams {
  page?: number;
  limit?: number;
  supplierId?: number;
}

// ============= Response Types =============
export interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data: Purchase;
}

interface SupplierMarkupPercent {
  id: string;
  supplierId: string;
  markupPercent: number | string;
  validFrom: Date | string;
  validUntil: Date | string | null;
  isActive: boolean;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  supplierName: string;
}

export interface PaginatedSupplierMarkupResponse {
  markups: SupplierMarkupPercent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchasesListResponse {
  success: boolean;
  message: string;
  data: {
    purchases: Purchase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface TopupResponse {
  success: boolean;
  message: string;
  data: {
    purchase: Purchase;
    transactionId: string;
    reference: string;
  };
}

// ============= Virtual Account Types =============
export interface CreateVirtualAccountRequest {
  bvn: string;
}

export interface CreateVirtualAccountResponse {
  success: boolean;
  message: string;
  data: {
    virtualAccountId: string;
  };
}
