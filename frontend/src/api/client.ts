
const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_API_URL || "http://localhost:5000/api";

type RequestConfig = RequestInit & {
  params?: Record<string, any>;
};

class ApiClient {
  private isRefreshing = false;
  private failedQueue: any[] = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, ...customConfig } = config;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((customConfig.headers as Record<string, string>) || {}),
    };

    if (customConfig.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    let url = `${BASE_URL}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const configWithDefaults: RequestInit = {
      ...customConfig,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, configWithDefaults);

      if (
        response.status === 401 &&
        !endpoint.includes("/auth/refresh-token") &&
        !endpoint.includes("/auth/login")
      ) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => this.request<T>(endpoint, config));
        }

        this.isRefreshing = true;

        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            this.processQueue(null);
            this.isRefreshing = false;
            return this.request<T>(endpoint, config);
          } else {
            throw new Error("Refresh token expired");
          }
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          this.isRefreshing = false;

          // BƯỚC 2: Truy cập Store bằng cách require trực tiếp bên trong hàm xử lý lỗi
          // Cách này đảm bảo Store chỉ được gọi sau khi toàn bộ App đã khởi tạo xong
          const { useAuthStore } = require("../stores/auth.store");
          useAuthStore.getState().clear();

          throw refreshError;
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: data.message || `Error ${response.status}`,
          data,
        };
      }

      if (response.status === 204) return {} as T;
      return await response.json();
    } catch (error: any) {
      console.error(`[API Error ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // --- Public Methods ---
  get<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, config?: RequestConfig) {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const client = new ApiClient();
