import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, Platform, TextStyle, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { typography } from './theme/typography';
import { colors } from './theme/colors';
import { supabase } from '../lib/supabase';

// Auth protected segments start with (tabs) or have specific paths we want to protect
const protectedSegments = ['(tabs)', 'post-ride', 'booking', 'chat', 'wallet'] as const;
type ProtectedSegment = typeof protectedSegments[number];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (initializing) return;

    const isAuthGroup = segments[0] === '(auth)';
    const firstSegment = segments[0] || '';
    const inProtectedRoute = firstSegment === '(tabs)' || 
      ['post-ride', 'booking', 'chat', 'wallet'].includes(firstSegment);

    if (!session && inProtectedRoute) {
      // If there's no session and we're in a protected route, redirect to verify
      router.replace('/(auth)/verify');
    } else if (session && isAuthGroup) {
      // If we have a session and we're in auth group, check profile
      checkProfile(session.user.id);
    }
  }, [session, segments, initializing]);

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkProfile(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profile?.full_name) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      router.replace('/(auth)/verify');
    }
  }

  const defaultScreenOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.background.primary,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitleStyle: {
      fontFamily: typography.fonts.primary,
      fontSize: typography.sizes.h3,
      fontWeight: '600' as TextStyle['fontWeight'],
      color: colors.text.primary,
    },
    headerTitleAlign: 'center' as const,
    headerLeft: (props: { canGoBack?: boolean }) => 
      props.canGoBack ? (
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={colors.primary.electricIndigo}
          style={{ marginLeft: Platform.OS === 'ios' ? 16 : 0 }}
          onPress={() => router.back()}
        />
      ) : null,
    contentStyle: { 
      backgroundColor: colors.background.primary 
    },
  };

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: colors.background.primary 
        }}>
          <ActivityIndicator size="large" color={colors.primary.electricIndigo} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={defaultScreenOptions}>
          <Stack.Screen 
            name="(auth)/verify" 
            options={{
              title: 'Welcome to Makela',
              headerLeft: () => null,
            }}
          />
          <Stack.Screen 
            name="(auth)/otp" 
            options={{
              presentation: 'modal',
              title: 'Verify OTP',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="(auth)/profile-setup" 
            options={{
              title: 'Complete Your Profile',
              headerLeft: () => null,
            }}
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="post-ride" 
            options={{
              title: 'Post a Ride',
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="booking/[id]" 
            options={{
              title: 'Booking Details',
            }}
          />
          <Stack.Screen 
            name="chat/[userId]" 
            options={{
              title: 'Chat',
              presentation: 'modal',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="wallet/add-money" 
            options={{
              title: 'Add Money',
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="wallet/history" 
            options={{
              title: 'Transaction History',
            }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
