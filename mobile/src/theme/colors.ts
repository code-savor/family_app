export const colors = {
  // Primary - 따뜻한 오렌지
  primary: '#FF8C42',
  primaryLight: '#FFB07A',
  primaryDark: '#E06B20',

  // Background - 크림
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceSecondary: '#FFF0E0',

  // Text
  textPrimary: '#2C2C2C',
  textSecondary: '#7A7A7A',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Response types
  comingNow: '#4CAF50',
  coming5min: '#FF9800',
  notEating: '#9E9E9E',
  custom: '#2196F3',

  // Border & Divider
  border: '#E8D5C0',
  divider: '#F0E0D0',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',
} as const;

export type ColorKey = keyof typeof colors;
