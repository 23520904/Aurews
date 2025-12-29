import { create } from "zustand";

type User = any;

type UserState = {
  profile: User | null;
  bookmarks: any[];
  readingHistory: any[];
  preferences: any | null;
  setProfile: (u: User | null) => void;
  setBookmarks: (b: any[]) => void;
  setReadingHistory: (h: any[]) => void;
  setPreferences: (p: any) => void;
  clear: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  bookmarks: [],
  readingHistory: [],
  preferences: null,
  setProfile: (u) => set({ profile: u }),
  setBookmarks: (b) => set({ bookmarks: b }),
  setReadingHistory: (h) => set({ readingHistory: h }),
  setPreferences: (p) => set({ preferences: p }),
  clear: () => set({ profile: null, bookmarks: [], readingHistory: [], preferences: null }),
}));