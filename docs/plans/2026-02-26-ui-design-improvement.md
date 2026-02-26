# UI 디자인 개선 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** NativeWind v4 + Tailwind 커스텀 테마 도입, 공통 컴포넌트 NativeWind 전환, Reanimated v3 애니메이션 추가, 시스템 연동 다크모드 완성

**Architecture:** 기존 StyleSheet 컴포넌트는 유지하고, 리팩토링 시 NativeWind로 전환 (점진적). CSS 변수 기반 다크모드로 `dark:` prefix 최소화. Reanimated Layout Animations + withSpring 패턴으로 애니메이션 일관성 확보.

**Tech Stack:** NativeWind v4, Tailwind CSS v3, react-native-reanimated v4 (Expo SDK 54 + RN 0.81 호환 버전), Expo SDK 54, React Native 0.81 (New Architecture 활성화)

---

## Task 1: NativeWind v4 기반 설치

**Files:**
- Create: `mobile/babel.config.js`
- Create: `mobile/metro.config.js`
- Create: `mobile/tailwind.config.js`
- Create: `mobile/global.css`
- Create: `mobile/nativewind-env.d.ts`
- Modify: `mobile/app.json`
- Modify: `mobile/app/_layout.tsx`

### Step 1: 패키지 설치

```bash
cd mobile && npm install nativewind tailwindcss --legacy-peer-deps
```

Expected: `nativewind` + `tailwindcss` 설치 완료, peer dependency 경고 무시

### Step 2: `mobile/babel.config.js` 생성

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
  };
};
```

### Step 3: `mobile/metro.config.js` 생성

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

### Step 4: `mobile/global.css` 생성

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: `mobile/tailwind.config.js` 생성

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        'primary-dark': 'var(--color-primary-dark)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-secondary': 'var(--color-surface-secondary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-on-primary': '#FFFFFF',
        border: 'var(--color-border)',
        divider: 'var(--color-divider)',
        // 응답 타입 (고정 색상)
        'coming-now': '#4CAF50',
        'coming-5min': '#FF9800',
        'not-eating': '#9E9E9E',
        custom: '#2196F3',
      },
    },
  },
  plugins: [],
};
```

### Step 6: `mobile/global.css` CSS 변수 추가 (라이트 + 다크)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #FF8C42;
  --color-primary-light: #FFB07A;
  --color-primary-dark: #E06B20;
  --color-background: #FFF8F0;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #FFF0E0;
  --color-text-primary: #2C2C2C;
  --color-text-secondary: #7A7A7A;
  --color-text-disabled: #BDBDBD;
  --color-border: #E8D5C0;
  --color-divider: #F0E0D0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1A1A1A;
    --color-surface: #2C2C2C;
    --color-surface-secondary: #3A3A3A;
    --color-text-primary: #F0F0F0;
    --color-text-secondary: #AAAAAA;
    --color-text-disabled: #666666;
    --color-border: #444444;
    --color-divider: #333333;
  }
}
```

### Step 7: `mobile/nativewind-env.d.ts` 생성 (TypeScript 지원)

```ts
/// <reference types="nativewind/types" />
```

### Step 8: `mobile/app.json` 업데이트 (다크모드 지원)

`"userInterfaceStyle": "light"` → `"userInterfaceStyle": "automatic"` 으로 변경

### Step 9: `mobile/app/_layout.tsx`에 global.css import 추가

파일 최상단 (다른 import보다 앞)에 추가:
```ts
import '../global.css';
```

또한 StatusBar를 다크모드 연동으로 업데이트:
```tsx
// 변경 전
<StatusBar style="dark" backgroundColor="#FFF8F0" />

// 변경 후
<StatusBar style="auto" backgroundColor="transparent" translucent />
```

### Step 10: 동작 확인

```bash
cd mobile && npm start
```

Expected: Expo 개발 서버 시작, 에러 없음. iOS 시뮬레이터에서 앱 실행 후 배경색이 정상 표시됨.

테스트: 간단한 className 렌더 확인을 위해 `app/index.tsx`를 잠시 수정:
```tsx
// 임시로 추가 후 확인 후 되돌림
<View className="flex-1 bg-background items-center justify-center">
  <Text className="text-text-primary">NativeWind 동작 확인</Text>
