// import { AuthenticationOptionsResponse } from "@/types/biometric.types";
// import { create, get } from "@github/webauthn-json";
// import { biometricService } from "./biometric.service";

// /**
//  * WebAuthn Service
//  * Handles the Options → Verify flow for both registration and authentication
//  * Uses the @github/webauthn-json library for simplified binary handling
//  */
// export class WebAuthnService {
//   /**
//    * Check if WebAuthn is supported on this device
//    */
//   static async isWebAuthnSupported(): Promise<boolean> {
//     if (typeof window === "undefined") return false;

//     return (
//       !!window.PublicKeyCredential &&
//       (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
//     );
//   }

//   // ===================================================================
//   // REGISTRATION FLOW
//   // ===================================================================

//   /**
//    * Get registration options from backend
//    */
//   static async getRegistrationOptions(): Promise<any> {
//     const options = await biometricService.getRegistrationOptions();
//     return options;
//   }

//   /**
//    * Create WebAuthn credential (uses the options from step 1)
//    */
//   static async createCredential(options: any): Promise<any> {
//     // @github/webauthn-json handles the conversion from JSON to binary
//     const credential = await create({
//       publicKey: options as any,
//     });

//     return credential;
//   }

//   /**
//    * Verify credential on backend
//    */
//   static async verifyCredential(
//     credential: any,
//     deviceInfo?: {
//       deviceName?: string;
//       platform?: string;
//       authenticatorAttachment?: string;
//     }
//   ) {
//     return await biometricService.verifyRegistration({
//       ...credential,
//       ...deviceInfo,
//     });
//   }

//   // ===================================================================
//   // AUTHENTICATION FLOW
//   // ===================================================================

//   /**
//    * Get authentication options from backend
//    */
//   static async getAuthenticationOptions(): Promise<AuthenticationOptionsResponse> {
//     return await biometricService.getAuthenticationOptions();
//   }

//   /**
//    * Sign assertion using WebAuthn
//    */
//   static async signAssertion(
//     options: AuthenticationOptionsResponse,
//     mediation?: CredentialMediationRequirement,
//     signal?: AbortSignal
//   ): Promise<any> {
//     // @github/webauthn-json handles the conversion from JSON to binary
//     const assertion = await get({
//       publicKey: options as any,
//       mediation,
//       signal,
//     });

//     return assertion;
//   }

//   /**
//    * Verify assertion on backend
//    */
//   static async verifyAssertion(assertion: any) {
//     return await biometricService.verifyAuthentication(assertion);
//   }

//   // ===================================================================
//   // HELPER METHODS
//   // ===================================================================

//   /**
//    * Get device/platform information
//    */
//   static getDeviceInfo() {
//     if (typeof navigator === "undefined") {
//       return {
//         platform: "web",
//         deviceName: "Unknown Device",
//         userAgent: "",
//       };
//     }

//     const ua = navigator.userAgent;

//     // Use multiple detection methods for more accurate results
//     const isWindows =
//       ua.includes("Windows NT") || ua.includes("Win32") || ua.includes("Win64");
//     const isMac = ua.includes("Macintosh") || ua.includes("Mac OS X");
//     const isIOS =
//       ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod");
//     const isAndroid = ua.includes("Android");
//     const isLinux = ua.includes("Linux");

//     // More accurate device name determination
//     let deviceName = "Unknown Device";
//     let platform: "ios" | "android" | "macos" | "windows" | "web" = "web";

//     if (isIOS) {
//       deviceName = ua.includes("iPhone")
//         ? "iPhone"
//         : ua.includes("iPad")
//           ? "iPad"
//           : "iPod Touch";
//       platform = "ios";
//     } else if (isAndroid) {
//       deviceName = "Android Device";
//       platform = "android";
//     } else if (isWindows) {
//       deviceName = "Windows PC";
//       platform = "windows";
//     } else if (isMac) {
//       deviceName = "Mac";
//       platform = "macos";
//     } else if (isLinux) {
//       deviceName = "Linux Device";
//       platform = "web";
//     }

//     // Additional check: if we detect Android but also Windows, there might be a compatibility mode or hybrid environment
//     // In such cases, Windows is more likely the primary OS
//     if (isAndroid && isWindows) {
//       deviceName = "Windows PC";
//       platform = "windows";
//     }

//     return {
//       platform,
//       deviceName,
//       userAgent: ua,
//     };
//   }

//   /**
//    * Get device name/model
//    */
//   private static getDeviceName(ua: string = navigator.userAgent): string {
//     if (typeof navigator === "undefined") return "Unknown Device";

//     // Mobile checks first (iOS)
//     if (/iPhone/.test(ua)) return "iPhone";
//     if (/iPad/.test(ua)) return "iPad";
//     if (/iPod/.test(ua)) return "iPod Touch";

//     // Mobile checks (Android) - must come before desktop Windows check
//     // because some Android devices may have "Windows" in UA
//     if (/Android/.test(ua)) return "Android Device";

//     // Desktop checks (order matters - check more specific first)
//     if (/Windows NT/.test(ua)) return "Windows PC";
//     if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
//     if (/X11.*Linux|Linux.*X11/.test(ua)) return "Linux Device";
//     if (/Linux/.test(ua)) return "Linux Device";

//     return "Unknown Device";
//   }
// }
