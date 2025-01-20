import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { typography } from '../typography';

export const buttonStyles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  primary: {
    backgroundColor: colors.primary.deepPurple,
  },
  
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.deepPurple,
  },
  
  text: {
    fontFamily: typography.fonts.primary,
    fontSize: typography.sizes.body1,
    fontWeight: '600',
  },
}); 