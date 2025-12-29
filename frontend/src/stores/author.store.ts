import { useMemo } from "react";
import { useAuthStore } from "./auth.store";
import {
  usePosts,
  useCreatePost,
  useUpdatePostGeneric,
  useDeletePost,
} from "../hooks/post.hook";

export const useAuthorStore = () => {
  const user = useAuthStore((s) => s.user);
  const userId = user?._id as string | undefined;

  // Fetch posts for this author (backend supports ?userId=...)
  // Nếu userId là undefined, không nên gửi request với params undefined
  const postsQuery = usePosts(userId ? { userId } : { enabled: false });
  const myPosts = postsQuery.data?.posts ?? [];

  const createMutation = useCreatePost();
  const updateMutation = useUpdatePostGeneric();
  const deleteMutation = useDeletePost();

  const createPost = async (postData: any) => {
    const form = new FormData();
    Object.entries(postData).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === "thumbnail" && typeof v === "string" && v.startsWith("file:")) {
        const uri = v as string;
        const name = uri.split("/").pop() || "image.jpg";
        const type = "image/jpeg";
        // @ts-ignore - RN FormData file
        form.append("file", { uri, name, type });
      } else {
        form.append(k, String(v));
      }
    });

    return createMutation.mutateAsync(form);
  };

  const updatePost = async (postId: string, postData: any) => {
    const form = new FormData();
    Object.entries(postData).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === "thumbnail" && typeof v === "string" && v.startsWith("file:")) {
        const uri = v as string;
        const name = uri.split("/").pop() || "image.jpg";
        const type = "image/jpeg";
        // @ts-ignore
        form.append("file", { uri, name, type });
      } else {
        form.append(k, String(v));
      }
    });

    return updateMutation.mutateAsync({ postId, formData: form });
  };

  const deletePost = async (postId: string) => {
    return deleteMutation.mutateAsync(postId);
  };

  const getPostById = (postId?: string) => {
    if (!postId) return undefined;
    return myPosts.find((p: any) => p._id === postId);
  };

  return useMemo(
    () => ({
      myPosts,
      createPost,
      updatePost,
      deletePost,
      getPostById,
      loading: postsQuery.isLoading,
      refetch: postsQuery.refetch,
    }),
    [myPosts, postsQuery.isLoading]
  );
};
