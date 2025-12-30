// src/stores/preference.store.ts
import { create } from "zustand";

type PreferenceState = {
  // Đổi tên cho khớp Backend
  favoriteCategories: string[];
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;

  // Actions
  toggleCategory: (category: string) => void;
  setCategories: (categories: string[]) => void;
  setTheme: (mode: "light" | "dark" | "system") => void;
  toggleEmailNotification: () => void;
  togglePushNotification: () => void;

  // Hàm nạp dữ liệu từ API vào Store
  hydratePreferences: (prefs: any) => void;

  // Reset khi đăng xuất
  clear: () => void;
};

export const usePreferenceStore = create<PreferenceState>((set) => ({
  favoriteCategories: [],
  theme: "light",
  emailNotifications: true,
  pushNotifications: false,

  toggleCategory: (category: string) =>
    set((state) => ({
      favoriteCategories: state.favoriteCategories.includes(category)
        ? state.favoriteCategories.filter((c) => c !== category)
        : [...state.favoriteCategories, category],
    })),

  setCategories: (categories: string[]) =>
    set({ favoriteCategories: categories }),

  setTheme: (mode) => set({ theme: mode }),

  toggleEmailNotification: () =>
    set((state) => ({ emailNotifications: !state.emailNotifications })),

  togglePushNotification: () =>
    set((state) => ({ pushNotifications: !state.pushNotifications })),

  hydratePreferences: (prefs) => {
    if (!prefs) return;
    set({
      favoriteCategories: prefs.favoriteCategories || [],
      theme: prefs.theme || "light",
      emailNotifications: prefs.emailNotifications ?? true,
      pushNotifications: prefs.pushNotifications ?? false,
    });
  },

  clear: () =>
    set({
      favoriteCategories: [],
      theme: "light",
      emailNotifications: true,
      pushNotifications: false,
    }),
}));
