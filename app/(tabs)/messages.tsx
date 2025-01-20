import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, RefreshControl, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ColorScheme = 'light' | 'dark';

interface ChatPreview {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    type: 'text' | 'image' | 'location';
    created_at: string;
  };
  unread_count: number;
  ride_id: string;
}

interface SupabaseChatResponse {
  id: string;
  ride_id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  messages: Array<{
    content: string;
    type: 'text' | 'image' | 'location';
    created_at: string;
  }>;
  unread_count: number;
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          ride_id,
          other_user:profiles!chats_other_user_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          messages!chat_id_fkey(
            content,
            type,
            created_at
          ),
          unread_count
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .returns<SupabaseChatResponse[]>();

      if (error) throw error;
      
      // Transform the data to match the ChatPreview type
      const transformedChats: ChatPreview[] = (data || []).map(chat => ({
        id: chat.id,
        ride_id: chat.ride_id,
        other_user: {
          id: chat.other_user.id,
          full_name: chat.other_user.full_name || '',
          avatar_url: chat.other_user.avatar_url || null,
        },
        last_message: {
          content: chat.messages?.[0]?.content || '',
          type: chat.messages?.[0]?.type || 'text',
          created_at: chat.messages?.[0]?.created_at || new Date().toISOString(),
        },
        unread_count: chat.unread_count || 0,
      }));

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChats();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const renderPreviewText = (message: ChatPreview['last_message']) => {
    switch (message.type) {
      case 'image':
        return '📷 Photo';
      case 'location':
        return '📍 Location';
      default:
        return message.content;
    }
  };

  const renderItem = ({ item }: { item: ChatPreview }) => (
    <Pressable
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.other_user.id}?ride=${item.ride_id}`)}
    >
      <View style={styles.avatar}>
        {item.other_user.avatar_url ? (
          <Image
            source={{ uri: item.other_user.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <LinearGradient
            colors={[colors.primary.deepPurple, colors.primary.electricIndigo]}
            style={styles.avatarFallback}
          >
            <Text style={styles.avatarText}>
              {item.other_user.full_name.charAt(0)}
            </Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {item.other_user.full_name}
          </Text>
          <Text style={styles.time}>
            {format(new Date(item.last_message.created_at), 'HH:mm')}
          </Text>
        </View>

        <View style={styles.chatPreview}>
          <Text style={styles.previewText} numberOfLines={1}>
            {renderPreviewText(item.last_message)}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary.electricIndigo} />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>
          No messages yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.listContent}
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary.electricIndigo}
          colors={[colors.primary.electricIndigo]}
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: 16,
  } as ViewStyle,
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  } as ViewStyle,
  avatar: {
    marginRight: 16,
  } as ViewStyle,
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  } as ImageStyle,
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.h3,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
  } as TextStyle,
  chatInfo: {
    flex: 1,
  } as ViewStyle,
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  name: {
    flex: 1,
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  } as TextStyle,
  time: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    color: colors.text.secondary,
  } as TextStyle,
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  previewText: {
    flex: 1,
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    color: colors.text.secondary,
    marginRight: 8,
  } as TextStyle,
  badge: {
    backgroundColor: colors.status.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  } as ViewStyle,
  badgeText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: colors.neutral.stellarSilver,
  } as ViewStyle,
  emptyText: {
    textAlign: 'center',
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.secondary,
  } as TextStyle,
}); 