import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from './components/useColorScheme';
import Colors from './constants/Colors';

export default function NotFoundScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Oops!</Text>
      <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
        This screen doesn't exist.
      </Text>
      <Pressable
        style={[styles.button]}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.buttonText}>Go to home screen!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 