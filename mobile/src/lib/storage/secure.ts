import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  MEMBER: 'member',
} as const;

// 웹에서는 SecureStore가 동작하지 않으므로 localStorage 폴백 사용
const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : {
  getItemAsync: SecureStore.getItemAsync,
  setItemAsync: SecureStore.setItemAsync,
  deleteItemAsync: SecureStore.deleteItemAsync,
};

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return storage.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async setAccessToken(token: string): Promise<void> {
    await storage.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string): Promise<void> {
    await storage.setItemAsync(KEYS.REFRESH_TOKEN, token);
  },

  async getMember(): Promise<string | null> {
    return storage.getItemAsync(KEYS.MEMBER);
  },
  async setMember(member: object): Promise<void> {
    await storage.setItemAsync(KEYS.MEMBER, JSON.stringify(member));
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      storage.deleteItemAsync(KEYS.ACCESS_TOKEN),
      storage.deleteItemAsync(KEYS.REFRESH_TOKEN),
      storage.deleteItemAsync(KEYS.MEMBER),
    ]);
  },
};
