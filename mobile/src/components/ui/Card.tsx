import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'sm' | 'md' | 'none';
}

const ELEVATION_CLASSES = {
  none: '',
  sm: 'shadow shadow-black/[0.08]',
  md: 'shadow-md shadow-black/[0.12]',
} as const;

export function Card({ children, style, elevation = 'sm' }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl p-4 border border-border ${ELEVATION_CLASSES[elevation]}`}
      style={style}
    >
      {children}
    </View>
  );
}
