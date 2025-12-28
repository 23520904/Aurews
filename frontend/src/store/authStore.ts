import { create } from "zustand";

// Lấy IP server từ environment variable, nếu không có thì dùng localhost
const getAPIBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  // Fallback: lấy từ window.location (nếu web)
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:6666/api/auth`;
  }
  // Fallback cuối cùng
  return "http://localhost:6666/api/auth";
};

const API_BASE_URL = getAPIBaseURL();

type AuthState = {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  setUser: (u: any) => void;
  clear: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    dateOfBirth: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (u) => set({ user: u }),
  clear: () => set({ user: null, error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      set({ user: data.user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Important for cookies
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Registration failed");
      }

      set({ user: responseData.user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Logout failed");
      }

      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
