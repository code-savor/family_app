import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/domains/auth/store';
import { configureNotificationHandler, registerPushToken } from '@/lib/notifications/setup';
import {
  setupNotificationTapHandler,
  setupForegroundNotificationListener,
  handleLaunchNotification,
} from '@/lib/notifications/handlers';

// 앱 시작 시 포그라운드 알림 표시 설정 (인증과 무관)
configureNotificationHandler();

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pushRegistered = useRef(false);

  // 세션 복원
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // 알림 탭 핸들러 + 포그라운드 리스너 (앱 전체 생명주기)
  useEffect(() => {
    const cleanupTap = setupNotificationTapHandler();
    const cleanupFg = setupForegroundNotificationListener();
    handleLaunchNotification();

    return () => {
      cleanupTap();
      cleanupFg();
    };
  }, []);

  // 인증 완료 후 Push Token 등록 (한 번만)
  useEffect(() => {
    if (isAuthenticated && !pushRegistered.current) {
      pushRegistered.current = true;
      registerPushToken();
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="invite" />
      </Stack>
    </SafeAreaProvider>
  );
}
