import { create } from "zustand";

type Comment = any;

type CommentsState = {
  // map postId -> comments[]
  commentsMap: Record<string, Comment[]>;
  isLoading: boolean;
  setCommentsForPost: (postId: string, comments: Comment[]) => void;
  appendCommentToPost: (postId: string, comment: Comment) => void;
  clear: () => void;
};

export const useCommentsStore = create<CommentsState>((set, get) => ({
  commentsMap: {},
  isLoading: false,
  setCommentsForPost: (postId, comments) =>
    set((s) => ({ commentsMap: { ...s.commentsMap, [postId]: comments } })),
  appendCommentToPost: (postId, comment) =>
    set((s) => {
      const existing = s.commentsMap[postId] || [];
      return { commentsMap: { ...s.commentsMap, [postId]: [comment, ...existing] } };
    }),
  clear: () => set({ commentsMap: {} }),
}));