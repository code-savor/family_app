import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type {
  AuthTokens, LoginParams, CreateFamilyParams, JoinFamilyParams,
} from './types';

export const authApi = {
  async login(params: LoginParams): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(endpoints.login, params);
    return data;
  },

  async createFamily(params: CreateFamilyParams): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(endpoints.createFamily, params);
    return data;
  },

  async joinFamily(params: JoinFamilyParams): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(
      endpoints.joinFamily(params.token),
      { nickname: params.nickname, pin: params.pin },
    );
    return data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(endpoints.refreshToken, {
      refresh_token: refreshToken,
    });
    return data;
  },
};
