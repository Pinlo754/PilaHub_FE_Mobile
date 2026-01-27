import { DefaultTheme, Theme } from '@react-navigation/native';
import { colors } from './colors';

export const APP_BG = colors.background.DEFAULT;

export const NavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: APP_BG,
    card: APP_BG,
    primary: colors.foreground,
    text: '#1F2937',
    border: APP_BG,
    notification: colors.danger.DEFAULT,
  },
};
