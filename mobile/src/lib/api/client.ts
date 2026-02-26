import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, endpoints } from './endpoints';
import { secureStorage } from '../storage/secure';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// --- 요청 인터셉터: Access Token 자동 첨부 ---
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 응답 인터셉터: 401 시 토큰 갱신 후 재시도 ---
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // 인증 엔드포인트는 재시도 안함
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(
        `${API_BASE_URL}${endpoints.refreshToken}`,
        { refresh_token: refreshToken },
      );

      const newToken: string = data.access_token;
      await secureStorage.setAccessToken(newToken);
      if (data.refresh_token) {
        await secureStorage.setRefreshToken(data.refresh_token);
      }

      pendingRequests.forEach((cb) => cb(newToken));
      pendingRequests = [];

      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      pendingRequests = [];
      await secureStorage.clearAll();
      // 스토어의 logout은 useAuthStore에서 처리
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
