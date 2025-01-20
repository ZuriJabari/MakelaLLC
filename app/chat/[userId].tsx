import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import MessageBubble, { MessageType } from '../components/chat/MessageBubble';
import InputToolbar from '../components/chat/InputToolbar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@supabase/supabase-js';

type ColorScheme = 'light' | 'dark';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  metadata?: {
    image_url?: string;
    thumbnail_url?: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
  };
}

interface RideDetails {
  id: string;
  origin: string;
  destination: string;
  date: string;
  driver: {
    id: string;
    full_name: string;
  };
}

interface RideResponse {
  id: string;
  origin: string;
  destination: string;
  date: string;
  driver: {
    id: string;
    full_name: string;
  };
}

export default function ChatScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const { userId, ride } = useLocalSearchParams<{ userId: string; ride: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: string; full_name: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    loadRideDetails();
    loadUserDetails();
    subscribeToMessages();
    subscribeToTyping();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadMessages = async () => {
    try {
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (!profile) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', `${profile.id}_${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(messages || []);

      // Mark messages as read
      if (messages?.length) {
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('sender_id', userId)
          .eq('status', 'delivered');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRideDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          origin,
          destination,
          date,
          driver:profiles!driver_id(id, full_name)
        `)
        .eq('id', ride)
        .single();

      if (error) throw error;
      if (data) {
        const rideData = {
          id: data.id as string,
          origin: data.origin as string,
          destination: data.destination as string,
          date: data.date as string,
          driver: {
            id: (data.driver as any).id as string,
            full_name: (data.driver as any).full_name as string,
          },
        } satisfies RideResponse;

        setRideDetails(rideData);
      }
    } catch (error) {
      console.error('Error loading ride details:', error);
    }
  };

  const loadUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setOtherUser({
          id: data.id,
          full_name: data.full_name,
        });
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!currentUser) return;

    // Get profile ID first
    supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .single()
      .then(({ data: profile }) => {
        if (!profile) return;

        const channel = supabase
          .channel('chat_messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${profile.id}_${userId}`,
            },
            async (payload: { new: Message }) => {
              const newMessage = payload.new;
              setMessages(prev => [...prev, newMessage]);
              
              // Mark message as delivered
              if (newMessage.sender_id === userId) {
                await supabase
                  .from('messages')
                  .update({ status: 'delivered' })
                  .eq('id', newMessage.id);
              }

              // Scroll to bottom
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      });
  };

  const subscribeToTyping = () => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`typing_${userId}`)
      .on('broadcast', { event: 'typing' }, () => {
        setIsTyping(true);
        // Hide typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async (message: { type: MessageType; content: string; metadata?: any }) => {
    try {
      if (!currentUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: `${profile.id}_${userId}`,
          sender_id: profile.id,
          receiver_id: userId,
          type: message.type,
          content: message.content,
          metadata: message.metadata,
          status: 'sent',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    // Implement image viewer
  };

  const handleLocationPress = (latitude: number, longitude: number) => {
    // Implement map view
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: Colors[colorScheme].border }]}>
      <Pressable
        style={styles.rideInfo}
        onPress={() => router.push(`/ride/${rideDetails?.id}`)}
      >
        <View>
          <Text style={[styles.rideTitle, { color: Colors[colorScheme].text }]}>
            {rideDetails?.origin} → {rideDetails?.destination}
          </Text>
          <Text style={[styles.rideSubtitle, { color: Colors[colorScheme].tabIconDefault }]}>
            {rideDetails?.driver.id === userId ? 'Driver' : 'Passenger'}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={Colors[colorScheme].tabIconDefault} 
        />
      </Pressable>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    if (!currentUser) return null;

    return (
      <MessageBubble
        message={item}
        isCurrentUser={item.sender_id === currentUser.id}
        onImagePress={handleImagePress}
        onLocationPress={handleLocationPress}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <View style={[styles.typingContainer, { backgroundColor: Colors[colorScheme].background }]}>
          <Text style={[styles.typingText, { color: Colors[colorScheme].tabIconDefault }]}>
            {otherUser?.full_name} is typing...
          </Text>
        </View>
      )}

      <InputToolbar onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rideSubtitle: {
    fontSize: 14,
  },
  messageList: {
    paddingVertical: 16,
  },
  typingContainer: {
    padding: 8,
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 