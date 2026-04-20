// Agent Types - based on REACT_NATIVE_AGENT_INTEGRATION_GUIDE

export interface ValidateAgentCodeResponse {
  valid: boolean;
  referrerName?: string;
  message?: string;
}

export interface AgentAccount {
  agentId: string;
  userId: string;
  agentCode: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  totalCustomers: number;
  totalCommissions: number;
  pendingCommissions: number;
  withdrawnCommissions: number;
  monthlyEarnings: number;
  lifetimeEarnings: number;
  totalCommissionsEarned?: number;
}

export interface AgentCommission {
  commissionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  transactionId: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt: string | null;
}

export interface AgentCustomer {
  linkId: string;
  customerId: string;
  agentCodeUsed?: string;
  isActive?: boolean;
  joinedAt: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  isVerified?: boolean;
  isSuspended?: boolean;
  profilePictureUrl?: string | null;
  customer?: {
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    isVerified?: boolean;
    isSuspended?: boolean;
    profilePictureUrl?: string | null;
  };
  totalSpent?: number;
  transactionCount?: number;
  lastTransactionAt: string | null;
}

export interface AgentCustomersParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableBalance {
  totalAvailable: number;
  availableBalance?: number;
  claimCount?: number;
}

export type AgentWithdrawalMethod = "wallet" | "bank";

export interface WalletWithdrawalRequest {
  method: "wallet";
  amount: number;
  specificCommissionIds?: string[];
}

export interface BankWithdrawalRequest {
  method: "bank";
  amount: number;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string;
  requestNotes?: string;
  specificCommissionIds?: string[];
  metadata?: Record<string, unknown>;
}

export type WithdrawalRequest =
  | WalletWithdrawalRequest
  | BankWithdrawalRequest;

export interface BankWithdrawalHistoryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "processing" | "success" | "failed";
}

export interface WithdrawalResponse {
  withdrawalId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

export interface BankWithdrawalHistoryItem {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  narration?: string | null;
  requestNotes?: string | null;
  adminNotes?: string | null;
  failureReason?: string | null;
  requestedAt: string;
  processedAt: string | null;
}

// Register payload with agent code (used in auth signup)
export interface RegisterWithAgentCodePayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  agentCode?: string;
}

// Activate agent account response
export interface ActivateAgentResponse {
  agentCode: string;
  message: string;
}

export interface RegenerateAgentCodeResponse {
  agentCode: string;
  message: string;
}
