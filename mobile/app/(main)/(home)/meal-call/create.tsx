import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { MenuSelector } from '@/components/meal-call/MenuSelector';
import { useMealCallStore } from '@/domains/meal-call/store';
import { colors, spacing, typography } from '@/theme';

export default function CreateMealCallScreen() {
  const { create, fetchMenus, menus } = useMealCallStore(
    useShallow((s) => ({
      create: s.create,
      fetchMenus: s.fetchMenus,
      menus: s.menus,
    })),
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleCreate = useCallback(async () => {
    // preset 메뉴는 id가 "preset-N" 형태 → 실제 family 메뉴 id만 전송
    const realIds = selectedIds.filter((id) => !id.startsWith('preset-'));

    setLoading(true);
    try {
      const mc = await create({
        menu_item_ids: realIds,
        message: customMessage.trim() || undefined,
      });
      router.replace(`/(main)/(home)/meal-call/${mc.id}`);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.message ?? '밥먹자 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [create, selectedIds, customMessage]);

  return (
    <ScreenContainer scrollable contentStyle={styles.content}>
      <Text style={typography.h2}>🍚 밥먹자!</Text>
      <Text style={styles.subtitle}>가족을 밥상으로 불러봐요</Text>

      <MenuSelector
        menus={menus}
        selectedIds={selectedIds}
        customName={customMessage}
        onToggle={handleToggle}
        onCustomChange={setCustomMessage}
      />

      <View style={styles.actions}>
        <Button
          label="📣 밥먹자 보내기"
          onPress={handleCreate}
          loading={loading}
          size="lg"
        />
        <Button
          label="취소"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: -spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
