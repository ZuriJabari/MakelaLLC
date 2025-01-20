import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type ColorScheme = 'light' | 'dark';

export default function VerifyScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatUgandaPhone = (phone: string) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check if the number starts with '256' (Uganda country code)
    if (digits.startsWith('256')) {
      return digits;
    }
    
    // If it starts with '0', replace it with '256'
    if (digits.startsWith('0')) {
      return `256${digits.slice(1)}`;
    }
    
    // Otherwise, just prepend '256'
    return `256${digits}`;
  };

  const isValidUgandaPhone = (phone: string) => {
    const formattedPhone = formatUgandaPhone(phone);
    // Uganda phone numbers are 12 digits (256 + 9 digits)
    return /^256\d{9}$/.test(formattedPhone);
  };

  const handleVerify = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!phoneNumber) {
        throw new Error('Please enter your phone number');
      }

      const formattedPhone = formatUgandaPhone(phoneNumber);
      if (!isValidUgandaPhone(formattedPhone)) {
        throw new Error('Please enter a valid Uganda phone number');
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (signInError) throw signInError;

      router.push('/otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
        Welcome to Makela
      </Text>
      <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
        Enter your phone number to continue
      </Text>

      <View style={styles.inputContainer}>
        <View style={[styles.phoneInput, { borderColor: Colors[colorScheme].border }]}>
          <Ionicons name="call-outline" size={20} color={Colors[colorScheme].text} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: Colors[colorScheme].text }]}
            placeholder="Phone number"
            placeholderTextColor={Colors[colorScheme].tabIconDefault}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!loading}
          />
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#32CD32',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
}); 