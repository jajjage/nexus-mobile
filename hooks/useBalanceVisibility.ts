import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const BALANCE_VISIBILITY_KEY = "balance_visibility";

export function useBalanceVisibility() {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const loadVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem(BALANCE_VISIBILITY_KEY);
        if (stored !== null) {
          setIsBalanceVisible(stored === "true");
        }
      } catch (error) {
        console.error("Failed to load balance visibility", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVisibility();
  }, []);

  // Toggle function that persists state
  const toggleBalanceVisibility = async () => {
    try {
      const newValue = !isBalanceVisible;
      setIsBalanceVisible(newValue);
      await AsyncStorage.setItem(BALANCE_VISIBILITY_KEY, String(newValue));
    } catch (error) {
      console.error("Failed to save balance visibility", error);
      // Revert state if save fails? simpler to just log for now
    }
  };

  return { isBalanceVisible, toggleBalanceVisibility, isLoading };
}
