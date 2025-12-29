import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = process.env.EXPO_PUBLIC_BASE_API_URL + "/reports";

// 1. Tạo báo cáo (Report) mới
export const useCreateReport = () =>
  useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Create report failed");
      return res.json();
    },
  });

// 2. Admin: Lấy danh sách các báo cáo
export const useAdminReports = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["adminReports", params],
    queryFn: async () => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      const res = await fetch(`${API}${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

// 3. Admin: Giải quyết (Resolve) báo cáo
export const useResolveReport = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, body }: { reportId: string; body: any }) => {
      const res = await fetch(`${API}/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Resolve failed");
      return res.json();
    },
    onSuccess: () => {
      // Làm mới danh sách báo cáo sau khi xử lý xong
      qc.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });
};
