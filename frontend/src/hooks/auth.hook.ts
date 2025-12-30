import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, getTokenFromStorage } from "../stores/auth.store";
import { client } from "../api/client";
import type { User } from "../types/type";

// Import các store khác để xử lý side-effect khi logout
import { usePreferenceStore } from "../stores/preference.store";
import { useThemeStore } from "../stores/theme.store";

// 1. Hook kiểm tra đăng nhập (Logic thông minh: Check Storage -> Fetch API)
export const useCheckAuth = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const logoutClient = useAuthStore((s) => s.logout);

  // State nội bộ để kiểm soát luồng
  const [isChecking, setIsChecking] = useState(true); // Đang đọc Storage
  const [shouldFetch, setShouldFetch] = useState(false); // Có nên gọi API không

  // --- LOGIC HELPER: RESET VỀ MẶC ĐỊNH ---
  const resetToGuestMode = () => {
    // 1. Clear dữ liệu user trong store auth
    logoutClient();
    // 2. Clear sở thích (categories...)
    usePreferenceStore.getState().clear();
    // 3. [QUAN TRỌNG] Ép về chế độ Sáng
    useThemeStore.getState().setPreference("light");
  };

  // Bước 1: Khi mount, kiểm tra AsyncStorage trước
  useEffect(() => {
    const checkStorage = async () => {
      const hasToken = await getTokenFromStorage();
      if (hasToken) {
        setShouldFetch(true); // Có token cũ -> Cho phép gọi API check tươi
      } else {
        setShouldFetch(false); // Không có token -> Guest -> Không gọi API

        resetToGuestMode();
      }
      setIsChecking(false); // Đã kiểm tra xong
    };
    checkStorage();
  }, []);

  // Bước 2: React Query chỉ chạy khi shouldFetch = true
  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      return client.get<any>("/users/me");
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
    enabled: !isChecking && shouldFetch, // QUAN TRỌNG: Chỉ chạy khi đã check xong và có token
  });

  // Bước 3: Xử lý kết quả trả về từ API
  useEffect(() => {
    if (query.data) {
      // API trả về user mới nhất -> Cập nhật Store
      const user = query.data.data || query.data;
      setUser(user as User);
    } else if (query.isError) {
      // Token cũ không còn dùng được (Hết hạn/Bị ban) -> Logout sạch sẽ
      resetToGuestMode();
    }
  }, [query.data, query.isError, setUser]);

  // Trả về thêm isChecking để _layout hiển thị màn hình chờ
  return { ...query, isChecking };
};

// 2. Hook cho các hành động Đăng nhập/Đăng ký/Đăng xuất
export const useAuthMutations = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const logoutClient = useAuthStore((s) => s.logout);

  // LOGIN
  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const data = await client.post<any>("/auth/login", payload);
      return data.user || data;
    },
    onSuccess: (user: User) => {
      setUser(user);
      qc.setQueryData(["me"], user);
    },
  });

  // REGISTER
  const registerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const data = await client.post<any>("/auth/register", payload);
      return data.user || data;
    },
    onSuccess: (user: User) => {
      setUser(user);
      qc.setQueryData(["me"], user);
    },
  });

  // LOGOUT
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return client.post("/auth/logout", {});
    },
    onSuccess: () => {
      // 1. Clear Auth State
      logoutClient();

      // 2. Clear Cache
      qc.setQueryData(["me"], null);
      qc.removeQueries();

      // 3. Side Effects (Reset Theme, Prefs)
      usePreferenceStore.getState().clear();
      useThemeStore.getState().setPreference("light");
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
};
