import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

type ColorScheme = 'light' | 'dark';

export default function RootLayout() {
  const colorScheme = useColorScheme() as ColorScheme;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        await checkProfileSetup();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsProfileComplete(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        await checkProfileSetup();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileSetup = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .single();

      if (error) throw error;
      setIsProfileComplete(!!profile?.full_name);
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsProfileComplete(false);
    }
  };

  if (loading) {
    return null; // Or a loading screen component
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="(auth)/verify"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)/otp"
            options={{
              title: 'Verify OTP',
              presentation: 'modal',
            }}
          />
        </>
      ) : !isProfileComplete ? (
        <Stack.Screen
          name="(auth)/profile-setup"
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="chat/[userId]"
            options={{
              title: 'Chat',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="booking/[rideId]"
            options={{
              title: 'Booking Confirmation',
              presentation: 'modal',
            }}
          />
        </>
      )}
    </Stack>
  );
}
