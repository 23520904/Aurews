// src/stores/preference.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PostCategory } from "../types/type";

export const DEFAULT_CATEGORIES = [
  { id: "for_you", label: "Dành cho bạn" },
  { id: "all", label: "Tất cả" },
  { id: PostCategory.Technology, label: "Công nghệ" },
  { id: PostCategory.Business, label: "Kinh doanh" },
  { id: PostCategory.Sports, label: "Thể thao" },
  { id: PostCategory.Entertainment, label: "Giải trí" },
  { id: PostCategory.Health, label: "Sức khỏe" },
  { id: PostCategory.Science, label: "Khoa học" },
  { id: PostCategory.Politics, label: "Chính trị" },
];

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
  // [NEW] Lưu danh sách ID đã sắp xếp
  sortedCategoryIds: string[];

  // [NEW] Hàm cập nhật thứ tự
  setSortedCategories: (ids: string[]) => void;

  // Reset khi đăng xuất
  clear: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      favoriteCategories: [],
      sortedCategoryIds: DEFAULT_CATEGORIES.map((c) => c.id),
      theme: "light",
      emailNotifications: true,
      pushNotifications: false,
      fontSize: 17,
      setFontSize: (size) => set({ fontSize: size }),

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

      setSortedCategories: (ids) => set({ sortedCategoryIds: ids }),

      hydratePreferences: (prefs) => {
        if (!prefs) return;
        set({
          favoriteCategories: prefs.favoriteCategories || [],
          theme: prefs.theme || "light",
          emailNotifications: prefs.emailNotifications ?? true,
          pushNotifications: prefs.pushNotifications ?? false,
          fontSize: prefs.fontSize || 17,
          // Nếu muốn hydrate cả sortedCategoryIds từ API (nếu có) thì thêm vào đây
        });
      },

      clear: () =>
        set({
          favoriteCategories: [],
          theme: "light",
          emailNotifications: true,
          pushNotifications: false,
        }),
    }),
    {
      name: "preference-storage", // Tên key trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage), // Sử dụng AsyncStorage
    }
  )
);
