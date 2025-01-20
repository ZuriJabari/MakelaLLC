import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, RefreshControl } from 'react-native';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { format } from 'date-fns';

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

export default function MessagesScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
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
          other_user:profiles!other_user_id(
            id,
            full_name,
            avatar_url
          ),
          last_message:messages(
            content,
            type,
            created_at
          ),
          unread_count
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the ChatPreview type
      const transformedChats: ChatPreview[] = (data || []).map(chat => ({
        id: chat.id,
        ride_id: chat.ride_id,
        other_user: {
          id: chat.other_user[0]?.id || '',
          full_name: chat.other_user[0]?.full_name || '',
          avatar_url: chat.other_user[0]?.avatar_url || null,
        },
        last_message: {
          content: chat.last_message[0]?.content || '',
          type: chat.last_message[0]?.type || 'text',
          created_at: chat.last_message[0]?.created_at || new Date().toISOString(),
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
      style={[
        styles.chatItem,
        { borderBottomColor: Colors[colorScheme].border }
      ]}
      onPress={() => router.push(`/chat/${item.other_user.id}?ride=${item.ride_id}`)}
    >
      <View style={styles.avatar}>
        {item.other_user.avatar_url ? (
          <Image
            source={{ uri: item.other_user.avatar_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: Colors[colorScheme].tint }]}>
            <Text style={styles.avatarText}>
              {item.other_user.full_name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text 
            style={[
              styles.name,
              { color: Colors[colorScheme].text }
            ]}
            numberOfLines={1}
          >
            {item.other_user.full_name}
          </Text>
          <Text 
            style={[
              styles.time,
              { color: Colors[colorScheme].tabIconDefault }
            ]}
          >
            {format(new Date(item.last_message.created_at), 'HH:mm')}
          </Text>
        </View>

        <View style={styles.chatPreview}>
          <Text 
            style={[
              styles.previewText,
              { color: Colors[colorScheme].tabIconDefault }
            ]}
            numberOfLines={1}
          >
            {renderPreviewText(item.last_message)}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: Colors[colorScheme].tint }]}>
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
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
          Loading chats...
        </Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
          No messages yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors[colorScheme].text}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
}); 