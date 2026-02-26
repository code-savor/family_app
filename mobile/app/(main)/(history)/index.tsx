import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { colors, spacing, radius, typography, shadow } from '@/theme';
import type { MealCall } from '@/domains/meal-call/types';

function HistoryItem({ item }: { item: MealCall }) {
  const handlePress = useCallback(() => {
    router.push(`/(main)/(home)/meal-call/${item.id}`);
  }, [item.id]);

  const statusEmoji = item.status === 'COMPLETED' ? '✅' : item.status === 'CANCELLED' ? '❌' : '🔥';
  const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={handlePress}
    >
      <Text style={styles.statusEmoji}>{statusEmoji}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCaller}>
          {item.caller_nickname}의 밥먹자
          {item.menus.length > 0 && ` · ${item.menus.map((m) => m.emoji_icon).join('')}`}
        </Text>
        <Text style={styles.itemDate}>{date}</Text>
        <Text style={styles.itemStats}>
          {item.responses.length}명 응답 · {item.pending_member_ids.length}명 미응답
        </Text>
      </View>
    </Pressable>
  );
}

const MemoHistoryItem = HistoryItem; // 별도 React.memo 불필요 (FlatList가 관리)

export default function HistoryScreen() {
  const [items, setItems] = useState<MealCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 가족의 밥먹자 기록은 active + family_id 기반으로 조회
    // 실제로는 /api/v1/meal-calls?family_id=... 엔드포인트가 필요하나
    // 현재 백엔드는 active만 노출 → 일단 active 포함 간략 목록 표시
    apiClient
      .get<MealCall>(endpoints.activeMealCall)
      .then(({ data }) => {
        if (data) setItems([data]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.titleRow}>
        <Text style={typography.h3}>📋 기록</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemoHistoryItem item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>아직 기록이 없어요</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  titleRow: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.md, gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  itemPressed: { opacity: 0.8 },
  statusEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, gap: 2 },
  itemCaller: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemDate: { fontSize: 12, color: colors.textSecondary },
  itemStats: { fontSize: 12, color: colors.textSecondary },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
