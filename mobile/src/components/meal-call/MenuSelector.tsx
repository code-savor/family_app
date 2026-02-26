import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@/theme';
import { PRESET_MENUS } from '@/domains/meal-call/constants';
import type { MenuItem } from '@/domains/meal-call/types';

interface MenuSelectorProps {
  menus: MenuItem[];               // 가족이 저장한 메뉴
  selectedIds: string[];
  customName: string;
  onToggle: (id: string) => void;
  onCustomChange: (text: string) => void;
}

export const MenuSelector = React.memo(function MenuSelector({
  menus,
  selectedIds,
  customName,
  onToggle,
  onCustomChange,
}: MenuSelectorProps) {
  const displayMenus = menus.length > 0 ? menus : PRESET_MENUS.map((p, i) => ({
    id: `preset-${i}`,
    family_id: '',
    name: p.name,
    emoji_icon: p.emoji_icon,
    category: p.category,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>무엇을 먹을까요?</Text>
      <View style={styles.grid}>
        {displayMenus.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <MenuChip
              key={item.id}
              item={item}
              selected={selected}
              onToggle={onToggle}
            />
          );
        })}
      </View>

      <Text style={[styles.label, styles.labelMargin]}>직접 입력</Text>
      <TextInput
        style={styles.input}
        value={customName}
        onChangeText={onCustomChange}
        placeholder="메시지를 남겨요 (선택)"
        placeholderTextColor={colors.textDisabled}
        maxLength={50}
      />
    </View>
  );
});

const MenuChip = React.memo(function MenuChip({
  item,
  selected,
  onToggle,
}: {
  item: MenuItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const handlePress = useCallback(() => onToggle(item.id), [item.id, onToggle]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={styles.chipEmoji}>{item.emoji_icon}</Text>
      <Text style={[styles.chipName, selected && styles.chipNameSelected]}>
        {item.name}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.label },
  labelMargin: { marginTop: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight + '33',
    borderColor: colors.primary,
  },
  chipPressed: { opacity: 0.75 },
  chipEmoji: { fontSize: 26 },
  chipName: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  chipNameSelected: { color: colors.primaryDark, fontWeight: '700' },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
