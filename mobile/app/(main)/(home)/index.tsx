import { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EmptyState } from '@/components/layout/EmptyState';
import { MealCallCard } from '@/components/meal-call/MealCallCard';
import { useMealCallStore } from '@/domains/meal-call/store';
import { useAuthStore } from '@/domains/auth/store';
import { colors, spacing, radius, shadow, typography } from '@/theme';

const POLL_INTERVAL = 10_000;

export default function HomeScreen() {
  const activeMealCall = useMealCallStore((s) => s.activeMealCall);
  const isLoading = useMealCallStore((s) => s.isLoadingActive);
  const fetchActive = useMealCallStore((s) => s.fetchActive);
  const member = useAuthStore((s) => s.member);

  // 마운트 시 + 10초 폴링
  useEffect(() => {
    fetchActive();
    const id = setInterval(fetchActive, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchActive]);

  const handleRefresh = useCallback(() => {
    fetchActive();
  }, [fetchActive]);

  const handleCreate = useCallback(() => {
    router.push('/(main)/(home)/meal-call/create');
  }, []);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={typography.h2}>🍚 밥먹자</Text>
          {member && (
            <Text style={styles.greeting}>안녕하세요, {member.nickname}님!</Text>
          )}
        </View>

        {/* 활성 밥먹자 */}
        {activeMealCall ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>지금 밥먹자 중 🔥</Text>
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <MealCallCard
                mealCall={activeMealCall}
                currentMemberId={member?.id ?? ''}
              />
            </Animated.View>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <EmptyState
              emoji="🍽️"
              title="아직 밥먹자가 없어요"
              description="버튼을 눌러 가족을 불러보세요!"
            />
          </View>
        )}
      </ScrollView>

      {/* FAB: 밥먹자! */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handleCreate}
        accessibilityRole="button"
        accessibilityLabel="밥먹자 만들기"
      >
        <Text style={styles.fabEmoji}>🍚</Text>
        <Text style={styles.fabLabel}>밥먹자!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  header: { gap: spacing.xs },
  greeting: { fontSize: 14, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  emptySection: { flex: 1, minHeight: 300 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadow.md,
  },
  fabPressed: { opacity: 0.85 },
  fabEmoji: { fontSize: 22 },
  fabLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
});
