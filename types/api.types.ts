// ============= Response Types =============
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface RecentNumber {
  id: string;
  phoneNumber: string;
  usageCount: number;
  lastUsedAt: string;
}

// ============= User Types =============
export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isSuspended: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  accountNumber?: string;
  providerName?: string;
  virtualAccountNumber?: string;
  virtualAccountBankName?: string;
  virtualAccountAccountName?: string;
  balance: string;
  cashback?: {
    availableBalance: number;
    totalEarned: number;
    totalRedeemed: number;
  };
  profilePictureUrl?: string;
  recentlyUsedNumbers?: RecentNumber[];
  permissions?: string[]; // Optional permissions array
  hasPin: boolean; // Whether the user has set a transaction PIN
  hasPasscode: boolean; // Whether the user has set an app passcode (for soft lock)
  createdAt: string;
  updatedAt: string;
}

// ============= Token Storage =============
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  twoFactor?: boolean;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
