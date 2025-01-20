import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import Colors from '../constants/Colors';

interface AvatarProps {
  size: number;
  imageUrl: string | null;
  name: string;
}

export default function Avatar({ size, imageUrl, name }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: Colors.light.tint,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: size,
      height: size,
    },
    initials: {
      color: '#fff',
      fontSize: size * 0.4,
      fontWeight: '600',
    },
  });

  if (imageUrl) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.initials}>{initials}</ThemedText>
    </View>
  );
} 