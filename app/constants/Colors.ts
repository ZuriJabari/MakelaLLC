const tintColorLight = '#32CD32';
const tintColorDark = '#4ADE4A';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    border: '#E1E1E1',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#666',
    tabIconSelected: tintColorDark,
    border: '#333',
  },
} as const; 