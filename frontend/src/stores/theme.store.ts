import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import {
  getTheme,
  DEFAULT_THEME,
  ThemeMode,
  ThemePreference,
  ThemeColors,
} from "../constants/theme";

type ThemeState = {
  mode: ThemeMode;
  preference: ThemePreference;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  setColorsFromMode: (mode: ThemeMode) => void;
  setPreference: (pref: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_THEME.mode,
      preference: "system",
      colors: DEFAULT_THEME,

      setMode: (mode: ThemeMode) => set({ mode, colors: getTheme(mode) }),

      toggle: () => {
        const nextMode: ThemeMode = get().mode === "light" ? "dark" : "light";
        // Ép preference về mode mới để tránh bị system ghi đè lại
        set({
          mode: nextMode,
          colors: getTheme(nextMode),
          preference: nextMode,
        });
      },

      setColorsFromMode: (mode: ThemeMode) =>
        set({ colors: getTheme(mode), mode }),

      setPreference: (pref: ThemePreference) => {
        if (pref === "system") {
          const sys = Appearance.getColorScheme() || "light";
          set({
            preference: "system",
            mode: sys as ThemeMode,
            colors: getTheme(sys as ThemeMode),
          });
        } else {
          set({ preference: pref, mode: pref, colors: getTheme(pref) });
        }
      },
    }),
    {
      name: "user-theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        preference: state.preference,
      }),
      // Sử dụng setState để tránh lỗi truy cập trực tiếp state
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        if (state) {
          const finalMode =
            state.preference === "system"
              ? ((Appearance.getColorScheme() || "light") as ThemeMode)
              : state.mode;

          useThemeStore.setState({
            mode: finalMode,
            colors: getTheme(finalMode),
          });
        }
      },
    }
  )
);
