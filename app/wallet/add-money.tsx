import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

type PaymentMethod = 'mtn' | 'airtel';

interface PaymentDetails {
  amount: string;
  phoneNumber: string;
  method: PaymentMethod;
}

export default function AddMoneyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amount: '',
    phoneNumber: '',
    method: 'mtn',
  });

  const handlePayment = async () => {
    try {
      if (!paymentDetails.amount || !paymentDetails.phoneNumber) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const amount = parseFloat(paymentDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Initialize payment request
      const { data: paymentRequest, error: paymentError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          amount,
          phone_number: paymentDetails.phoneNumber,
          payment_method: paymentDetails.method,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // In a real app, you would integrate with a payment gateway here
      // For demo purposes, we'll simulate a successful payment after 2 seconds
      setTimeout(async () => {
        try {
          // Update payment request status
          const { error: updateError } = await supabase
            .from('payment_requests')
            .update({ status: 'completed' })
            .eq('id', paymentRequest.id);

          if (updateError) throw updateError;

          // Create transaction record
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'credit',
              amount,
              description: `Added money via ${paymentDetails.method.toUpperCase()}`,
              status: 'completed',
            });

          if (transactionError) throw transactionError;

          // Update wallet balance
          const { error: walletError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: amount,
          });

          if (walletError) throw walletError;

          Alert.alert(
            'Success',
            'Money added successfully!',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } catch (error) {
          console.error('Error processing payment:', error);
          Alert.alert('Error', 'Failed to process payment. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText style={styles.title}>Add Money</ThemedText>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Amount (UGX)</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
            ]}
            placeholder="Enter amount"
            placeholderTextColor={Colors[colorScheme].text + '80'}
            keyboardType="numeric"
            value={paymentDetails.amount}
            onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, amount: text }))}
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Mobile Money Number</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
            ]}
            placeholder="Enter phone number"
            placeholderTextColor={Colors[colorScheme].text + '80'}
            keyboardType="phone-pad"
            value={paymentDetails.phoneNumber}
            onChangeText={(text) => setPaymentDetails(prev => ({ ...prev, phoneNumber: text }))}
          />
        </View>

        {/* Payment Method Selection */}
        <View style={styles.methodContainer}>
          <ThemedText style={styles.label}>Select Payment Method</ThemedText>
          <View style={styles.methodOptions}>
            <Pressable
              style={[
                styles.methodOption,
                paymentDetails.method === 'mtn' && styles.methodOptionSelected,
                { borderColor: Colors[colorScheme].border }
              ]}
              onPress={() => setPaymentDetails(prev => ({ ...prev, method: 'mtn' }))}
            >
              <Ionicons
                name="phone-portrait"
                size={24}
                color={paymentDetails.method === 'mtn' ? Colors[colorScheme].tint : Colors[colorScheme].text}
              />
              <ThemedText style={[
                styles.methodText,
                paymentDetails.method === 'mtn' && { color: Colors[colorScheme].tint }
              ]}>
                MTN Mobile Money
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.methodOption,
                paymentDetails.method === 'airtel' && styles.methodOptionSelected,
                { borderColor: Colors[colorScheme].border }
              ]}
              onPress={() => setPaymentDetails(prev => ({ ...prev, method: 'airtel' }))}
            >
              <Ionicons
                name="phone-portrait"
                size={24}
                color={paymentDetails.method === 'airtel' ? Colors[colorScheme].tint : Colors[colorScheme].text}
              />
              <ThemedText style={[
                styles.methodText,
                paymentDetails.method === 'airtel' && { color: Colors[colorScheme].tint }
              ]}>
                Airtel Money
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Payment Button */}
        <Pressable
          style={[
            styles.payButton,
            loading && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="wallet" size={24} color="#fff" />
              <ThemedText style={styles.payButtonText}>Add Money</ThemedText>
            </>
          )}
        </Pressable>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={Colors[colorScheme].text} />
          <ThemedText style={styles.securityText}>
            Your transaction is secure and encrypted
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  methodContainer: {
    marginBottom: 24,
  },
  methodOptions: {
    gap: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  methodOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint + '10',
  },
  methodText: {
    fontSize: 16,
    marginLeft: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  securityText: {
    fontSize: 14,
    marginLeft: 8,
  },
}); 