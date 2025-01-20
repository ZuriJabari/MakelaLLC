import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type ColorScheme = 'light' | 'dark';

export type MessageType = 'text' | 'image' | 'location';

interface MessageMetadata {
  image_url?: string;
  thumbnail_url?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
}

interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  metadata?: MessageMetadata;
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLocationPress?: (latitude: number, longitude: number) => void;
}

export default function MessageBubble({ 
  message, 
  isCurrentUser,
  onImagePress,
  onLocationPress 
}: MessageBubbleProps) {
  const colorScheme = useColorScheme() as ColorScheme;

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <Pressable 
            onPress={() => message.metadata?.image_url && onImagePress?.(message.metadata.image_url)}
          >
            <Image
              source={{ uri: message.metadata?.thumbnail_url || message.metadata?.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          </Pressable>
        );
      
      case 'location':
        return (
          <Pressable 
            style={styles.locationContainer}
            onPress={() => {
              if (message.metadata?.latitude && message.metadata?.longitude) {
                onLocationPress?.(message.metadata.latitude, message.metadata.longitude);
              }
            }}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={isCurrentUser ? '#fff' : Colors[colorScheme].text} 
            />
            <Text 
              style={[
                styles.locationText,
                { color: isCurrentUser ? '#fff' : Colors[colorScheme].text }
              ]}
            >
              {message.metadata?.location_name || 'Shared location'}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isCurrentUser ? '#fff' : Colors[colorScheme].text} 
            />
          </Pressable>
        );
      
      default:
        return (
          <Text style={[
            styles.messageText,
            { color: isCurrentUser ? '#fff' : Colors[colorScheme].text }
          ]}>
            {message.content}
          </Text>
        );
    }
  };

  const renderStatus = () => {
    if (!isCurrentUser) return null;

    let iconName: 'checkmark' | 'checkmark-done' = 'checkmark';
    let iconColor = 'rgba(255, 255, 255, 0.5)';

    switch (message.status) {
      case 'delivered':
        iconName = 'checkmark-done';
        break;
      case 'read':
        iconName = 'checkmark-done';
        iconColor = '#fff';
        break;
    }

    return (
      <Ionicons 
        name={iconName} 
        size={16} 
        color={iconColor} 
        style={styles.statusIcon}
      />
    );
  };

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUser : styles.otherUser
    ]}>
      <View style={[
        styles.bubble,
        isCurrentUser ? [
          styles.currentUserBubble,
          { backgroundColor: Colors[colorScheme].tint }
        ] : [
          styles.otherUserBubble,
          { 
            backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
            borderColor: Colors[colorScheme].border
          }
        ]
      ]}>
        {renderContent()}
        <View style={styles.footer}>
          <Text style={[
            styles.timestamp,
            { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : Colors[colorScheme].tabIconDefault }
          ]}>
            {format(new Date(message.created_at), 'HH:mm')}
          </Text>
          {renderStatus()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: 'row',
  },
  currentUser: {
    justifyContent: 'flex-end',
  },
  otherUser: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  statusIcon: {
    marginLeft: 4,
  },
}); 