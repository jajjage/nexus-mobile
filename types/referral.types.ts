// Referral Types (V2)

export interface ReferrerStats {
  totalReferralsInvited: number;
  claimedReferrals: number; // Successful ones
  pendingClaimReferrals: number; // Waiting for friend to claim
  totalReferrerEarnings: number; // Lifetime earnings
  pendingReferrerAmount: number; // Available to withdraw
  withdrawnReferrerAmount: number;
}

export interface ReferredStats {
  referrerName: string; // "John Doe"
  referralStatus: "pending" | "claimed" | "cancelled";
  totalReferredEarnings: number;
  pendingReferredAmount: number; // Available to withdraw
  withdrawnReferredAmount: number;
  claimedAt: string | null; // ISO Date
}

export interface ReferralStatsV2 {
  referrerStats: ReferrerStats;
  referredStats: ReferredStats | null;
}

// User details attached to a referral
export interface ReferredUserData {
  userId: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  isVerified: boolean;
  profilePictureUrl: string | null;
}

// The main Referral object (History List)
export interface Referral {
  referralId: string;
  referrerUserId: string;
  referredUserId: string;
  status: "pending" | "claimed" | "cancelled";
  rewardAmount: number;
  referralCode: string | null;
  referralCompletedAt: string | null; // ISO Date
  createdAt: string; // ISO Date
  referredUser?: ReferredUserData; // Backend response field
}

// Referral Link Data
export interface ReferralLinkData {
  referralCode: string; // e.g., "JOHND123"
  shortCode: string; // Same as referralCode usually
  referralLink: string; // Full URL: https://app.com/register?code=...
  qrCodeUrl: string; // Image URL for QR code
  sharingMessage: string; // Pre-filled message for sharing
}

// Withdrawal Types (V2)

export interface AvailableBalanceV2 {
  totalAvailable: number; // Points/Currency units
  claimCount: number; // Number of contributors
  claims?: any[]; // Details if needed
}

export interface WithdrawalRequestV2 {
  amount: number;
  userType: "referrer" | "referred";
}

export interface ValidateReferralCodeResponse {
  valid: boolean;
  referrerName: string;
  message?: string;
}

export interface ReferralListResponse {
  referrals: Referral[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetReferralsParams {
  page?: number;
  limit?: number;
  status?: "pending" | "claimed" | "cancelled";
}
