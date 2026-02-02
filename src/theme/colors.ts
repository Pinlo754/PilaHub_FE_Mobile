// src/theme/colors.ts
export const colors = {
  background: {
    DEFAULT: '#FFFAF0',
    sub1: '#F5DEB3',
    sub2: '#FAEED6',
  },

  foreground: '#A0522D',
  secondaryText: '#CD853F',

  success: {
    DEFAULT: '#37C16D',
    darker: '#1B8D4F',
    20: '#1B8D4F33',
  },

  info: {
    lighter: '#D6ECFF',
    darker: '#3B82F6',
    20: '#3B82F633',
  },

  warning: {
    DEFAULT: '#F2C94C',
    20: '#F2C94C33',
  },

  danger: {
    DEFAULT: '#E96363',
    darker: '#BF1A1A',
  },

  inactive: {
    lighter: '#D1D5DB',
    darker: '#6B7280',
  },

  purple: {
    DEFAULT: '#8B5CF6',
    20: '#8B5CF633',
  },
  orange: {
    DEFAULT: '#F97316',
    20: '#F9731633',
  },
} as const;
