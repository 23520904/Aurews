import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";
import { APIResponse, Post, User, Notification } from "../types/type";

const API_BASE =
  process.env.EXPO_PUBLIC_BASE_API_URL || "http://localhost:3000";

// 1. Lấy thông tin cá nhân
export const useMyProfile = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      return client.get<APIResponse<User>>("/users/me");
    },
  });

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
export const useBookmarks = () =>
  useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      return client.get<APIResponse<any[]>>("/users/me/bookmarks");
    },
    staleTime: 1000 * 60,
  });

// 4. Lấy lịch sử đọc
export const useReadingHistory = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["history", params],
    queryFn: async () => {
      return client.get<APIResponse<any[]>>("/users/me/history", { params });
    },
  });

// 5. Lấy danh sách bài viết đã like
export const useLikedPosts = () =>
  useQuery({
    queryKey: ["liked-posts"],
    queryFn: async () => {
      return client.get<APIResponse<Post[]>>("/users/me/likes");
    },
  });

// 6. Notifications
export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      return client.get<APIResponse<Notification[]>>("/users/me/notifications");
    },
  });

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

// 8. Cập nhật sở thích (Đồng bộ danh mục theo dõi)
export const useUpdatePreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { favoriteCategories: string[] }) => {
      return client.put("/users/me/preferences", data);
    },
    onSuccess: () => {
      // Cập nhật lại cache sở thích sau khi lưu thành công
      qc.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
};

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
      // client.get returns the parsed JSON body directly
      const res = await client.get<any>(`/users/analytics/growth?days=${days}`);
      return res.data; // { chartData: [...], totalUsers: ... }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const res = await client.get<any>("/users/analytics/growth");
      // Đảm bảo route backend đã đổi tên hoặc trỏ đúng hàm controller mới
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};