import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { radius, spacing } from '@/theme';
import type { ResponseType } from '@/domains/meal-call/types';
import { RESPONSE_CONFIG } from '@/domains/meal-call/constants';

interface QuickResponseButtonProps {
  type: ResponseType;
  selected?: boolean;
  onPress: (type: ResponseType) => void;
  style?: ViewStyle;
}

export const QuickResponseButton = React.memo(function QuickResponseButton({
  type,
  selected = false,
  onPress,
  style,
}: QuickResponseButtonProps) {
  const config = RESPONSE_CONFIG[type];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 8, stiffness: 500 }),
      withSpring(1.05, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 12, stiffness: 250 }),
    );
    onPress(type);
  }, [type, onPress, scale]);

  return (
    <Animated.View style={[animatedStyle, styles.wrapper, style]}>
      <Pressable
        style={[
          styles.button,
          { borderColor: config.color },
          selected && { backgroundColor: config.color },
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={config.label}
        accessibilityState={{ selected }}
      >
        <Text style={styles.emoji}>{config.emoji}</Text>
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {config.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: 'white',
    gap: spacing.xs,
    minHeight: 80,
  },
  emoji: { fontSize: 28 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  labelSelected: { color: 'white' },
});
