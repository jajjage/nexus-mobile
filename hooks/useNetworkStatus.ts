/**
 * Network Status Hook
 * Monitors network connectivity using @react-native-community/netinfo
 */

import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  isInternetReachable: boolean | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: 'unknown',
    isInternetReachable: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      
      let connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' = 'unknown';
      
      if (!isConnected) {
        connectionType = 'none';
      } else if (state.type === 'wifi') {
        connectionType = 'wifi';
      } else if (state.type === 'cellular') {
        connectionType = 'cellular';
      }

      setStatus({
        isConnected,
        connectionType,
        isInternetReachable,
      });
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      
      let connectionType: 'wifi' | 'cellular' | 'none' | 'unknown' = 'unknown';
      
      if (!isConnected) {
        connectionType = 'none';
      } else if (state.type === 'wifi') {
        connectionType = 'wifi';
      } else if (state.type === 'cellular') {
        connectionType = 'cellular';
      }

      setStatus({
        isConnected,
        connectionType,
        isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
