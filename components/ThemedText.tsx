import React from 'react';
import { Text, TextProps } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';

export function ThemedText(props: TextProps) {
  const colorScheme = useColorScheme();
  const { style, ...otherProps } = props;

  return (
    <Text
      style={[
        { color: Colors[colorScheme].text },
        style,
      ]}
      {...otherProps}
    />
  );
}
