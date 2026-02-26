import { create } from 'zustand';
import { secureStorage } from '@/lib/storage/secure';
import { authApi } from './api';
import type { Member, LoginParams, CreateFamilyParams, JoinFamilyParams } from './types';

interface AuthState {
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (params: LoginParams) => Promise<void>;
  createFamily: (params: CreateFamilyParams) => Promise<void>;
  joinFamily: (params: JoinFamilyParams) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const initialState: AuthState = {
  member: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  login: async (params) => {
    const tokens = await authApi.login(params);
    await _persist(tokens.access_token, tokens.refresh_token, tokens.member);
    set({
      member: tokens.member,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
  },

  createFamily: async (params) => {
    const tokens = await authApi.createFamily(params);
    await _persist(tokens.access_token, tokens.refresh_token, tokens.member);
    set({
      member: tokens.member,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
  },

  joinFamily: async (params) => {
    const tokens = await authApi.joinFamily(params);
    await _persist(tokens.access_token, tokens.refresh_token, tokens.member);
    set({
      member: tokens.member,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await secureStorage.clearAll();
    set({ ...initialState, isLoading: false });
  },

  restoreSession: async () => {
    try {
      const [accessToken, refreshToken, memberStr] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getRefreshToken(),
        secureStorage.getMember(),
      ]);

      if (accessToken && refreshToken && memberStr) {
        const member: Member = JSON.parse(memberStr);
        set({
          member,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

async function _persist(
  accessToken: string,
  refreshToken: string,
  member: Member | null,
): Promise<void> {
  await Promise.all([
    secureStorage.setAccessToken(accessToken),
    secureStorage.setRefreshToken(refreshToken),
    member ? secureStorage.setMember(member) : Promise.resolve(),
  ]);
}
