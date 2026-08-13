import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const NETWORK_AUTO_DETECTION_KEY = "@nexus_network_auto_detection_enabled";

export function useNetworkAutoDetectionPreference() {
  const [isAutoDetectionEnabled, setIsAutoDetectionEnabledState] = useState(true);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(NETWORK_AUTO_DETECTION_KEY)
      .then((storedValue) => {
        if (isMounted && storedValue !== null) {
          setIsAutoDetectionEnabledState(storedValue === "true");
        }
      })
      .catch((error) => {
        console.warn("[NetworkAutoDetection] Failed to load preference:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setIsAutoDetectionEnabled = useCallback(async (enabled: boolean) => {
    setIsAutoDetectionEnabledState(enabled);

    try {
      await AsyncStorage.setItem(NETWORK_AUTO_DETECTION_KEY, enabled ? "true" : "false");
    } catch (error) {
      console.warn("[NetworkAutoDetection] Failed to save preference:", error);
    }
  }, []);

  return {
    isAutoDetectionEnabled,
    setIsAutoDetectionEnabled,
  };
}
