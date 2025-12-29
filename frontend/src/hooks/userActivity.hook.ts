// src/hooks/userActivity.hook.ts
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { client } from "../api/client";
import { useUserActivityStore } from "../stores/userActivity.store";
import { APIResponse } from "../types/type";
import { useEffect } from "react";

export const useUserActivity = () => {
  const queryClient = useQueryClient();
  const {
    setBookmarkedPostIds,
    bookmarkedPostIds,
    setFollowingIds,
    followingIds,
    isBookmarked, // Lấy helper từ Store để trả về qua Hook
    isFollowing, // Lấy helper từ Store để trả về qua Hook
  } = useUserActivityStore();

  const bookmarkQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await client.get<APIResponse<any[]>>("/users/me/bookmarks");
      return res.data || [];
    },
  });

  useEffect(() => {
    if (bookmarkQuery.data && Array.isArray(bookmarkQuery.data)) {
      const ids = bookmarkQuery.data
        .map((item: any) => item?.post?._id)
        .filter((id) => !!id);
      setBookmarkedPostIds(ids);
    }
  }, [bookmarkQuery.data]);

  const toggleBookmarkMutation = useMutation({
    mutationFn: (postId: string) =>
      client.post(`/users/me/bookmarks/${postId}`),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previousIds = bookmarkedPostIds;
      const exists = bookmarkedPostIds.includes(postId);
      setBookmarkedPostIds(
        exists
          ? bookmarkedPostIds.filter((id) => id !== postId)
          : [postId, ...bookmarkedPostIds]
      );
      return { previousIds };
    },
    onError: (err, postId, context) => {
      if (context) setBookmarkedPostIds(context.previousIds);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: (userId: string) => client.post(`/users/${userId}/follow`),
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({ queryKey: ["me"] });
      await queryClient.cancelQueries({ queryKey: ["following"] });
      const previousFollowingIds = followingIds;
      const exists = followingIds.includes(targetUserId);
      setFollowingIds(
        exists
          ? followingIds.filter((id) => id !== targetUserId)
          : [targetUserId, ...followingIds]
      );
      return { previousFollowingIds };
    },
    onError: (err, targetUserId, context) => {
      if (context) setFollowingIds(context.previousFollowingIds);
    },
    onSettled: (data, error, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["user", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["top-authors"] });
    },
  });

  return {
    bookmarks: bookmarkQuery.data || [],
    isLoading: bookmarkQuery.isLoading,
    toggleBookmark: toggleBookmarkMutation.mutate,
    toggleFollow: toggleFollowMutation.mutate,
    isBookmarked, // Trả về để slug.tsx có thể dùng
    isFollowing, // Trả về để slug.tsx có thể dùng
  };
};
