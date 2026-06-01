import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

const INSTALL_REFERRER_CHECKED_KEY = "@nexus_install_referrer_checked";
const PENDING_AGENT_CODE_KEY = "@nexus_pending_agent_code";
const RAW_INSTALL_REFERRER_KEY = "@nexus_raw_install_referrer";
let capturePromise: Promise<string | null> | null = null;

const decodeReferrer = (value: string): string => {
  let decoded = value.trim();

  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded.replace(/\+/g, "%20"));
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded.trim();
};

const parseKeyValueReferrer = (referrer: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const query = referrer.includes("?") ? referrer.split("?").pop() || "" : referrer;

  query.split("&").forEach((part) => {
    const [rawKey, ...rawValueParts] = part.split("=");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValueParts.join("=").trim();

    if (key && value) {
      result[key] = value;
    }
  });

  return result;
};

export const extractAgentCodeFromReferrer = (rawReferrer?: string | null) => {
  if (!rawReferrer) return null;

  const referrer = decodeReferrer(rawReferrer);
  const params = parseKeyValueReferrer(referrer);
  const value =
    params.agentcode ||
    params.agent_code ||
    params.code ||
    params.referralcode ||
    params.referral_code ||
    null;

  const code = (value || referrer).trim().toUpperCase();

  if (!code || code.includes("=") || code.includes("&")) {
    return null;
  }

  return code.replace(/^REF[_-]/, "").trim() || null;
};

export const installReferrerService = {
  async captureInstallReferrerOnce(): Promise<string | null> {
    if (capturePromise) {
      return capturePromise;
    }

    capturePromise = this.captureInstallReferrer().finally(() => {
      capturePromise = null;
    });

    return capturePromise;
  },

  async captureInstallReferrer(): Promise<string | null> {
    const existingCode = await AsyncStorage.getItem(PENDING_AGENT_CODE_KEY);
    const hasChecked = await AsyncStorage.getItem(INSTALL_REFERRER_CHECKED_KEY);

    if (hasChecked === "true") {
      return existingCode;
    }

    if (Platform.OS !== "android") {
      await AsyncStorage.setItem(INSTALL_REFERRER_CHECKED_KEY, "true");
      return existingCode;
    }

    try {
      const rawReferrer = await Application.getInstallReferrerAsync();
      const agentCode = extractAgentCodeFromReferrer(rawReferrer);

      if (rawReferrer) {
        await AsyncStorage.setItem(RAW_INSTALL_REFERRER_KEY, rawReferrer);
      }

      if (agentCode && !existingCode) {
        await AsyncStorage.setItem(PENDING_AGENT_CODE_KEY, agentCode);
        await AsyncStorage.setItem(INSTALL_REFERRER_CHECKED_KEY, "true");
        return agentCode;
      }

      await AsyncStorage.setItem(INSTALL_REFERRER_CHECKED_KEY, "true");
      return existingCode;
    } catch (error) {
      console.warn(
        "[InstallReferrer] Unable to read install referrer:",
        error instanceof Error ? error.message : error
      );
      await AsyncStorage.setItem(INSTALL_REFERRER_CHECKED_KEY, "true");
      return existingCode;
    }
  },

  async getPendingAgentCode(): Promise<string | null> {
    return AsyncStorage.getItem(PENDING_AGENT_CODE_KEY);
  },

  async setPendingAgentCode(agentCode: string): Promise<void> {
    const normalized = agentCode.trim().toUpperCase();
    if (normalized) {
      await AsyncStorage.setItem(PENDING_AGENT_CODE_KEY, normalized);
    }
  },

  async clearPendingAgentCode(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_AGENT_CODE_KEY);
  },
};
