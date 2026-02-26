import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = false,
  style,
  contentStyle,
}: ScreenContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" style={style} edges={['top']}>
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={[{ paddingHorizontal: 16 }, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 px-4" style={contentStyle}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
