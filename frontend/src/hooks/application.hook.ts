import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";

// 1. Lấy đơn ứng tuyển của tôi
export const useMyApplication = () =>
  useQuery({
    queryKey: ["myApplication"],
    queryFn: async () => {
      // Dùng client.get thay vì fetch
      const res = await client.get<any>("/applications/me");
      return res.data;
    },
    // Không throw error nếu 404 (chưa có đơn), để UI xử lý hiển thị form
    retry: false,
  });

// 2. Nộp đơn ứng tuyển
export const useSubmitApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Dùng client.post và set Content-Type là multipart/form-data
      const res = await client.post<any>("/applications/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      // Làm mới đơn của cá nhân sau khi nộp thành công
      qc.invalidateQueries({ queryKey: ["myApplication"] });
    },
  });
};

// 3. Admin: Lấy danh sách tất cả các đơn ứng tuyển
export const useAdminApplications = (params?: Record<string, any>) =>
  useQuery({
    queryKey: ["adminApplications", params],
    queryFn: async () => {
      try {
        const res = await client.get<any>("/applications/admin/all", {
          params,
        });
        // Ensure we always return something, preferably an array or expected object
        // Assuming the response data has a structure like { applications: [], total: 0 } or similar
        // If res.data is undefined/null, return a default object.
        return res.data || { applications: [], totalApplications: 0 };
      } catch (error) {
        // Return a safe fallback value instead of undefined
        return { applications: [], totalApplications: 0 };
      }
    },
  });

// 4. Admin: Duyệt/Phản hồi đơn ứng tuyển
export const useReviewApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      applicationId,
      body,
    }: {
      applicationId: string;
      body: any;
    }) => {
      const res = await client.put<any>(
        `/applications/admin/${applicationId}/review`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      // Làm mới danh sách của Admin sau khi Review xong
      qc.invalidateQueries({ queryKey: ["adminApplications"] });
    },
  });
};
