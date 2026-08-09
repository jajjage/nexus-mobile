import { useEffect, useState, useCallback, useRef } from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { appVersionService } from "@/services/app-version.service";
import { AppVersionInfo, VersionCheckState } from "@/types/app-version.types";
import { isVersionLower } from "@/utils/version-comparator";

const SKIPPED_VERSION_KEY = "@nexus_skipped_app_version"; // Legacy — cleared on startup
const CACHED_VERSION_KEY = "@nexus_cached_app_version_data";

export function useAppVersionCheck() {
  // In Expo Go, Application.nativeApplicationVersion is the Expo Go app version (e.g. 52.0.0).
  // We prioritize Constants.expoConfig?.version ("1.0.1") from app.json for accurate version checking.
  const currentVersion =
    Constants.expoConfig?.version ||
    Application.nativeApplicationVersion ||
    "1.0.1";

  const [state, setState] = useState<VersionCheckState>({
    visible: false,
    isMandatory: false,
    versionInfo: null,
    currentVersion,
    isChecked: false,
  });

  // Session-only skip — dismissed modal comes back on next app launch
  const sessionSkippedRef = useRef<string | null>(null);

  console.log("[DEBUG-appVersion] Initial hook state with currentVersion:", currentVersion);

  const evaluateVersionState = useCallback(
    async (info: AppVersionInfo, source: string) => {
      const isMandatory = isVersionLower(currentVersion, info.minVersion);
      const isOutdated = isVersionLower(currentVersion, info.latestVersion);

      console.log(`[DEBUG-appVersion] Evaluating (${source}):`, {
        currentVersion,
        latestVersion: info.latestVersion,
        minVersion: info.minVersion,
        isOutdated,
        isMandatory,
      });

      if (!isOutdated && !isMandatory) {
        console.log("[DEBUG-appVersion] App is up to date; hiding modal");
        setState((prev) => ({
          ...prev,
          visible: false,
          isMandatory: false,
          versionInfo: info,
        }));
        return;
      }

      if (isMandatory) {
        console.log("[DEBUG-appVersion] MANDATORY update required! Showing force modal");
        setState((prev) => ({
          ...prev,
          visible: true,
          isMandatory: true,
          versionInfo: info,
        }));
      } else {
        // Session-only skip check — uses in-memory ref, not persisted storage
        if (sessionSkippedRef.current === info.latestVersion) {
          console.log(`[DEBUG-appVersion] Version ${info.latestVersion} was skipped this session`);
          setState((prev) => ({
            ...prev,
            visible: false,
            isMandatory: false,
            versionInfo: info,
          }));
          return;
        }

        console.log("[DEBUG-appVersion] OPTIONAL update available! Showing upgrade modal");
        setState((prev) => ({
          ...prev,
          visible: true,
          isMandatory: false,
          versionInfo: info,
        }));
      }
    },
    [currentVersion]
  );

  useEffect(() => {
    let mounted = true;

    // Safety fallback timer to ensure isChecked becomes true even if network hangs
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.log("[DEBUG-appVersion] Safety fallback timer fired; marking version check completed");
        setState((prev) => ({ ...prev, isChecked: true }));
      }
    }, 3500);

    async function initializeVersionCheck() {
      console.log("[DEBUG-appVersion] === Starting initializeVersionCheck ===");

      try {
        // 1. Read device client cache for zero latency startup
        const cachedRaw = await AsyncStorage.getItem(CACHED_VERSION_KEY);
        console.log("[DEBUG-appVersion] Client cache raw:", cachedRaw ? "FOUND" : "EMPTY");
        if (cachedRaw && mounted) {
          const cachedInfo: AppVersionInfo = JSON.parse(cachedRaw);
          console.log("[DEBUG-appVersion] Cached version data:", JSON.stringify(cachedInfo));
          await evaluateVersionState(cachedInfo, "client-cache");
        }

        // 2. Clear any legacy persisted skip (from old AsyncStorage-based skip)
        await AsyncStorage.removeItem(SKIPPED_VERSION_KEY).catch(() => {});

        // 3. Fetch fresh version data from backend
        console.log("[DEBUG-appVersion] About to call appVersionService.getAppVersion()...");
        const res = await appVersionService.getAppVersion();
        console.log("[DEBUG-appVersion] API response:", JSON.stringify(res));
        if (!mounted) return;

        if (!res.success || !res.data) {
          console.log("[DEBUG-appVersion] API response unsuccessful or data null — aborting", {
            success: res.success,
            message: res.message,
            hasData: !!res.data,
          });
          return;
        }

        const freshInfo = res.data;
        console.log("[DEBUG-appVersion] Fresh backend version payload:", JSON.stringify(freshInfo));

        // 4. Cache fresh version payload on client
        await AsyncStorage.setItem(CACHED_VERSION_KEY, JSON.stringify(freshInfo)).catch(() => {});

        // 5. Re-evaluate with fresh backend payload
        if (mounted) {
          console.log("[DEBUG-appVersion] About to evaluate fresh data...");
          await evaluateVersionState(freshInfo, "network-fresh");
        }
      } catch (e) {
        console.warn("[DEBUG-appVersion] Error during version check", e);
      } finally {
        if (mounted) {
          clearTimeout(safetyTimer);
          setState((prev) => ({ ...prev, isChecked: true }));
        }
      }
    }

    initializeVersionCheck();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [evaluateVersionState]);

  const handleSkip = () => {
    if (state.isMandatory || !state.versionInfo) return;

    console.log("[DEBUG-appVersion] User clicked Skip for version:", state.versionInfo.latestVersion);
    // Session-only: store in ref, not AsyncStorage — modal reappears on next app launch
    sessionSkippedRef.current = state.versionInfo.latestVersion;

    setState((prev) => ({ ...prev, visible: false }));
  };

  const handleUpgrade = async () => {
    if (!state.versionInfo) return;

    const url =
      Platform.OS === "ios"
        ? state.versionInfo.iosUrl
        : state.versionInfo.androidUrl;

    console.log("[DEBUG-appVersion] User clicked Upgrade Now, launching URL:", url);

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          const fallbackUrl =
            Platform.OS === "ios"
              ? "https://apps.apple.com"
              : `market://details?id=${Application.applicationId || "com.nexus.mobile"}`;
          await Linking.openURL(fallbackUrl);
        }
      } catch (err) {
        console.error("[DEBUG-appVersion] Error launching store URL", err);
      }
    }
  };

  const invalidateClientCache = async () => {
    console.log("[DEBUG-appVersion] Invalidating client cache...");
    try {
      await AsyncStorage.removeItem(CACHED_VERSION_KEY);
      await AsyncStorage.removeItem(SKIPPED_VERSION_KEY);
    } catch (e) {
      console.warn("[DEBUG-appVersion] Clearing client cache error", e);
    }
  };

  return {
    visible: state.visible,
    isMandatory: state.isMandatory,
    versionInfo: state.versionInfo,
    currentVersion: state.currentVersion,
    isChecked: state.isChecked,
    handleSkip,
    handleUpgrade,
    invalidateClientCache,
  };
}
