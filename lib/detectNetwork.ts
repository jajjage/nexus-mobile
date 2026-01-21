/**
 * Network Provider Detection Utility
 * Detects Nigerian mobile network operators from phone prefixes
 */

export type NetworkProvider = "mtn" | "glo" | "airtel" | "9mobile";

export interface NetworkInfo {
  name: string;
  slug: NetworkProvider;
  color: string;
  logoUrl?: string; // Kept for API compatibility if needed
  logo: any; // Changed to any to support require() assets
}

// Nigerian mobile network prefix mappings
const MTN_PREFIXES = [
  "0803",
  "0806",
  "0703",
  "0706",
  "0813",
  "0816",
  "0810",
  "0814",
  "0903",
  "0906",
  "0913",
  "0916",
];

const GLO_PREFIXES = [
  "0805",
  "0807",
  "0705",
  "0815",
  "0811",
  "0905",
  "0915",
];

const AIRTEL_PREFIXES = [
  "0802",
  "0808",
  "0708",
  "0812",
  "0701",
  "0901",
  "0902",
  "0907",
  "0912",
];

const NINE_MOBILE_PREFIXES = [
  "0809",
  "0817",
  "0818",
  "0908",
  "0909",
];

// Network directory with metadata
export const NETWORK_PROVIDERS: Record<NetworkProvider, NetworkInfo> = {
  mtn: {
    name: "MTN",
    slug: "mtn",
    color: "#FFCC00",
    logo: require("../assets/images/MTN.jpg"),
  },
  glo: {
    name: "Glo",
    slug: "glo",
    color: "#00B140",
    logo: require("../assets/images/glo.jpg"),
  },
  airtel: {
    name: "Airtel",
    slug: "airtel",
    color: "#E60000",
    logo: require("../assets/images/Airtel.png"),
  },
  "9mobile": {
    name: "9mobile",
    slug: "9mobile",
    color: "#006B53",
    logo: require("../assets/images/9Mobile.png"),
  },
};

/**
 * Detect network provider from Nigerian phone number prefix
 * @param phone - Phone number (with or without country code)
 * @returns NetworkProvider slug or null if not detected
 */
export function detectNetworkProvider(phone: string): NetworkProvider | null {
  // Clean the phone number
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Handle different formats
  let prefix: string;

  if (cleaned.startsWith("+234")) {
    // +234XXXXXXXXXX format - convert to 0XXX
    prefix = "0" + cleaned.slice(4, 7);
  } else if (cleaned.startsWith("234")) {
    // 234XXXXXXXXXX format - convert to 0XXX
    prefix = "0" + cleaned.slice(3, 6);
  } else if (cleaned.startsWith("0")) {
    // 0XXXXXXXXXX format
    prefix = cleaned.slice(0, 4);
  } else {
    return null;
  }

  // Check each network's prefixes
  if (MTN_PREFIXES.includes(prefix)) return "mtn";
  if (GLO_PREFIXES.includes(prefix)) return "glo";
  if (AIRTEL_PREFIXES.includes(prefix)) return "airtel";
  if (NINE_MOBILE_PREFIXES.includes(prefix)) return "9mobile";

  return null;
}

/**
 * Get network info by slug
 */
export function getNetworkInfo(slug: NetworkProvider): NetworkInfo {
  return NETWORK_PROVIDERS[slug];
}

/**
 * Validate Nigerian phone number format
 * @param phone - Phone number to validate
 * @returns true if valid 11-digit Nigerian number starting with 0
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Check for 11 digits starting with 0
  if (/^0\d{10}$/.test(cleaned)) {
    return true;
  }

  // Also allow +234 format (14 chars total)
  if (/^\+234\d{10}$/.test(cleaned)) {
    return true;
  }

  // Also allow 234 format (13 chars total)
  if (/^234\d{10}$/.test(cleaned)) {
    return true;
  }

  return false;
}

/**
 * Normalize phone to 11-digit format (0XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+234")) {
    return "0" + cleaned.slice(4);
  }

  if (cleaned.startsWith("234")) {
    return "0" + cleaned.slice(3);
  }

  return cleaned;
}
