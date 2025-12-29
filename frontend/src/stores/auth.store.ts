import { create } from "zustand";
import type { User } from "../types/type";
import { client } from "../api/client";

type RegisterPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  setUser: (u: User | null) => void;
  setError: (e: string | null) => void;
  clear: () => void;

  fetchMe: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  setUser: (u) => set({ user: u, isAuthenticated: Boolean(u) }),
  setError: (e) => set({ error: e }),
  clear: () => set({ user: null, error: null, isAuthenticated: false }),

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      // client.get throws on error, so we catch it
      const data = await client.get<User>("/users/me");
      set({ user: data, isLoading: false, isAuthenticated: true });
      return data;
    } catch (err: any) {
      // 401/403 etc will end up here
      set({ isLoading: false });
      get().clear();
      // We don't re-throw here because fetchMe is often called speculatively
      return null;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await client.post<any>("/auth/login", { email, password });
      const user = data.user || data;
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (err: any) {
      set({ error: err.message || "Login failed", isLoading: false });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await client.post<any>("/auth/register", payload);
      const user = data.user || data;
      set({ user, isLoading: false, isAuthenticated: true });
      return user;
    } catch (err: any) {
      set({ error: err.message || "Register failed", isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await client.post("/auth/logout", {});
      set({ user: null, isLoading: false, isAuthenticated: false });
    } catch (err: any) {
      set({ error: err.message || "Logout failed", isLoading: false });
      throw err;
    }
  },
}));
