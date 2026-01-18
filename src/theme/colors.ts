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
  },

  info: {
    lighter: '#D6ECFF',
    darker: '#3B82F6',
  },

  warning: '#F2B94C',

  danger: {
    DEFAULT: '#E96363',
    darker: '#BF1A1A',
  },

  inactive: {
    lighter: '#D1D5DB',
    darker: '#6B7280',
  },

  purple: '#9B51E0',
  orange: '#FF8A3D',
} as const;
