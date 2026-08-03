import { useTheme } from "@/context/ThemeContext";
import { DashboardAnnouncement } from "@/types/announcement.types";
import { Volume2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface DashboardAnnouncementBannerProps {
  announcement: DashboardAnnouncement | null;
  onPress?: () => void;
}

const MARQUEE_GAP = 40;
const DURATION_PER_PX = 28;

export function DashboardAnnouncementBanner({
  announcement,
  onPress,
}: DashboardAnnouncementBannerProps) {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animationStarted = useRef(false);

  // Sanitize message — strip newlines, collapse whitespace
  const message = useMemo(() => {
    if (!announcement) return "";
    const title = (announcement.title ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const body = (announcement.message ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return [title, body].filter(Boolean).join(": ");
  }, [announcement]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!message || reduceMotion || measuredWidth === 0) return;
    if (animationStarted.current) return;
    animationStarted.current = true;

    const distance = measuredWidth + MARQUEE_GAP;
    const duration = Math.max(8000, distance * DURATION_PER_PX);

    cancelAnimation(translateX);
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-distance, { duration, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(translateX);
  }, [message, measuredWidth, reduceMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!announcement || !message) return null;

  const handleTextLayout = (e: any) => {
    const lines = e.nativeEvent?.lines;
    if (lines && lines[0]) {
      const w = Math.ceil(lines[0].width);
      if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      {/* Offscreen measurement view */}
      <View style={styles.offscreenMeasure} pointerEvents="none" aria-hidden={true}>
        <Text onTextLayout={handleTextLayout} style={styles.measureText}>
          {message}
        </Text>
      </View>

      <View style={styles.shadowWrapper}>
        {/* Floating Speaker Icon Badge - 36x36px shifted left */}
        <View
          style={[
            styles.floatingIconBadge,
            {
              backgroundColor: isDark ? colors.card : "#dde1e8",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "#D4DADC",
            },
          ]}
          pointerEvents="none"
        >
          <Volume2 color={colors.primary} size={18} strokeWidth={2.4} />
        </View>

        <Pressable
          accessible
          accessibilityLabel={`Announcement: ${message}`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.container,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#EBEBEB",
              borderColor: isDark ? "rgba(255,255,25,0.18)" : "#CECECE",
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          {/* Scrolling text viewport */}
          <View style={styles.viewport} collapsable={false}>
            <Animated.View style={[styles.track, animatedStyle]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.messageText,
                  measuredWidth > 0 && { width: measuredWidth },
                  { color: colors.foreground },
                ]}
              >
                {message}
              </Text>
              {measuredWidth > 0 && (
                <>
                  <View style={{ width: MARQUEE_GAP }} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.messageText,
                      { width: measuredWidth, color: colors.foreground },
                    ]}
                  >
                    {message}
                  </Text>
                </>
              )}
            </Animated.View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: "100%",
  },
  offscreenMeasure: {
    position: "absolute",
    top: -9999,
    left: -9999,
    width: 99999,
    height: 0,
    opacity: 0,
    overflow: "hidden",
  },
  measureText: {
    fontSize: 13,
    fontWeight: "600",
    includeFontPadding: false,
  },
  shadowWrapper: {
    borderRadius: 9999,
    marginBottom: 6,
    marginHorizontal: 16,
    marginTop: 2,
    position: "relative",
    shadowColor: "#b6c7e4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingIconBadge: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    height: 36,
    justifyContent: "center",
    left: -6,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    top: -1,
    width: 36,
    zIndex: 10,
  },
  container: {
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: "row",
    height: 34,
    overflow: "hidden",
    paddingLeft: 40,
    paddingRight: 12,
  },
  viewport: {
    flex: 1,
    height: 34,
    justifyContent: "center",
    overflow: "hidden",
  },
  track: {
    alignItems: "center",
    flexDirection: "row",
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    includeFontPadding: false,
  },
});