// types/auth.types.ts

export interface MobileLoginRequest {
  email: string;
  password: string;
  deviceId: string;
  totpCode?: string;
  backupCode?: string;
}

export interface MobileLoginResponse {
  id: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface MobileRefreshRequest {
  refreshToken: string;
}

export interface MobileRefreshResponse {
  id: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}
