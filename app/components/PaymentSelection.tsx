import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type PaymentMethod = {
  id: string;
  name: string;
  type: 'mobile_money' | 'wallet';
  provider?: 'mtn' | 'airtel';
  logoUrl?: string;
  balance?: number;
};

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
};

export type PaymentSelectionProps = {
  /** Available payment methods */
  paymentMethods: PaymentMethod[];
  /** Currently selected payment method ID */
  selectedMethodId?: string;
  /** Callback when a payment method is selected */
  onSelect: (methodId: string) => void;
  /** Whether to show transaction history */
  showHistory?: boolean;
  /** Transaction history items */
  transactions?: Transaction[];
};

/**
 * A reusable payment selection component that displays available payment methods
 * and transaction history.
 * 
 * Features:
 * - Mobile money options (MTN/Airtel)
 * - Wallet balance display
 * - Transaction history
 * - Visual selection indicators
 */
export default function PaymentSelection({
  paymentMethods,
  selectedMethodId,
  onSelect,
  showHistory = false,
  transactions = [],
}: PaymentSelectionProps) {
  const colorScheme = useColorScheme();
  const [expanded, setExpanded] = useState(false);

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = method.id === selectedMethodId;

    return (
      <Pressable
        key={method.id}
        style={[
          styles.methodCard,
          { backgroundColor: Colors[colorScheme].background },
          isSelected && styles.selectedCard,
        ]}
        onPress={() => onSelect(method.id)}
      >
        <View style={styles.methodHeader}>
          {method.logoUrl ? (
            <Image 
              source={{ uri: method.logoUrl }}
              style={styles.methodLogo}
            />
          ) : (
            <View style={styles.methodIcon}>
              <Ionicons 
                name={method.type === 'wallet' ? 'wallet' : 'phone-portrait'} 
                size={24} 
                color={Colors[colorScheme].text}
              />
            </View>
          )}
          <View style={styles.methodInfo}>
            <Text style={[styles.methodName, { color: Colors[colorScheme].text }]}>
              {method.name}
            </Text>
            {method.balance !== undefined && (
              <Text style={[styles.methodBalance, { color: Colors[colorScheme].text }]}>
                UGX {method.balance.toLocaleString()}
              </Text>
            )}
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color="#32CD32" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderTransaction = (transaction: Transaction) => (
    <View 
      key={transaction.id}
      style={[
        styles.transactionItem,
        { borderBottomColor: Colors[colorScheme].border }
      ]}
    >
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionDescription, { color: Colors[colorScheme].text }]}>
          {transaction.description}
        </Text>
        <Text style={[styles.transactionDate, { color: Colors[colorScheme].text }]}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>
      <Text 
        style={[
          styles.transactionAmount,
          { color: transaction.type === 'credit' ? '#32CD32' : '#FF4444' }
        ]}
      >
        {transaction.type === 'credit' ? '+' : '-'} UGX {transaction.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
        Payment Method
      </Text>
      
      <View style={styles.methodsContainer}>
        {paymentMethods.map(renderPaymentMethod)}
      </View>

      {showHistory && transactions.length > 0 && (
        <View style={styles.historyContainer}>
          <Pressable
            style={styles.historyHeader}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={[styles.historyTitle, { color: Colors[colorScheme].text }]}>
              Transaction History
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={Colors[colorScheme].text}
            />
          </Pressable>

          {expanded && (
            <ScrollView style={styles.transactionsList}>
              {transactions.map(renderTransaction)}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#32CD32',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
  },
  methodBalance: {
    fontSize: 14,
    marginTop: 4,
  },
  checkmark: {
    marginLeft: 12,
  },
  historyContainer: {
    marginTop: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsList: {
    maxHeight: 300,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 