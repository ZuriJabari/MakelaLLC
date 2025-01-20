import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    checkDriverStatus();
  }, []);

  const checkDriverStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_driver')
          .eq('id', user.id)
          .single();
        
        setIsDriver(profile?.is_driver ?? false);
      }
    } catch (error) {
      console.error('Error checking driver status:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].text,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: Colors[colorScheme].border,
        },
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'My Rides',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          tabBarBadge: 3, // Example badge, should be dynamic based on unread messages
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerRight: () => (
            <Ionicons
              name="settings-outline"
              size={24}
              color={Colors[colorScheme].text}
              style={{ marginRight: 15 }}
              onPress={() => router.push('/settings')}
            />
          ),
        }}
      />
    </Tabs>
  );
}
