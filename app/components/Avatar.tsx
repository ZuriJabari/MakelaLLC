import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';

type AvatarProps = {
  size: number;
  imageUrl?: string | null;
  name: string;
};

export default function Avatar({ size, imageUrl, name }: AvatarProps) {
  const colorScheme = useColorScheme();
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  // Generate a consistent color based on the name
  const colors = ['#4A90E2', '#50C878', '#9370DB', '#F08080', '#FFB347'];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const backgroundColor = colors[colorIndex];

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E1E1E1',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 