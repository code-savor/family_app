import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '🍽️',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text className="text-[56px]">{emoji}</Text>
      <Text className="text-xl font-semibold text-text-primary text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-text-secondary text-center">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={{ marginTop: 8, width: '100%' }} />
      ) : null}
    </View>
  );
}
