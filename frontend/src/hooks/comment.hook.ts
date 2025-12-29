import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = process.env.EXPO_PUBLIC_BASE_API_URL + "/comments";

export const useComments = (postId?: string, parentId?: string) =>
  useQuery({
    queryKey: ["comments", postId, parentId],
    queryFn: async () => {
      const qs = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
      const res = await fetch(`${API}/${postId}${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
    enabled: !!postId, // Chỉ tự động chạy khi có postId
    refetchInterval: 1000, // Poll every 1s for near real-time updates
  });

export const useCreateComment = (postId?: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      content: string;
      parentCommentId?: string;
    }) => {
      if (!postId) throw new Error("Post ID is required to comment");

      const res = await fetch(`${API}/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Create comment failed");
      return res.json();
    },
    onSuccess: () => {
      // Làm mới danh sách comment của bài viết này
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
};

export const useDeleteComment = (postId?: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`${API}/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete comment failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
};

export const useToggleLikeComment = (postId?: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`${API}/like/${commentId}`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Like comment failed");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate broadly to ensure root comments AND replies are updated
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });
};
