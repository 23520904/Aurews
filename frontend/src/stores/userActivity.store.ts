import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserActivityState = {
  bookmarkedPostIds: string[];
  likedPostIds: string[];
  followingIds: string[];
  readingHistory: string[];

  // Setters dùng để đồng bộ dữ liệu từ Backend về Store
  setBookmarkedPostIds: (ids: string[]) => void;
  setLikedPostIds: (ids: string[]) => void;
  setFollowingIds: (ids: string[]) => void;

  // Helpers kiểm tra trạng thái nhanh trên UI
  isBookmarked: (postId: string) => boolean;
  isLiked: (postId: string) => boolean;
  isFollowing: (userId: string) => boolean;

  // History xử lý local (theo yêu cầu của bạn trước đó)
  pushHistory: (postId: string) => void;
};

export const useUserActivityStore = create<UserActivityState>()(
  persist(
    (set, get) => ({
      bookmarkedPostIds: [],
      likedPostIds: [],
      followingIds: [],
      readingHistory: [],

      setBookmarkedPostIds: (ids) => set({ bookmarkedPostIds: ids }),
      setLikedPostIds: (ids) => set({ likedPostIds: ids }),
      setFollowingIds: (ids) => set({ followingIds: ids }),

      isBookmarked: (postId) => get().bookmarkedPostIds.includes(postId),
      isLiked: (postId) => get().likedPostIds.includes(postId),
      isFollowing: (userId) => get().followingIds.includes(userId),

      pushHistory: (postId) =>
        set((s) => ({
          readingHistory: [
            postId,
            ...s.readingHistory.filter((id) => id !== postId),
          ].slice(0, 100),
        })),
    }),
    {
      name: "user-activity",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
