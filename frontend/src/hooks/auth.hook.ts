import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";
import { client } from "../api/client"; // Sử dụng ApiClient mới đã có logic refresh token
import type { User } from "../types/type";

export const useCheckAuth = (options?: { enabled?: boolean }) => {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const query = useQuery<any, Error>({
    queryKey: ["me"],
    queryFn: async () => {
      // Dùng client để tận dụng interceptors xử lý 401 và tự động refresh token
      return client.get<any>("/users/me");
    },
    retry: false, // Tránh spam server khi thực sự không có session
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // Dữ liệu user được coi là mới trong 5 phút
  });

  useEffect(() => {
    if (query.data) {
      // Handle both raw User object and APIResponse wrapper
      const user = query.data.data || query.data;
      if (user && user._id) {
        setUser(user as User);
      }
    }
  }, [query.data, setUser]);

  // Chỉ clear store khi có lỗi thực sự (RefreshToken cũng hết hạn)
  useEffect(() => {
    if (query.isError) {
      clear();
    }
  }, [query.isError, clear]);

  return query;
};

export const useAuthMutations = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      // client.post sẽ tự động xử lý credentials: "include"
      const data = await client.post<any>("/auth/login", payload);
      return data.user || data;
    },
    onSuccess: (user: User) => {
      setUser(user);
      // Cập nhật cache ngay lập tức để UI phản hồi nhanh
      qc.setQueryData(["me"], user);
    },
  });

  const register = useMutation({
    mutationFn: async (payload: any) => {
      const data = await client.post<any>("/auth/register", payload);
      return data.user || data;
    },
    onSuccess: (user: User) => {
      setUser(user);
      qc.setQueryData(["me"], user);
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      return client.post("/auth/logout", {});
    },
    onSuccess: () => {
      clear();
      qc.setQueryData(["me"], null);
      qc.removeQueries(); // Xóa sạch cache để đảm bảo an toàn bảo mật
    },
  });

  return { login, register, logout };
};
