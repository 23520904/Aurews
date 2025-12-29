import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { client } from "../api/client";
import { PostsResponse, APIResponse, Post } from "../types/type";

// Hook lấy danh sách bài viết (Cơ bản)
export const usePosts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async () => {
      return client.get<PostsResponse>("/posts", { params });
    },
  });
};

// Hook lấy danh sách bài viết (Infinite Scroll)
export const useInfinitePosts = (
  limit: number = 10,
  params?: Record<string, any>
) => {
  return useInfiniteQuery({
    queryKey: ["posts-infinite", params], // Key khác biệt để không lẫn với usePosts thường
    queryFn: async ({ pageParam = 1 }) => {
      const response = await client.get<PostsResponse>("/posts", {
        params: {
          ...params,
          page: pageParam,
          limit: limit,
        },
      });
      // Trả về data trực tiếp để React Query cache
      return response;
    },
    getNextPageParam: (lastPage) => {
      // lastPage là response từ server (đã qua interceptor của client axios hoặc trả về data trực tiếp)
      // Nếu client axios trả về data: lastPage.nextPage
      // Kiểm tra structure response: { posts: [], totalPages: ... }
      if (
        lastPage.currentPage !== undefined &&
        lastPage.totalPages !== undefined &&
        lastPage.currentPage < lastPage.totalPages
      ) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return client.post("/posts", formData);
    },
    onMutate: async (formData: FormData) => {
      await qc.cancelQueries({ queryKey: ["posts"] });
      const previous = qc.getQueryData(["posts"]);

      const getVal = (k: string) => {
        const val = formData.get(k);
        return val ? String(val) : "";
      };

      const optimistic = {
        _id: `temp-${Date.now()}`,
        title: getVal("title") || "Untitled",
        thumbnail: getVal("thumbnail") || "",
        category: getVal("category") || "",
        status: getVal("status") || "draft",
        publishTime: new Date().toISOString(),
        isTemp: true,
        views: 0,
        author: { name: "Me", avatar: "" },
      };

      qc.setQueryData(["posts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: [optimistic, ...(old.posts || [])],
          totalPosts: (old.totalPosts || 0) + 1,
        };
      });

      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) qc.setQueryData(["posts"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useUpdatePostGeneric = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      formData,
    }: {
      postId: string;
      formData: FormData;
    }) => {
      return client.put(`/posts/${postId}`, formData);
    },
    onMutate: async ({ postId, formData }) => {
      await qc.cancelQueries({ queryKey: ["posts"] });
      const prevPosts = qc.getQueryData(["posts"]);
      const prevPost = qc.getQueryData(["post", postId]);

      const getVal = (k: string) => {
        const val = formData.get(k);
        return val ? String(val) : "";
      };

      qc.setQueryData(["posts"], (old: any) => {
        if (!old) return old;
        const updated = (old.posts || []).map((p: any) => {
          if (p._id === postId) {
            return {
              ...p,
              title: getVal("title") || p.title,
              category: getVal("category") || p.category,
              thumbnail: getVal("thumbnail") || p.thumbnail,
            };
          }
          return p;
        });
        return { ...old, posts: updated };
      });

      qc.setQueryData(["post", postId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            title: getVal("title") || old.data.title,
            category: getVal("category") || old.data.category,
          },
        };
      });

      return { prevPosts, prevPost };
    },
    onError: (err, variables, context: any) => {
      if (context?.prevPosts) qc.setQueryData(["posts"], context.prevPosts);
      if (context?.prevPost)
        qc.setQueryData(["post", variables.postId], context.prevPost);
    },
    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post", variables.postId] });
    },
  });
};

// --- ĐÃ SỬA LỖI TOGGLE LIKE ---
export const useToggleLike = (postId: string, slug?: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return client.post(`/posts/${postId}/like`);
    },
    onSettled: () => {
      // Đồng bộ lại với server
      qc.invalidateQueries({ queryKey: ["post", postId] });
      if (slug) qc.invalidateQueries({ queryKey: ["post", slug] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const usePost = (slugOrId?: string) =>
  useQuery({
    queryKey: ["post", slugOrId],
    queryFn: async () => {
      return client.get<APIResponse<Post>>(`/posts/${slugOrId}`);
    },
    enabled: !!slugOrId,
    refetchInterval: 1000, // Poll every 1s for near real-time updates
  });

// Hook chuyên dụng cho trang Author Manage
export const useMyPosts = (params?: {
  searchTerm?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["my-posts", params],
    queryFn: async () => {
      // Truyền params xuống API client
      return client.get<PostsResponse>("/posts/me", { params });
    },
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      return client.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      // Quan trọng: Làm mới danh sách bài viết của tôi ngay lập tức
      qc.invalidateQueries({ queryKey: ["my-posts"] });

      // Làm mới các query khác nếu cần
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

export const useRestorePost = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // Gọi API restore (Method PUT như đã khai báo ở backend)
      return client.put(`/posts/${postId}/restore`);
    },
    onSuccess: (data, postId) => {
      // 1. Làm mới danh sách "Bài viết của tôi"
      // Để bài viết biến mất khỏi tab "Lưu trữ" và hiện lại bên "Nháp"
      qc.invalidateQueries({ queryKey: ["my-posts"] });

      // 2. Làm mới chi tiết bài viết (nếu đang xem)
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (error: any) => {
      console.log("Restore error:", error);
    },
  });
};
// --- HOOK MỚI: Lấy bài viết của tôi (Infinite Scroll) ---
export const useInfiniteMyPosts = (
  limit: number = 10,
  params?: { searchTerm?: string; status?: string }
) => {
  return useInfiniteQuery({
    queryKey: ["my-posts-infinite", params], // Key bao gồm cả params để reset khi filter đổi
    queryFn: async ({ pageParam = 1 }) => {
      // Gọi API với tham số page và limit
      return client.get<any>("/posts/me", {
        params: {
          ...params,
          page: pageParam,
          limit: limit,
        },
      });
    },
    // Tính toán trang tiếp theo dựa trên response từ backend
    getNextPageParam: (lastPage) => {
      // lastPage là dữ liệu JSON trả về từ backend (đã qua axios interceptor)
      // Cấu trúc mong đợi: { posts: [], currentPage: 1, totalPages: 5, ... }
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined; // Không còn trang nào nữa
    },
    initialPageParam: 1,
  });
};