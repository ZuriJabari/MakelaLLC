import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'SF Pro Display',
  android: 'Poppins',
});

const metricsFont = 'Space Grotesk';

export const typography = {
  fonts: {
    primary: fontFamily,
    metrics: metricsFont,
  },
  
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  sizes: {
    h1: 32,
    h2: 24,
    h3: 20,
    body1: 16,
    body2: 14,
    caption: 12,
    metrics: 18,
  },
  
  letterSpacing: {
    h1: -0.5,
    h2: -0.3,
    body: 0,
  }
}; 