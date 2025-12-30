import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types/type";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (u: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (u) => set({ user: u, isAuthenticated: !!u }),

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // Tên key trong AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hàm tiện ích để kiểm tra nhanh trong AsyncStorage có dữ liệu User/Token không.
 * Dùng để quyết định có nên gọi API /users/me khi mở app hay không.
 */
export const getTokenFromStorage = async (): Promise<boolean> => {
  try {
    const stateStr = await AsyncStorage.getItem("auth-storage");
    if (stateStr) {
      const parsed = JSON.parse(stateStr);
      // Kiểm tra xem state đã lưu có user và isAuthenticated = true không
      return !!(parsed.state?.user && parsed.state?.isAuthenticated);
    }
    return false;
  } catch (error) {
    return false;
  }
};
