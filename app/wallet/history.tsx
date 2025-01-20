import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Share } from 'react-native';
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

type Filter = {
  type?: 'credit' | 'debit';
  status?: 'completed' | 'pending' | 'failed';
  dateRange?: 'today' | 'week' | 'month' | 'all';
};

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>({
    dateRange: 'all',
  });

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.dateRange && filter.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filter.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
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

  const exportTransactions = async () => {
    try {
      // Format transactions for export
      const csvContent = transactions.map(t => {
        return `${new Date(t.created_at).toLocaleString()},${t.type},${t.amount},${t.status},${t.description}`;
      }).join('\n');

      const header = 'Date,Type,Amount,Status,Description\n';
      const content = header + csvContent;

      await Share.share({
        message: content,
        title: 'Transaction History',
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  const FilterButton = ({ label, value, current, onPress }: {
    label: string;
    value: string;
    current: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={[
        styles.filterButton,
        value === current && styles.filterButtonActive,
        { borderColor: Colors[colorScheme].border }
      ]}
      onPress={onPress}
    >
      <ThemedText style={[
        styles.filterButtonText,
        value === current && styles.filterButtonTextActive
      ]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <ThemedView style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <FilterButton
            label="All Time"
            value="all"
            current={filter.dateRange || 'all'}
            onPress={() => setFilter(prev => ({ ...prev, dateRange: 'all' }))}
          />
          <FilterButton
            label="Today"
            value="today"
            current={filter.dateRange || 'all'}
            onPress={() => setFilter(prev => ({ ...prev, dateRange: 'today' }))}
          />
          <FilterButton
            label="This Week"
            value="week"
            current={filter.dateRange || 'all'}
            onPress={() => setFilter(prev => ({ ...prev, dateRange: 'week' }))}
          />
          <FilterButton
            label="This Month"
            value="month"
            current={filter.dateRange || 'all'}
            onPress={() => setFilter(prev => ({ ...prev, dateRange: 'month' }))}
          />
        </ScrollView>

        <View style={styles.filterDivider} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <FilterButton
            label="All Types"
            value=""
            current={filter.type || ''}
            onPress={() => setFilter(prev => ({ ...prev, type: undefined }))}
          />
          <FilterButton
            label="Money In"
            value="credit"
            current={filter.type || ''}
            onPress={() => setFilter(prev => ({ ...prev, type: 'credit' }))}
          />
          <FilterButton
            label="Money Out"
            value="debit"
            current={filter.type || ''}
            onPress={() => setFilter(prev => ({ ...prev, type: 'debit' }))}
          />
        </ScrollView>
      </ThemedView>

      {/* Export Button */}
      <Pressable
        style={styles.exportButton}
        onPress={exportTransactions}
      >
        <Ionicons name="download-outline" size={20} color={Colors[colorScheme].tint} />
        <ThemedText style={styles.exportButtonText}>Export</ThemedText>
      </Pressable>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      ) : (
        <ScrollView
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors[colorScheme].text}
            />
          }
        >
          {transactions.length === 0 ? (
            <ThemedText style={styles.emptyText}>No transactions found</ThemedText>
          ) : (
            transactions.map((transaction) => (
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
                  <ThemedText style={styles.transactionDate}>
                    {new Date(transaction.created_at).toLocaleString()}
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
            ))
          )}
        </ScrollView>
      )}
    </View>
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
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filters: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterButtonText: {
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    marginTop: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    marginLeft: 4,
  },
  transactionsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
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
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
}); 