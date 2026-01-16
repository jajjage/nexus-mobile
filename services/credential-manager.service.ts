/**
 * Browser Credential Management Service
 *
 * Uses the Web Credentials API to enable browser-native password saving
 * with biometric unlock (Touch ID / Face ID / Fingerprint)
 *
 * Flow:
 * 1. After successful login → storeCredentials() → Browser prompts "Save password?"
 * 2. On login page → getCredentials() → Browser shows saved credentials → Biometric verify → Returns credentials
 */

// Type declarations for PasswordCredential API (not in standard TypeScript DOM types)
declare global {
  interface PasswordCredentialData {
    id: string;
    name?: string;
    password: string;
  }

  interface PasswordCredential extends Credential {
    readonly password: string;
    readonly name: string;
  }

  // eslint-disable-next-line no-var
  var PasswordCredential: {
    prototype: PasswordCredential;
    new (data: PasswordCredentialData): PasswordCredential;
  };

  interface CredentialRequestOptions {
    password?: boolean;
  }
}

export interface StoredCredential {
  id: string;
  password: string;
}

class CredentialManagerService {
  /**
   * Check if Credential Management API is supported
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "credentials" in navigator &&
      "PasswordCredential" in window
    );
  }

  /**
   * Store credentials after successful login
   * This prompts the browser to ask "Save password?"
   */
  async storeCredentials(
    id: string, // email or phone
    password: string,
    name?: string
  ): Promise<boolean> {
    if (!this.isSupported()) {
      console.log("[CredentialManager] API not supported");
      return false;
    }

    try {
      const credential = new PasswordCredential({
        id,
        password,
        name: name || id,
      });

      await navigator.credentials.store(credential);
      console.log("[CredentialManager] Credential stored successfully");
      return true;
    } catch (error) {
      console.error("[CredentialManager] Failed to store credential:", error);
      return false;
    }
  }

  /**
   * Get stored credentials with biometric/password unlock
   * This triggers the browser's credential picker with biometric verification
   *
   * @param mediation - "optional" shows picker if multiple, "silent" auto-selects if one
   */
  async getCredentials(
    mediation: CredentialMediationRequirement = "optional"
  ): Promise<StoredCredential | null> {
    if (!this.isSupported()) {
      console.log("[CredentialManager] API not supported");
      return null;
    }

    try {
      const credential = await navigator.credentials.get({
        password: true,
        mediation,
      });

      if (credential && credential.type === "password") {
        const pwCredential = credential as PasswordCredential;
        console.log(
          "[CredentialManager] Credential retrieved:",
          pwCredential.id
        );
        return {
          id: pwCredential.id,
          password: pwCredential.password || "",
        };
      }

      console.log("[CredentialManager] No credential selected");
      return null;
    } catch (error) {
      console.error("[CredentialManager] Failed to get credential:", error);
      return null;
    }
  }

  /**
   * Prevent auto-sign-in after logout
   * Call this when user explicitly logs out
   */
  async preventSilentAccess(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await navigator.credentials.preventSilentAccess();
      console.log("[CredentialManager] Silent access prevented");
    } catch (error) {
      console.error(
        "[CredentialManager] Failed to prevent silent access:",
        error
      );
    }
  }
}

export const credentialManager = new CredentialManagerService();
