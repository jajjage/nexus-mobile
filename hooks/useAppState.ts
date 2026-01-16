// hooks/useAppState.ts
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppStateChange(
  onForeground: () => void,
  onBackground: () => void
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        onForeground();
      } else if (
        appState.current === "active" &&
        nextState.match(/inactive|background/)
      ) {
        onBackground();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [onForeground, onBackground]);
}

export function useAppState() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return {
    isActive: () => appState.current === "active",
    isBackground: () => appState.current.match(/inactive|background/) !== null,
    currentState: appState,
  };
}
