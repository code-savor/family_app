import type { ResponseType } from './types';

export const RESPONSE_CONFIG: Record<ResponseType, { label: string; emoji: string; color: string }> = {
  COMING_NOW: { label: '지금 바로 가요', emoji: '🏃', color: '#4CAF50' },
  COMING_5MIN: { label: '5분 뒤에',      emoji: '⏰', color: '#FF9800' },
  NOT_EATING:  { label: '안먹을래요',    emoji: '🙅', color: '#9E9E9E' },
  CUSTOM:      { label: '직접 입력',     emoji: '✏️', color: '#2196F3' },
};

// 빠른 메뉴 선택용 프리셋 (가족 메뉴 없을 때 표시)
export const PRESET_MENUS = [
  { name: '밥',   emoji_icon: '🍚', category: 'KOREAN' },
  { name: '찌개', emoji_icon: '🍲', category: 'KOREAN' },
  { name: '면',   emoji_icon: '🍜', category: 'KOREAN' },
  { name: '고기', emoji_icon: '🥩', category: 'KOREAN' },
  { name: '피자', emoji_icon: '🍕', category: 'WESTERN' },
  { name: '치킨', emoji_icon: '🍗', category: 'FAST_FOOD' },
  { name: '초밥', emoji_icon: '🍣', category: 'JAPANESE' },
  { name: '샐러드', emoji_icon: '🥗', category: 'WESTERN' },
] as const;
