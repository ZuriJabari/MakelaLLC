import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';

export interface ThemedViewProps extends ViewProps {
  style?: ViewProps['style'];
}

const ThemedView = (props: ThemedViewProps) => {
  const colorScheme = useColorScheme();
  const { style, ...otherProps } = props;

  return (
    <View
      style={[
        { backgroundColor: Colors[colorScheme].background },
        style,
      ]}
      {...otherProps}
    />
  );
}

export default ThemedView; 