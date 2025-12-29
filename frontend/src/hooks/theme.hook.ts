import { useCallback, useEffect } from "react";
import { useThemeStore } from "../stores/theme.store";
import { getTheme } from "../constants/theme";
import type { ThemeMode, ThemeColors } from "../constants/theme";
import { useColorScheme } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

// Standard hooks
export const useTheme = () => useThemeStore((s) => s.colors as ThemeColors);

export const useThemeMode = () => {
  const mode = useThemeStore((s) => s.mode);
  const preference = useThemeStore((s) => s.preference);
  const setMode = useThemeStore((s) => s.setMode);
  const toggle = useThemeStore((s) => s.toggle);
  const setPreference = useThemeStore((s) => s.setPreference);

  const systemScheme = useColorScheme();

  useEffect(() => {
    // CHỈ cập nhật khi preference là "system"
    if (preference === "system" && systemScheme && systemScheme !== mode) {
      setMode(systemScheme as ThemeMode);
    }
  }, [preference, systemScheme]);

  return {
    mode,
    preference,
    setMode,
    setPreference,
    toggleMode: toggle,
  } as const;
};

export const useIsDark = () => useThemeStore((s) => s.mode === "dark");

/**
 * Hook tạo styles animation cho theme.
 * Đã thêm kiểm tra an toàn để tránh lỗi "Immutable Mutation".
 */
export const useAnimatedTheme = (duration = 300) => {
  const mode = useThemeStore((s) => s.mode);

  // Lấy dữ liệu theme với fallback an toàn
  const light = getTheme("light") || {
    background: "#ffffff",
    card: "#ffffff",
    text: "#000000",
  };
  const dark = getTheme("dark") || {
    background: "#121212",
    card: "#1e1e1e",
    text: "#ffffff",
  };

  const progress = useSharedValue(mode === "dark" ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(mode === "dark" ? 1 : 0, { duration });
  }, [mode, duration]);

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [light.background || "#ffffff", dark.background || "#121212"]
      ),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [light.card || "#ffffff", dark.card || "#1e1e1e"]
      ),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 1],
        [light.text || "#000000", dark.text || "#ffffff"]
      ),
    };
  });

  return { progress, backgroundStyle, cardStyle, textStyle } as const;
};
