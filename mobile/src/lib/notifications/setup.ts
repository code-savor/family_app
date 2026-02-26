import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

/**
 * 포그라운드에서 알림을 표시하는 기본 핸들러 설정.
 * 앱 시작 직후 (인증 여부와 무관하게) 호출한다.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Android 알림 채널 생성 (Android 전용).
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('meal-call', {
    name: '밥먹자',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF8C42',
    sound: 'default',
  });
}

/**
 * 알림 권한 요청 → Expo Push Token 획득 → 백엔드에 등록.
 * 인증 완료 후 호출한다. 실패해도 앱 동작에는 영향 없음.
 */
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await ensureAndroidChannel();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] 알림 권한 거부됨');
      return;
    }

    // projectId: EAS 빌드 시 자동 주입, 없으면 Expo Go 테스트용으로 생략
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    console.log('[Push] 토큰 획득:', token.slice(0, 30) + '...');

    await apiClient.post(endpoints.devices, { expo_push_token: token });
    console.log('[Push] 백엔드 토큰 등록 완료');
  } catch (e) {
    // 실기기/EAS 없이는 실패 가능 — 로그만 출력하고 계속 진행
    console.warn('[Push] 토큰 등록 실패 (개발환경에서는 정상):', e);
  }
}
