/**
 * Haptic Feedback Utility
 * Wrapper for haptic feedback that respects user preferences
 */

import { getAppPreferences } from "@/hooks/useAppPreferences";
import * as Haptics from "expo-haptics";

export const triggerHaptic = {
  selection: () => {
    const prefs = getAppPreferences();
    if (prefs.hapticsEnabled) {
      Haptics.selectionAsync();
    }
  },

  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    const prefs = getAppPreferences();
    if (prefs.hapticsEnabled) {
      Haptics.impactAsync(style);
    }
  },

  notification: (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    const prefs = getAppPreferences();
    if (prefs.hapticsEnabled) {
      Haptics.notificationAsync(type);
    }
  },
};