</View>
```

배경이 크림색(`#FFF8F0`)으로 렌더되면 성공.

### Step 11: 임시 코드 되돌리기 + 커밋

```bash
cd mobile && git add babel.config.js metro.config.js tailwind.config.js global.css nativewind-env.d.ts app.json app/_layout.tsx
git commit -m "feat: NativeWind v4 기반 설정 추가 (tailwind + CSS 변수 + 다크모드)"
```

---

## Task 2: react-native-reanimated 설치

**Files:**
- Modify: `mobile/babel.config.js`

> **참고:** Expo SDK 54는 `react-native-reanimated`를 prebundle로 포함하지만 babel plugin 등록은 별도로 필요.

### Step 1: 패키지 설치

```bash
cd mobile && npm install react-native-reanimated --legacy-peer-deps
```

### Step 2: babel.config.js에 Reanimated 플러그인 추가

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin',  // ← 추가 (반드시 마지막)
    ],
  };
};
```

> **중요:** `react-native-reanimated/plugin`은 babel plugins 배열의 마지막에 위치해야 함.

### Step 3: 동작 확인

```bash
cd mobile && npm start -- --clear
```

Expected: 캐시 클리어 후 재시작, 에러 없음.

### Step 4: 커밋

```bash
cd mobile && git add babel.config.js package.json package-lock.json
git commit -m "feat: react-native-reanimated v3 설치 및 babel 설정"
```

---

## Task 3: Button.tsx — NativeWind + Reanimated Spring 탭 피드백

**Files:**
- Modify: `mobile/src/components/ui/Button.tsx`

현재 코드는 `StyleSheet.create()` 기반 + Pressable opacity. NativeWind className + Animated.View Spring으로 교체.

### Step 1: 파일 전체 교체

```tsx
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
```

### Step 2: 수동 확인

로그인 화면 또는 PIN 화면에서 버튼을 탭했을 때:
- Spring 탭 피드백 (0.95 → 1.0 scale)
- 색상이 기존과 동일하게 렌더됨
- disabled 시 opacity 0.5 적용

### Step 3: 커밋

```bash
cd mobile && git add src/components/ui/Button.tsx
git commit -m "refactor: Button → NativeWind + Reanimated Spring 탭 피드백"
```

---

## Task 4: Card.tsx — NativeWind 전환

**Files:**
- Modify: `mobile/src/components/ui/Card.tsx`

### Step 1: 파일 전체 교체

```tsx
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
```

### Step 2: 수동 확인

홈 화면에서 MealCallCard가 흰 배경 카드로 정상 렌더되는지 확인. 다크모드 시뮬레이션(iOS Settings → Appearance → Dark)에서 surface 색상이 `#2C2C2C`로 변경되는지 확인.

### Step 3: 커밋

```bash
cd mobile && git add src/components/ui/Card.tsx
git commit -m "refactor: Card → NativeWind (다크모드 surface 색상 지원)"
```

---

## Task 5: ScreenContainer.tsx — NativeWind 전환

**Files:**
- Modify: `mobile/src/components/layout/ScreenContainer.tsx`

### Step 1: 파일 전체 교체

```tsx
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
```

### Step 2: 수동 확인

모든 화면의 배경색이 크림색(라이트)/ 어두운 배경(다크)으로 정상 표시.

### Step 3: 커밋

```bash
cd mobile && git add src/components/layout/ScreenContainer.tsx
git commit -m "refactor: ScreenContainer → NativeWind"
```

---

## Task 6: EmptyState.tsx — NativeWind 전환

**Files:**
- Modify: `mobile/src/components/layout/EmptyState.tsx`

### Step 1: 파일 전체 교체

```tsx
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
```

### Step 2: 수동 확인

홈 화면에서 활성 MealCall 없을 때 EmptyState가 정상 표시.

### Step 3: 커밋

```bash
cd mobile && git add src/components/layout/EmptyState.tsx
git commit -m "refactor: EmptyState → NativeWind"
```

---

## Task 7: MealCallCard.tsx — FadeInDown 입장 애니메이션 + 다크모드

**Files:**
- Modify: `mobile/src/components/meal-call/MealCallCard.tsx`

