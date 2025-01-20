import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Makela',
  slug: 'makela',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.makela.app',
    newArchEnabled: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.makela.app',
    newArchEnabled: true
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store'
  ],
  scheme: 'makela',
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: 'your-project-id'
    }
  }
};

export default config; 