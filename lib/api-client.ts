// lib/api-client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_AUTH_URL || "http://10.152.118.138:3000/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request: Add Authorization header
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Handle 401, refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${BASE_URL}/mobile/auth/refresh`, {
          refreshToken,
        });
        
        // Handle nested data structure (response.data.data) or flat structure
        const authData = response.data.data || response.data;

        if (authData.accessToken && typeof authData.accessToken === 'string') {
          await tokenStorage.setAccessToken(authData.accessToken);
          // Update the header on the original request
          originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
        }
        if (authData.refreshToken && typeof authData.refreshToken === 'string') {
          await tokenStorage.setRefreshToken(authData.refreshToken);
        }

        processQueue(null);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError);
        isRefreshing = false;
        await tokenStorage.clearTokens();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
