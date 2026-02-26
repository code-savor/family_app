import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANT_STYLES = {
  primary: {
    container: 'bg-primary',
    text: 'text-text-on-primary',
  },
  secondary: {
    container: 'bg-surface-secondary border-2 border-primary',
    text: 'text-primary',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary',
  },
} as const;

const SIZE_STYLES = {
  sm: {
    container: 'px-4 min-h-[36px] py-1',
    text: 'text-sm',
  },
  md: {
    container: 'px-6 min-h-[48px] py-2',
    text: 'text-base',
  },
  lg: {
    container: 'px-8 min-h-[56px] py-4',
    text: 'text-lg',
  },
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.0, { damping: 15, stiffness: 300 }),
    );
    onPress();
  };

  const { container, text } = VARIANT_STYLES[variant];
  const { container: sizeContainer, text: sizeText } = SIZE_STYLES[size];

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        className={`items-center justify-center rounded-xl flex-row ${container} ${sizeContainer} ${isDisabled ? 'opacity-50' : ''}`}
        onPress={handlePress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#FFFFFF' : '#FF8C42'}
            size="small"
          />
        ) : (
          <Text className={`font-semibold ${text} ${sizeText}`}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
