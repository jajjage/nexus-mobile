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
  customerId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  totalSpent: number;
  transactionCount: number;
  joinedAt: string;
  lastTransactionAt: string | null;
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

export interface WithdrawalRequest {
  amount: number;
}

export interface WithdrawalResponse {
  withdrawalId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
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
