import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WalletBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, currency, last_updated')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      setBalance(walletData);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: balance?.currency || 'UGX',
    }).format(amount);
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    return type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = (type: Transaction['type']) => {
    return type === 'credit' ? '#4CAF50' : '#F44336';
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
        return '#F44336';
      default:
        return Colors[colorScheme].text;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors[colorScheme].text}
        />
      }
    >
      {/* Balance Card */}
      <ThemedView style={styles.balanceCard}>
        <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
        <ThemedText style={styles.balanceAmount}>
          {formatCurrency(balance?.balance || 0)}
        </ThemedText>
        <ThemedText style={styles.lastUpdated}>
          Last updated: {new Date(balance?.last_updated || '').toLocaleString()}
        </ThemedText>
        <Pressable
          style={styles.addMoneyButton}
          onPress={() => router.push('/wallet/add-money')}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <ThemedText style={styles.addMoneyText}>Add Money</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Recent Transactions */}
      <ThemedView style={styles.transactionsCard}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
          <Pressable
            onPress={() => router.push('/wallet/history')}
            style={styles.viewAllButton}
          >
            <ThemedText style={styles.viewAllText}>View All</ThemedText>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors[colorScheme].tint}
            />
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <ThemedText style={styles.emptyText}>No recent transactions</ThemedText>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <Pressable
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => router.push(`/wallet/transaction/${transaction.id}`)}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <ThemedText style={styles.transactionDescription}>
                    {transaction.description}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.transactionStatus,
                      { color: getStatusColor(transaction.status) }
                    ]}
                  >
                    {transaction.status}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction.type) }
                  ]}
                >
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.5,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addMoneyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.tint,
    marginRight: 4,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 20,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 16,
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 