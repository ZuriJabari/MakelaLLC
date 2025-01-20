import { useEffect, useState } from 'react';
import { Stack, Slot } from 'expo-router';
import { useRouter } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/verify');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (profile?.full_name) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/profile-setup');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();

          if (profile?.full_name) {
            setInitializing(false);
            router.replace('/(tabs)');
          } else {
            setInitializing(false);
            router.replace('/(auth)/profile-setup');
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          setInitializing(false);
          router.replace('/(auth)/verify');
        }
      } else {
        setInitializing(false);
        router.replace('/(auth)/verify');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setInitializing(false);
      router.replace('/(auth)/verify');
    }
  }

  if (initializing) {
    return <Slot />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }
          }}
        >
          <Stack.Screen name="(auth)/verify" />
          <Stack.Screen 
            name="(auth)/otp" 
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Verify OTP'
            }}
          />
          <Stack.Screen name="(auth)/profile-setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen 
            name="profile" 
            options={{
              headerShown: true,
              title: 'Profile'
            }}
          />
          <Stack.Screen 
            name="booking/[id]" 
            options={{
              headerShown: true,
              title: 'Booking Details'
            }}
          />
          <Stack.Screen 
            name="chat/[userId]" 
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Chat'
            }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
