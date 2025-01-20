import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { formatUgandaPhone, isValidUgandaPhone } from '../utils/validation';

interface PhoneInputProps {
  onChangePhone: (phone: string, isValid: boolean) => void;
  error?: string;
}

export function PhoneInput({ onChangePhone, error }: PhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [localError, setLocalError] = useState('');

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
      <TextInput
        style={[
          styles.input,
          (localError || error) && isTouched && styles.inputError
        ]}
        value={phone}
        onChangeText={handleChangePhone}
        placeholder="+256 700 000000"
        keyboardType="phone-pad"
        onBlur={() => setIsTouched(true)}
        placeholderTextColor={colors.text.disabled}
      />
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
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.stellarSilver,
    paddingHorizontal: 16,
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
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