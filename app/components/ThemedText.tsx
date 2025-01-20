import React from 'react';
import { Text, TextProps } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';

export interface ThemedTextProps extends TextProps {
  style?: TextProps['style'];
}

const ThemedText = (props: ThemedTextProps) => {
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

export default ThemedText; 