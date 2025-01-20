import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { formatUgandaPhone, isValidUgandaPhone } from '../utils/validation';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';

interface PhoneInputProps {
  onChangePhone: (phone: string, isValid: boolean) => void;
  error?: string;
}

export function PhoneInput({ onChangePhone, error }: PhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [localError, setLocalError] = useState('');
  const colorScheme = useColorScheme();

  const handleChangePhone = (value: string) => {
    const formattedPhone = formatUgandaPhone(value);
    setPhone(formattedPhone);
    
    // Validate the phone number
    const isValid = isValidUgandaPhone(formattedPhone);
    
    // Set appropriate error message
    if (formattedPhone && !isValid) {
      setLocalError('Please enter a valid Ugandan phone number (e.g. +256 700 000000)');
    } else {
      setLocalError('');
    }
    
    onChangePhone(formattedPhone, isValid);
  };

  // Show external error if provided
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <View style={[
        styles.inputContainer,
        { borderColor: error ? Colors.status.error : Colors[colorScheme].border }
      ]}>
        <Text style={[styles.prefix, { color: Colors[colorScheme].text }]}>+256</Text>
        <TextInput
          style={[
            styles.input,
            { color: Colors[colorScheme].text },
            (localError || error) && isTouched && styles.inputError
          ]}
          value={phone}
          onChangeText={handleChangePhone}
          placeholder="700 000000"
          keyboardType="phone-pad"
          onBlur={() => setIsTouched(true)}
          placeholderTextColor={`rgba(${Colors[colorScheme].text.replace(/[^\d,]/g, '')}, 0.5)`}
          maxLength={9}
        />
      </View>
      {((localError || error) && isTouched) && (
        <Text style={styles.errorText}>{localError || error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  prefix: {
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  errorText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    color: colors.status.error,
    marginTop: 4,
  },
});

export default PhoneInput; 