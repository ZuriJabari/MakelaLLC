import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): NonNullable<ReturnType<typeof _useColorScheme>> {
  return _useColorScheme() ?? 'light';
} 