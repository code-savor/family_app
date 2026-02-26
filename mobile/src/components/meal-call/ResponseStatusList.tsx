import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme';
import { RESPONSE_CONFIG } from '@/domains/meal-call/constants';
import type { MealCall } from '@/domains/meal-call/types';

interface ResponseStatusListProps {
  mealCall: MealCall;
}

export const ResponseStatusList = React.memo(function ResponseStatusList({
  mealCall,
}: ResponseStatusListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        응답 현황 ({mealCall.responses.length}/
        {mealCall.responses.length + mealCall.pending_member_ids.length}명)
      </Text>

      {/* 응답한 사람들 */}
      {mealCall.responses.map((r) => {
        const config = RESPONSE_CONFIG[r.response_type];
        return (
          <View key={r.id} style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: config.color + '22' }]}>
              <Text style={styles.avatarEmoji}>{config.emoji}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.nickname}>{r.member_nickname}</Text>
              <Text style={[styles.responseLabel, { color: config.color }]}>
                {r.response_type === 'CUSTOM' && r.custom_message
                  ? r.custom_message
                  : config.label}
              </Text>
            </View>
          </View>
        );
      })}

      {/* 미응답자 */}
      {mealCall.pending_member_ids.length > 0 && (
        <>
          <Text style={styles.pendingTitle}>미응답</Text>
          {mealCall.pending_member_ids.map((memberId) => (
            <View key={memberId} style={styles.row}>
              <View style={[styles.avatar, styles.avatarPending]}>
                <Text style={styles.avatarEmoji}>😴</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nicknameGray}>응답 대기 중</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  pendingTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPending: { backgroundColor: colors.divider },
  avatarEmoji: { fontSize: 20 },
  info: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  nicknameGray: { fontSize: 15, color: colors.textSecondary },
  responseLabel: { fontSize: 13, fontWeight: '500', marginTop: 1 },
});
