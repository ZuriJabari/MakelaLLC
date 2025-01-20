import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

type ColorScheme = 'light' | 'dark';

interface InputToolbarProps {
  onSend: (message: {
    type: 'text' | 'image' | 'location';
    content: string;
    metadata?: {
      image_url?: string;
      thumbnail_url?: string;
      latitude?: number;
      longitude?: number;
      location_name?: string;
    };
  }) => void;
}

export default function InputToolbar({ onSend }: InputToolbarProps) {
  const colorScheme = useColorScheme() as ColorScheme;
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSendText = () => {
    if (!text.trim()) return;
    onSend({
      type: 'text',
      content: text.trim(),
    });
    setText('');
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        // Here you would typically upload the image to your storage
        // and get back the URL. For now, we'll just simulate it
        setTimeout(() => {
          onSend({
            type: 'image',
            content: 'Image',
            metadata: {
              image_url: result.assets[0].uri,
              thumbnail_url: result.assets[0].uri,
            },
          });
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsLoading(false);
    }
  };

  const handleLocationShare = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need location permissions to share your location.');
        return;
      }

      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = address 
        ? `${address.street || ''}, ${address.city || ''}`
        : 'Current Location';

      onSend({
        type: 'location',
        content: locationName,
        metadata: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          location_name: locationName,
        },
      });
    } catch (error) {
      console.error('Error sharing location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toolbar = (
    <View style={[
      styles.container,
      { 
        backgroundColor: Colors[colorScheme].background,
        borderTopColor: Colors[colorScheme].border,
      }
    ]}>
      <View style={styles.inputContainer}>
        <Pressable
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'add'}
            size={24}
            color={Colors[colorScheme].text}
          />
        </Pressable>

        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#333',
            }
          ]}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={Colors[colorScheme].tabIconDefault}
          multiline
        />

        {text.trim() ? (
          <Pressable
            style={[styles.sendButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={handleSendText}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      {isExpanded && (
        <View style={styles.expandedContainer}>
          <Pressable
            style={styles.actionButton}
            onPress={handleImagePick}
            disabled={isLoading}
          >
            <Ionicons
              name="image"
              size={24}
              color={Colors[colorScheme].text}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={handleLocationShare}
            disabled={isLoading}
          >
            <Ionicons
              name="location"
              size={24}
              color={Colors[colorScheme].text}
            />
          </Pressable>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors[colorScheme].tint} />
        </View>
      )}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={90}>
        {toolbar}
      </KeyboardAvoidingView>
    );
  }

  return toolbar;
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 12,
  },
  expandButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 