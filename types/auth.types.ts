// ============= Request Types =============
export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber: string;
  fullName?: string;
  referralCode?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  deviceId: string;
  totpCode?: string;
  backupCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ============= Response Types =============

// What we get from /mobile-auth/login and /mobile-auth/refresh
export interface MobileAuthResponse {
  id: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}
