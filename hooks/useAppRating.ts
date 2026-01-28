import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { useEffect } from "react";

const RATING_KEY = "rating_last_prompt";
const DAYS_90 = 90 * 24 * 60 * 60 * 1000;

export function useAppRating() {
  useEffect(() => {
    checkRatingEligibility();
  }, []);

  const checkRatingEligibility = async () => {
    try {
      const lastPrompt = await AsyncStorage.getItem(RATING_KEY);
      const now = Date.now();

      if (lastPrompt === null) {
        // First time app launch ever (or since storage clear)
        // Initialize timestamp so we wait 90 days before first prompt
        await AsyncStorage.setItem(RATING_KEY, now.toString());
        return;
      }

      const lastPromptDate = parseInt(lastPrompt, 10);
      const timeSinceLast = now - lastPromptDate;

      if (timeSinceLast > DAYS_90) {
        // Time to prompt!
        if (await StoreReview.hasAction()) {
          console.log("[AppRating] Requesting store review");
          await StoreReview.requestReview();
          
          // Update timestamp to wait another 90 days
          await AsyncStorage.setItem(RATING_KEY, now.toString());
        }
      }
    } catch (error) {
      console.error("[AppRating] Error checking rating eligibility:", error);
    }
  };
}
