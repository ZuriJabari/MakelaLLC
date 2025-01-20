import { StyleSheet } from 'react-native';
import { colors } from '../colors';
import { typography } from '../typography';

export const buttonStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  
  primary: {
    backgroundColor: colors.primary.electricIndigo,
  },
  
  secondary: {
    backgroundColor: colors.background.secondary,
  },
  
  text: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
  },
}); 