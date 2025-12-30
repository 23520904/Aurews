// src/hooks/user.hook.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";
import {
  APIResponse,
  Post,
  User,
  Notification,
  PreferencesResponse,
  AuthorStatsResponse,
} from "../types/type";
import { useAuthStore, usePreferenceStore, useThemeStore } from "../stores";

const API_BASE =
  process.env.EXPO_PUBLIC_BASE_API_URL || "http://localhost:3000";

// 1. Lấy thông tin cá nhân
export const useMyProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      return client.get<APIResponse<User>>("/users/me");
    },
    enabled: isAuthenticated,
  });
};

// 2. Cập nhật thông tin cá nhân
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return client.put("/users/me", formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

// 3. Lấy danh sách bookmark
export const useBookmarks = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      return client.get<APIResponse<any[]>>("/users/me/bookmarks");
    },
    staleTime: 1000 * 60,
    enabled: isAuthenticated,
  });
};

// 4. Lấy lịch sử đọc
export const useReadingHistory = (params?: Record<string, any>) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["history", params],
    queryFn: async () => {
      return client.get<APIResponse<any[]>>("/users/me/history", { params });
    },
    enabled: isAuthenticated,
  });
};
// 5. Lấy danh sách bài viết đã like
export const useLikedPosts = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["liked-posts"],
    queryFn: async () => {
      return client.get<APIResponse<Post[]>>("/users/me/likes");
    },
    enabled: isAuthenticated,
  });
};
// 6. Notifications
export const useNotifications = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      return client.get<APIResponse<Notification[]>>("/users/me/notifications");
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 30000 : false,
  });
};
export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return client.put("/users/me/notifications/read", {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// 7. Public User Profile & Connections
export const useUserPublicProfile = (userId: string) =>
  useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      return client.get<APIResponse<User>>(`/users/${userId}/profile`);
    },
    enabled: !!userId,
  });

export const useFollowers = (userId: string) =>
  useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${userId}/followers`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch followers");
      return res.json();
    },
    enabled: !!userId,
  });

export const useFollowing = (userId: string) =>
  useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${userId}/following`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch following");
      return res.json();
    },
    enabled: !!userId,
  });

export const useToggleFollow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE}/users/${userId}/follow`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Follow action failed");
      return res.json();
    },
    onSuccess: (data, userId) => {
      qc.invalidateQueries({ queryKey: ["user", userId] });
      qc.invalidateQueries({ queryKey: ["followers", userId] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

// =========================================================================
// 8. CẬP NHẬT SỞ THÍCH & THEME (ĐÃ FIX LỖI)
// =========================================================================
export const useUserPreferences = () => {
  const hydratePreferences = usePreferenceStore(
    (state) => state.hydratePreferences
  );

  // Dùng setPreference để hỗ trợ cả 'system', 'light', 'dark'
  const setPreference = useThemeStore((state) => state.setPreference);

  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      // Gọi API
      const response = await client.get<PreferencesResponse>(
        "/users/me/preferences"
      );

      // response ở đây chính là body JSON: { success: true, data: {...} }
      // do đó response.data chính là object UserPreferences
      const prefs = response.data;

      // --- SIDE EFFECTS (Cập nhật Store) ---
      if (prefs) {
        // 1. Nạp vào Preference Store (Zustand)
        hydratePreferences(prefs);

        // 2. Cập nhật Giao diện (Theme Store)
        if (prefs.theme) {
          // Ép kiểu 'as any' để tránh lỗi TS checking strict type với store
          // Logic thực tế: backend trả về string khớp với store
          setPreference(prefs.theme as any);
        }
      }

      return response;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// CẬP NHẬT SỞ THÍCH (PUT)
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const setPreference = useThemeStore((state) => state.setPreference);

  return useMutation({
    mutationFn: async (payload: {
      favoriteCategories?: string[];
      theme?: "light" | "dark" | "system";
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    }) => {
      return client.put("/users/me/preferences", payload);
    },
    onSuccess: (data: any, variables) => {
      // Invalidate để fetch lại dữ liệu mới nhất
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });

      // Nếu người dùng đổi theme, cập nhật UI ngay lập tức cho mượt
      if (variables.theme) {
        setPreference(variables.theme as any);
      }
    },
  });
};

// 9. Stats & Dashboard
export const useTopAuthors = (limit: number = 10) => {
  return useQuery({
    queryKey: ["top-authors", limit],
    queryFn: () =>
      client.get<APIResponse<User[]>>(`/users/top-authors?limit=${limit}`),
    staleTime: 1000 * 60 * 10,
  });
};

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: ["search-users", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { data: [] };
      return client.get<APIResponse<User[]>>(
        `/users/search?searchTerm=${searchTerm}`
      );
    },
    enabled: !!searchTerm,
    staleTime: 1000 * 60,
  });
};

export const useUserGrowthStats = (days: number = 7) => {
  return useQuery({
    queryKey: ["userGrowth", days],
    queryFn: async () => {
      const res = await client.get<any>(`/users/analytics/growth?days=${days}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const res = await client.get<any>("/users/analytics/growth");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Thêm vào src/hooks/user.hook.ts
export const useAuthorStats = () => {
  return useQuery({
    queryKey: ["my-author-stats"],
    queryFn: async () => {
      const res : AuthorStatsResponse = await client.get("/users/author/stats");
      // Log để kiểm tra API trả về cái gì
      console.log("🔥 API Response:", JSON.stringify(res.data, null, 2));
      return res.data ;
    },
    staleTime: 5 * 60 * 1000,
  });
};