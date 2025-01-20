import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

interface GradientBackgroundProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function GradientBackground({ style, children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={[Colors.primary.deepPurple, Colors.primary.electricIndigo]}
      style={[styles.gradient, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
}); 