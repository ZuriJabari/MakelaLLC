import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type ColorScheme = 'light' | 'dark';

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const colorScheme = useColorScheme() as ColorScheme;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, canResend]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    try {
      setError(null);
      setLoading(true);

      const otpValue = otp.join('');
      if (otpValue.length !== 6) {
        throw new Error('Please enter the complete verification code');
      }

      // For development, check if using test credentials
      if (phone === '256782374230' && otpValue !== '123456') {
        throw new Error('Invalid verification code');
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otpValue,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // The root layout will handle navigation based on auth state
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);
      setResendLoading(true);

      if (!phone) {
        throw new Error('No phone number found');
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'sms',
        phone: phone,
      });

      if (resendError) throw resendError;

      setCountdown(30);
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors[colorScheme].text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={64} color={Colors[colorScheme].text} />
        </View>

        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Verify your number
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          Enter the 6-digit code we sent you
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                { 
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].border,
                  backgroundColor: Colors[colorScheme].background
                }
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.some(digit => !digit)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleResendOTP}
          disabled={!canResend || resendLoading}
          style={styles.resendButton}
        >
          <Text style={[
            styles.resendText,
            (!canResend || resendLoading) && styles.resendTextDisabled
          ]}>
            {resendLoading ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#32CD32',
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  resendButton: {
    padding: 8,
  },
  resendText: {
    color: '#32CD32',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    opacity: 0.5,
    textDecorationLine: 'none',
  },
}); 