import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { colors, typography, spacing } from '@/theme';

export default function InviteDeepLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiClient
      .get(endpoints.validateInvite(token))
      .then(() => {
        router.replace({ pathname: '/(auth)/join', params: { token } });
      })
      .catch(() => {
        setError('유효하지 않거나 만료된 초대 링크입니다');
        setChecking(false);
      });
  }, [token]);

  return (
    <View style={styles.center}>
      {checking ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>초대 링크 확인 중...</Text>
        </>
      ) : (
        <>
          <Text style={styles.emoji}>😢</Text>
          <Text style={typography.h3}>{error}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  emoji: { fontSize: 48 },
  text: { color: colors.textSecondary, fontSize: 15 },
});
