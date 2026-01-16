export interface PublicKeyCredentialCreationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    userVerification?: string;
  };
}

export interface PublicKeyCredentialRequestOptions {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
  userVerification?: string;
  extensions?: any;
}

export interface BiometricEnrollment {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: "ios" | "android" | "macos" | "windows" | "web" | "unknown";
  authenticator_attachment: "platform" | "cross-platform";
  is_active: boolean;
  enrolled_at: string;
  last_verified_at?: string;
  verification_count: number;
}

export interface WebAuthnRegistrationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: string;
  deviceName?: string;
  platform?: string;
  authenticatorAttachment?: string;
}

export interface WebAuthnAuthenticationResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  };
  type: string;
}

export interface BiometricAuditLog {
  id: string;
  user_id: string;
  action_type: "register" | "authenticate" | "revoke" | "update";
  action_status: "success" | "failed" | "blocked";
  enrollment_id?: string | null;
  failure_reason?: string | null;
  created_at: string;
}

export interface RegistrationOptionsResponse {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  timeout?: number;
  attestation?: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    userVerification?: string;
  };
}

export interface AuthenticationOptionsResponse {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: string;
  allowCredentials?: Array<{
    id: string;
    type: string;
    transports?: string[];
  }>;
}

export interface VerificationResponse {
  enrollmentId: string;
  credentialId: string;
  jwt?: string; // For authentication flow
}
