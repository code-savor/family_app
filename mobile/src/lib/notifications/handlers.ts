import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

type CleanupFn = () => void;

/**
 * 알림 탭 리스너 등록.
 * data.meal_call_id 가 있으면 해당 밥먹자 상세 화면으로 이동.
 */
export function setupNotificationTapHandler(): CleanupFn {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const mealCallId = data?.meal_call_id as string | undefined;

    if (mealCallId) {
      router.push(`/(main)/(home)/meal-call/${mealCallId}`);
    }
  });

  return () => sub.remove();
}

/**
 * 포그라운드 알림 수신 리스너 (필요 시 In-App 토스트 표시 등에 활용).
 */
export function setupForegroundNotificationListener(): CleanupFn {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    console.log('[Push] 포그라운드 알림 수신:', notification.request.content.title, data);
  });

  return () => sub.remove();
}

/**
 * 앱이 종료된 상태에서 알림을 탭해 시작된 경우 처리.
 * 앱 최초 마운트 시 한 번 호출.
 */
export async function handleLaunchNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  const data = response.notification.request.content.data as Record<string, unknown>;
  const mealCallId = data?.meal_call_id as string | undefined;
  if (mealCallId) {
    setTimeout(() => {
      router.push(`/(main)/(home)/meal-call/${mealCallId}`);
    }, 300);
  }
}
