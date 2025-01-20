import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../components/useColorScheme';
import { colors } from '../theme/colors';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: chats, error } = await supabase
          .from('chats')
          .select('unread_count')
          .or(`user_id.eq.${user.id},other_user_id.eq.${user.id}`);
        
        if (error) throw error;
        
        const total = chats?.reduce((sum, chat) => sum + (chat.unread_count || 0), 0) || 0;
        setUnreadCount(total);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.neutral.stellarSilver,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.select({ ios: 88, android: 60 }),
          paddingBottom: Platform.select({ ios: insets.bottom, android: 8 }),
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary.electricIndigo,
        tabBarInactiveTintColor: colors.text.disabled,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          paddingBottom: Platform.select({ ios: 0, android: 4 }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />

      <Tabs.Screen
        name="find-ride"
        options={{
          title: 'Find Rides',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
