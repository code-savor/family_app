import { useAuthStore } from './store';

// 필요한 상태만 구독 (불필요한 리렌더 방지)
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.isAuthenticated);

export const useIsLoading = () =>
  useAuthStore((s) => s.isLoading);

export const useMember = () =>
  useAuthStore((s) => s.member);

export const useAuthActions = () =>
  useAuthStore((s) => ({
    login: s.login,
    createFamily: s.createFamily,
    joinFamily: s.joinFamily,
    logout: s.logout,
    restoreSession: s.restoreSession,
  }));
