import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration, useColorScheme } from 'react-native';
import { colors } from '@/theme';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

export function PinInput({ value, onChange, maxLength = 4 }: PinInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleKey = useCallback((key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key && value.length < maxLength) {
      Vibration.vibrate(30);
      onChange(value + key);
    }
  }, [value, onChange, maxLength]);

  return (
    <View className="items-center gap-6">
      {/* PIN 도트 표시 */}
      <View className="flex-row gap-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-primary ${
              i < value.length ? 'bg-primary' : 'bg-transparent'
            }`}
          />
        ))}
      </View>

      {/* 키패드 */}
      <View style={styles.keypad}>
        {KEYS.map((key, idx) => (
          <PinKey key={idx} label={key} onPress={handleKey} isDark={isDark} />
        ))}
      </View>
    </View>
  );
}

const PinKey = React.memo(function PinKey({
  label,
  onPress,
  isDark,
}: {
  label: string;
  onPress: (key: string) => void;
  isDark: boolean;
}) {
  const handlePress = useCallback(() => onPress(label), [label, onPress]);

  const keyColors = {
    key: isDark ? '#2C2C2C' : colors.surface,
    keyBorder: isDark ? '#444444' : colors.border,
    keyPressed: isDark ? '#3A3A3A' : colors.surfaceSecondary,
  };

  if (!label) return <View style={styles.keyEmpty} />;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: pressed ? keyColors.keyPressed : keyColors.key, borderColor: keyColors.keyBorder },
      ]}
      onPress={handlePress}
      accessibilityLabel={label === '⌫' ? '지우기' : label}
    >
      <Text className={`font-medium ${label === '⌫' ? 'text-xl text-text-secondary' : 'text-2xl text-text-primary'}`}>
        {label}
      </Text>
    </Pressable>
  );
});

// 키패드 레이아웃은 고정 수치이므로 StyleSheet 유지
const styles = StyleSheet.create({
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 8,
  },
  key: {
    width: 84,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 84,
    height: 64,
  },
});
