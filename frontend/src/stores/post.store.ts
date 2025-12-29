import { create } from "zustand";
import type { Post } from "../types/type";

type PostsState = {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  setPosts: (p: Post[]) => void;
  setCurrentPost: (p: Post | null) => void;
  clear: () => void;
};

export const usePostsStore = create<PostsState>((set) => ({
  posts: [],
  currentPost: null,
  isLoading: false,
  setPosts: (p) => set({ posts: p }),
  setCurrentPost: (p) => set({ currentPost: p }),
  clear: () => set({ posts: [], currentPost: null }),
}));