# UI 디자인 개선 설계 문서

날짜: 2026-02-26
상태: 승인됨

## 목표

"밥먹자" 앱의 UI를 5단계로 개선한다. NativeWind v4 + Tailwind CSS 도입, 공통 컴포넌트 리팩토링, 애니메이션 레이어 추가, 다크모드 + 접근성 완성.

## 결정 사항 요약

| 항목 | 결정 |
|-----|------|
| 마이그레이션 전략 | 점진적 전환 (기존 StyleSheet 유지, 새/리팩토링 컴포넌트부터 NativeWind) |
| 다크모드 | 시스템 연동 (CSS 변수 + `@media prefers-color-scheme`) |
| 애니메이션 대상 | 버튼 탭 피드백, 페이지 전환, MealCallCard 입장 |
| 스켈레톤 로딩 | 이번 범위 제외 |
| 접근법 | A: Tailwind 커스텀 테마 매핑 |

---

## 섹션 1: 아키텍처 개요

### 현재 상태
- 스타일링: `StyleSheet.create()` + TypeScript 커스텀 토큰 (`colors.ts`, `spacing.ts`, `typography.ts`)
- 애니메이션: 없음 (Pressable opacity만)
- 다크모드: 없음
- NativeWind/Tailwind: 미설치

### 변경 후 아키텍처

```
mobile/
├── tailwind.config.js          ← 신규: TS 토큰 → Tailwind 커스텀 테마
├── global.css                  ← 신규: CSS 변수 (라이트/다크 색상 토큰)
├── src/theme/
│   ├── colors.ts               ← 기존 유지 (StyleSheet용)
│   ├── spacing.ts              ← 기존 유지
│   ├── typography.ts           ← 기존 유지
│   └── index.ts                ← 기존 유지
└── src/components/
    ├── ui/
    │   ├── Button.tsx          ← NativeWind + Reanimated 전환
    │   ├── Card.tsx            ← NativeWind 전환
    │   ├── PinInput.tsx        ← NativeWind 전환
    │   └── LoadingSpinner.tsx  ← 신규 (Reanimated)
    ├── layout/
    │   ├── ScreenContainer.tsx ← NativeWind 전환
    │   └── EmptyState.tsx      ← NativeWind 전환
    └── meal-call/
        ├── MealCallCard.tsx    ← FadeInDown 애니메이션 추가
        └── QuickResponseButton.tsx ← Bounce 탭 피드백
```

### 신규 의존성

```bash
# NativeWind v4
npm install nativewind tailwindcss --legacy-peer-deps

# Reanimated v3 (Expo SDK 54에 포함)
npm install react-native-reanimated --legacy-peer-deps
```

---

## 섹션 2: Tailwind 커스텀 토큰 시스템

### global.css (CSS 변수)

```css
:root {
  /* Primary */
  --color-primary: #FF8C42;
  --color-primary-light: #FFB07A;
  --color-primary-dark: #E06B20;

  /* Background */
  --color-background: #FFF8F0;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #FFF0E0;

  /* Text */
  --color-text-primary: #2C2C2C;
  --color-text-secondary: #7A7A7A;
  --color-text-disabled: #BDBDBD;

  /* Border */
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
    /* primary 계열은 라이트모드와 동일 유지 */
  }
}
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
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
        border: 'var(--color-border)',
        // 응답 타입 고정 색상
        'coming-now': '#4CAF50',
        'coming-5min': '#FF9800',
        'not-eating': '#9E9E9E',
      },
    },
  },
};
```

### 전환 기간 중 이중화 허용

기존 `colors.ts`는 StyleSheet 기반 컴포넌트에서 계속 사용. 리팩토링 완료 후 제거 여부 재검토.

---

## 섹션 3: 컴포넌트 리팩토링 범위

### NativeWind로 전환할 컴포넌트

| 컴포넌트 | 우선순위 | 변경 사항 |
|---------|---------|---------|
| `Button.tsx` | 1 | className 전환 + Reanimated Spring 탭 피드백 |
| `Card.tsx` | 1 | className 전환 + 다크모드 surface |
| `ScreenContainer.tsx` | 2 | className 전환 |
| `EmptyState.tsx` | 2 | className 전환 |
| `PinInput.tsx` | 3 | className 전환 + 다크모드 |
| `MealCallCard.tsx` | 1 | FadeInDown 입장 애니메이션 + 다크모드 |
| `QuickResponseButton.tsx` | 1 | Bounce 탭 피드백 |

### StyleSheet 유지 (이번 범위 제외)

- `ElapsedTimer.tsx` — 단순 로직, 변경 불필요
- `ResponseStatusList.tsx` — 복잡도 대비 개선 효과 낮음
- `MenuSelector.tsx` — 복잡도 높음, 별도 판단

### 신규 컴포넌트

- `LoadingSpinner.tsx` — Reanimated 기반 로딩 인디케이터 (StyleSheet 대체)

---

## 섹션 4: 애니메이션 아키텍처

### 라이브러리

- `react-native-reanimated` v3 — 모든 애니메이션
- moti는 이번 범위 제외

### 패턴별 구현

#### 버튼 탭 피드백 (Button, QuickResponseButton)

```ts
const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const onPress = () => {
  scale.value = withSequence(
    withSpring(0.95, { damping: 10, stiffness: 400 }),
    withSpring(1.0, { damping: 15, stiffness: 300 })
  );
  props.onPress();
};

// JSX
<Animated.View style={animatedStyle}>
  <Pressable onPress={onPress} ...>
```

#### MealCallCard 입장 애니메이션

```tsx
// Reanimated Layout Animations 사용
import { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.duration(300).springify()}>
  <MealCallCard ... />
</Animated.View>
```

#### 페이지 전환

```tsx
// app/_layout.tsx Stack 설정
<Stack
  screenOptions={{
    animation: 'slide_from_right',  // iOS 기본값
    animationDuration: 300,
  }}
/>
```

---

## 섹션 5: 다크모드 + 접근성

### 다크모드 전략

- **방식**: CSS 변수 + `@media prefers-color-scheme` (섹션 2에서 정의)
- **NativeWind 설정**: `darkMode: 'media'` (tailwind.config.js)
- **컴포넌트**: CSS 변수가 자동 전환되므로 대부분 추가 코드 불필요
- **예외 처리**: 하드코딩 색상 (`#FFF3E0` 등) → CSS 변수로 교체

### 접근성 체크리스트

| 항목 | 현재 | 목표 |
|-----|------|------|
| `accessibilityRole` | Button만 있음 | 모든 인터랙티브 요소 |
| `accessibilityLabel` | Button만 있음 | 아이콘 버튼, 상태 배지 |
| `accessibilityState={{ disabled }}` | 없음 | Button, QuickResponseButton |
| 최소 터치 타겟 44×44pt | Button ✓ (48px) | QuickResponseButton 확인 |
| 색상 대비 | 라이트모드 ✓ | 다크모드 신규 색상 검증 |

---

## 구현 순서 (개략)

1. **기반 설정**: NativeWind 설치, tailwind.config.js, global.css, babel 설정
2. **고우선순위 컴포넌트**: Button, Card, MealCallCard, QuickResponseButton
3. **나머지 컴포넌트**: ScreenContainer, EmptyState, PinInput
4. **애니메이션**: Reanimated 설치, 패턴 적용
5. **다크모드 검증 + 접근성 감사**

---

## 제외 범위

- moti 스켈레톤 로딩 — 추후 고려
- MenuSelector, ResponseStatusList 리팩토링 — 추후 고려
- 앱 내 수동 다크모드 토글 — 시스템 연동으로 충분
