import { useEffect, useState, useCallback } from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { appVersionService } from "@/services/app-version.service";
import { AppVersionInfo, VersionCheckState } from "@/types/app-version.types";
import { isVersionLower } from "@/utils/version-comparator";

const SKIPPED_VERSION_KEY = "@nexus_skipped_app_version";
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
  });

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
        try {
          const skipped = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
          console.log("[DEBUG-appVersion] Skipped version in storage:", skipped);
          if (skipped === info.latestVersion) {
            console.log(`[DEBUG-appVersion] Version ${info.latestVersion} was previously skipped by user`);
            setState((prev) => ({
              ...prev,
              visible: false,
              isMandatory: false,
              versionInfo: info,
            }));
            return;
          }
        } catch (e) {
          console.warn("[DEBUG-appVersion] Reading skipped version error", e);
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

    async function initializeVersionCheck() {
      console.log("[DEBUG-appVersion] Starting initializeVersionCheck...");

      // 1. Read device client cache for zero latency startup
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHED_VERSION_KEY);
        if (cachedRaw && mounted) {
          const cachedInfo: AppVersionInfo = JSON.parse(cachedRaw);
          console.log("[DEBUG-appVersion] Found client cached version data:", cachedInfo);
          await evaluateVersionState(cachedInfo, "client-cache");
        }
      } catch (e) {
        console.warn("[DEBUG-appVersion] Reading local version cache error", e);
      }

      // 2. Fetch fresh version data in background
      const res = await appVersionService.getAppVersion();
      if (!mounted) return;

      if (!res.success || !res.data) {
        console.log("[DEBUG-appVersion] API response unsuccessful or data null", res);
        return;
      }

      const freshInfo = res.data;
      console.log("[DEBUG-appVersion] Fresh backend version payload:", freshInfo);

      // 3. Cache fresh version payload on client
      try {
        await AsyncStorage.setItem(CACHED_VERSION_KEY, JSON.stringify(freshInfo));
      } catch (e) {
        console.warn("[DEBUG-appVersion] Storing version cache error", e);
      }

      // 4. Re-evaluate with fresh backend payload
      if (mounted) {
        await evaluateVersionState(freshInfo, "network-fresh");
      }
    }

    initializeVersionCheck();

    return () => {
      mounted = false;
    };
  }, [evaluateVersionState]);

  const handleSkip = async () => {
    if (state.isMandatory || !state.versionInfo) return;

    console.log("[DEBUG-appVersion] User clicked Skip for version:", state.versionInfo.latestVersion);
    try {
      await AsyncStorage.setItem(
        SKIPPED_VERSION_KEY,
        state.versionInfo.latestVersion
      );
    } catch (e) {
      console.warn("[DEBUG-appVersion] Storing skipped version error", e);
    }

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
    handleSkip,
    handleUpgrade,
    invalidateClientCache,
  };
}
