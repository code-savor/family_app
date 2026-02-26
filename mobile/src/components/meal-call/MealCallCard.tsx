import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ElapsedTimer } from './ElapsedTimer';
import { colors, spacing, typography, radius } from '@/theme';
import type { MealCall } from '@/domains/meal-call/types';

interface MealCallCardProps {
  mealCall: MealCall;
  currentMemberId: string;
}

export const MealCallCard = React.memo(function MealCallCard({
  mealCall,
  currentMemberId,
}: MealCallCardProps) {
  const responded = mealCall.responses.find((r) => r.member_id === currentMemberId);
  const respondedCount = mealCall.responses.length;
  const totalCount = respondedCount + mealCall.pending_member_ids.length;

  const handlePress = useCallback(() => {
    router.push(`/(main)/(home)/meal-call/${mealCall.id}`);
  }, [mealCall.id]);

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card} elevation="md">
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>🍚 밥먹자!</Text>
          <ElapsedTimer startTime={mealCall.created_at} />
        </View>

        {/* 호출자 */}
        <Text style={styles.caller}>
          <Text style={styles.callerName}>{mealCall.caller_nickname}</Text>
          {'이(가) 불렀어요'}
        </Text>

        {/* 메뉴 */}
        {mealCall.menus.length > 0 && (
          <View style={styles.menus}>
            {mealCall.menus.map((m) => (
              <View key={m.id} style={styles.menuChip}>
                <Text style={styles.menuText}>{m.emoji_icon} {m.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 메시지 */}
        {mealCall.message ? (
          <Text style={styles.message}>💬 {mealCall.message}</Text>
        ) : null}

        {/* 응답 현황 */}
        <View style={styles.footer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: totalCount > 0 ? `${(respondedCount / totalCount) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{respondedCount}/{totalCount}명 응답</Text>
        </View>

        {/* 내 응답 상태 */}
        {responded ? (
          <View style={styles.myResponse}>
            <Text style={styles.myResponseText}>
              내 응답: {responded.response_type === 'COMING_NOW' ? '🏃 지금 바로' :
                        responded.response_type === 'COMING_5MIN' ? '⏰ 5분 뒤' :
                        responded.response_type === 'NOT_EATING' ? '🙅 안먹음' :
                        responded.custom_message ?? '✏️ 직접입력'}
            </Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>응답 대기 중 · 탭해서 응답하기</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  card: {
    gap: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caller: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  callerName: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  menuChip: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  menuText: { fontSize: 13, color: colors.textPrimary },
  message: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic' },
  footer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressText: { fontSize: 12, color: colors.textSecondary },
  myResponse: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  myResponseText: { fontSize: 13, color: colors.primaryDark, fontWeight: '500' },
  pendingBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  pendingText: { fontSize: 13, color: colors.primary, fontWeight: '500', textAlign: 'center' },
});
