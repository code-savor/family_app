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
        'coming-now': '#4CAF50',
        'coming-5min': '#FF9800',
        'not-eating': '#9E9E9E',
        custom: '#2196F3',
      },
    },
  },
  plugins: [],
};