MealCallCard 자체에 FadeInDown을 추가하면 내부에서 매번 트리거. 대신, **카드를 렌더하는 부모(홈 화면)**에서 `Animated.View`로 감싸는 방식을 사용.

> **참고:** MealCallCard 내부는 StyleSheet 유지. 부모에서 FadeInDown 적용 → 역할 분리 유지.

### Step 1: 홈 화면에서 MealCallCard를 Animated.View로 감싸기

홈 화면 파일을 찾아 수정. 아래 패턴을 적용:

```bash
# 홈 화면 파일 위치 확인
ls mobile/app/\(main\)/\(home\)/
```

홈 화면 파일(예: `app/(main)/(home)/index.tsx`)에서:

```tsx
// 추가 import
import Animated, { FadeInDown } from 'react-native-reanimated';

// MealCallCard를 감싸는 부분 변경
// 변경 전
<MealCallCard mealCall={activeMealCall} currentMemberId={memberId} />

// 변경 후
<Animated.View entering={FadeInDown.duration(400).springify()}>
  <MealCallCard mealCall={activeMealCall} currentMemberId={memberId} />
</Animated.View>
```

### Step 2: MealCallCard.tsx 하드코딩 색상 정리

`mobile/src/components/meal-call/MealCallCard.tsx`에서 하드코딩 색상 교체:

현재 코드에서 `'#FFF3E0'` (pendingBadge backgroundColor) 변경:
```tsx
// 변경 전 (line ~152)
pendingBadge: {
  backgroundColor: '#FFF3E0',
  ...
},

// 변경 후 — StyleSheet 내에서 수정
pendingBadge: {
  backgroundColor: colors.surfaceSecondary,  // 이미 있는 토큰 사용
  ...
},
```

### Step 3: 수동 확인

홈 화면으로 이동할 때 MealCallCard가 아래에서 위로 부드럽게 나타나는지 확인 (FadeInDown + springify).

### Step 4: 커밋

```bash
cd mobile && git add app/\(main\)/\(home\)/index.tsx src/components/meal-call/MealCallCard.tsx
git commit -m "feat: MealCallCard FadeInDown 입장 애니메이션 + 하드코딩 색상 정리"
```

---

## Task 8: QuickResponseButton.tsx — Bounce 탭 피드백

**Files:**
- Modify: `mobile/src/components/meal-call/QuickResponseButton.tsx`

### Step 1: 파일 전체 교체

```tsx
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
```

> **Note:** QuickResponseButton은 동적 `borderColor`와 `selected` 상태 색상이 있어 StyleSheet 혼용 유지. Animated.View wrapper로 scale만 처리.

### Step 2: 수동 확인

응답 화면에서 버튼 탭 시 0.88 → 1.05 → 1.0 bouncy 애니메이션 확인.

### Step 3: 커밋

```bash
cd mobile && git add src/components/meal-call/QuickResponseButton.tsx
git commit -m "feat: QuickResponseButton Bounce 탭 피드백 (Reanimated withSequence)"
```

---

## Task 9: PinInput.tsx — NativeWind 전환 + 다크모드

**Files:**
- Modify: `mobile/src/components/ui/PinInput.tsx`

PinKey 컴포넌트의 dot/key를 NativeWind로 전환. 로직은 그대로.

### Step 1: 파일 전체 교체

```tsx
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration } from 'react-native';
import { colors } from '@/theme';

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  maxLength?: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

export function PinInput({ value, onChange, maxLength = 4 }: PinInputProps) {
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
          <PinKey key={idx} label={key} onPress={handleKey} />
        ))}
      </View>
    </View>
  );
}

const PinKey = React.memo(function PinKey({
  label,
  onPress,
}: {
  label: string;
  onPress: (key: string) => void;
}) {
  const handlePress = useCallback(() => onPress(label), [label, onPress]);

  if (!label) return <View style={styles.keyEmpty} />;

  return (
    <Pressable
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      onPress={handlePress}
      accessibilityLabel={label === '⌫' ? '지우기' : label}
    >
      <Text className={`font-medium text-text-primary ${label === '⌫' ? 'text-xl text-text-secondary' : 'text-2xl'}`}>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 84,
    height: 64,
  },
  keyPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
});
```

