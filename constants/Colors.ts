/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#32CD32';
const tintColorDark = '#4ADE4A';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#666',
    tabIconSelected: tintColorLight,
    border: '#eee',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    border: '#333',
  },
  primary: {
    deepPurple: '#4A148C',
    electricIndigo: '#6200EA',
  },
  accent: {
    mintGreen: '#00E676',
  },
  text: {
    primary: '#000000',
    secondary: '#757575',
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    dark: '#121212',
  },
  neutral: {
    stellarSilver: '#E0E0E0',
  },
  status: {
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
  },
} as const;
