import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type ColorScheme = 'light' | 'dark';

export default function OTPScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  
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

    // Move to next input if value is entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
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

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: '', // This will be filled by Supabase from the session
        token: otpValue,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .single();

      // Redirect based on profile completion
      if (profile?.full_name) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);
      setResendLoading(true);

      const { error: resendError } = await supabase.auth.resend({
        type: 'sms',
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
        <Ionicons name="shield-checkmark" size={64} color={Colors[colorScheme].text} />
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Verify your number
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          Enter the 6-digit code we sent you
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              style={[
                styles.otpInput,
                { 
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].border,
                  backgroundColor: Colors[colorScheme].background,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
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
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>

        <View style={styles.resendContainer}>
          {canResend ? (
            <Pressable
              onPress={handleResendOTP}
              disabled={resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={Colors[colorScheme].text} />
              ) : (
                <Text style={[styles.resendText, { color: Colors[colorScheme].text }]}>
                  Resend Code
                </Text>
              )}
            </Pressable>
          ) : (
            <Text style={[styles.countdownText, { color: Colors[colorScheme].text }]}>
              Resend code in {countdown}s
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    width: '100%',
    gap: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    height: 50,
    backgroundColor: '#32CD32',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  countdownText: {
    fontSize: 16,
    opacity: 0.7,
  },
}); 