### Step 2: 수동 확인

로그인/PIN 화면에서 숫자 탭 시 도트가 채워지는지, 다크모드에서 배경색이 적절한지 확인.

### Step 3: 커밋

```bash
cd mobile && git add src/components/ui/PinInput.tsx
git commit -m "refactor: PinInput 도트 → NativeWind (다크모드 지원)"
```

---

## Task 10: LoadingSpinner.tsx — 신규 Reanimated 스피너

**Files:**
- Create: `mobile/src/components/ui/LoadingSpinner.tsx`

### Step 1: 파일 생성

```tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 32, color = '#FF8C42' }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1, // 무한 반복
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="items-center justify-center">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor: color,
            borderTopColor: 'transparent',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
```

### Step 2: 필요한 화면에서 ActivityIndicator 대체 확인

`LoadingSpinner`가 올바르게 회전 애니메이션되는지 확인. (임시로 홈 화면에서 `<LoadingSpinner />`를 렌더해 테스트 후 제거)

### Step 3: 커밋

```bash
cd mobile && git add src/components/ui/LoadingSpinner.tsx
git commit -m "feat: LoadingSpinner 신규 컴포넌트 (Reanimated 회전 애니메이션)"
```

---

## Task 11: 접근성 + 다크모드 최종 검증

**Files:**
- Modify: `mobile/app/_layout.tsx` (Stack 페이지 전환 애니메이션)
- 접근성 속성 누락 화면 보완

### Step 1: 페이지 전환 애니메이션 설정

`mobile/app/_layout.tsx`의 Stack에 애니메이션 설정 추가:

```tsx
<Stack
  screenOptions={{
    headerShown: false,
    animation: 'slide_from_right',
    animationDuration: 280,
  }}
>
```

### Step 2: 접근성 체크리스트 수동 검증

iOS Settings > Accessibility > VoiceOver를 켜고 각 화면 테스트:

| 항목 | 확인 방법 |
|-----|---------|
| 버튼 accessibilityLabel | VoiceOver로 각 버튼 읽기 |
| Button accessibilityState.disabled | 비활성화 버튼 포커스 시 "흐리게" 공지 |
| 터치 타겟 44pt 이상 | 버튼/키패드 키 높이 확인 (Button: 48px ✓, PinKey: 64px ✓) |
| 응답 버튼 accessibilityState.selected | 선택된 응답 타입 공지 확인 |

### Step 3: 다크모드 검증

iOS: Settings → Developer → Dark Appearance 토글로 각 화면 확인:

| 화면 | 확인 항목 |
|-----|---------|
| 로그인 | 배경 어두운색, 텍스트 밝은색 |
| 홈 | MealCallCard surface 어두운색 |
| 응답 | QuickResponseButton 배경 |
| PIN 입력 | 키패드 배경, 도트 색상 |

### Step 4: `mobile/app/(auth)/` 화면들 StatusBar 확인

각 인증 화면에서 StatusBar가 다크모드에 맞게 자동 조정되는지 확인.

### Step 5: 최종 커밋

```bash
cd mobile && git add app/_layout.tsx
git commit -m "feat: Stack 페이지 전환 애니메이션 + 다크모드/접근성 검증 완료"
```

---

## 완료 기준

- [ ] `npm start` 에러 없이 실행
- [ ] NativeWind `className` 렌더링 정상 동작
- [ ] Button Spring 탭 피드백 동작
- [ ] QuickResponseButton Bounce 탭 피드백 동작
- [ ] MealCallCard FadeInDown 입장 애니메이션 동작
- [ ] LoadingSpinner 회전 애니메이션 동작
- [ ] iOS 다크모드에서 배경/텍스트 색상 전환 확인
- [ ] VoiceOver 주요 인터랙션 요소 레이블 있음
- [ ] 모든 커밋 완료 (Task 1~11)

## 참고

- NativeWind v4 공식 문서: https://www.nativewind.dev/v4/overview
- Reanimated 공식 문서: https://docs.swmansion.com/react-native-reanimated/
- Expo SDK 54 + New Architecture 주의: `newArchEnabled: true` 상태에서 테스트 필수
- `npm install` 항상 `--legacy-peer-deps` 플래그 사용 (peer dependency 충돌)
