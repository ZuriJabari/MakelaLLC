import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type DashboardStats = {
  todayEarnings: number;
  totalEarnings: number;
  completedRides: number;
  rating: number;
  todayRides: Array<{
    id: string;
    pickup: string;
    dropoff: string;
    time: string;
    amount: number;
    status: string;
  }>;
};

export default function DriverDashboard() {
  const colorScheme = useColorScheme();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    totalEarnings: 0,
    completedRides: 0,
    rating: 0,
    todayRides: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load driver stats
      const { data: statsData, error: statsError } = await supabase
        .from('driver_stats')
        .select('*')
        .eq('driver_id', user.id)
        .single();

      if (statsError) throw statsError;

      // Load today's rides
      const today = new Date().toISOString().split('T')[0];
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', user.id)
        .gte('departure_time', today)
        .lt('departure_time', today + 'T23:59:59')
        .order('departure_time', { ascending: true });

      if (ridesError) throw ridesError;

      setStats({
        todayEarnings: statsData?.today_earnings || 0,
        totalEarnings: statsData?.total_earnings || 0,
        completedRides: statsData?.completed_rides || 0,
        rating: statsData?.rating || 0,
        todayRides: ridesData || [],
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isOnline;
      setIsOnline(newStatus);

      const { error } = await supabase
        .from('driver_status')
        .upsert({
          driver_id: user.id,
          is_online: newStatus,
          last_updated: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
      setIsOnline(!isOnline); // Revert on error
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Online Status Toggle */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: Colors[colorScheme].text }]}>
          {isOnline ? 'You are Online' : 'You are Offline'}
        </Text>
        <Switch
          value={isOnline}
          onValueChange={toggleOnlineStatus}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isOnline ? '#4A90E2' : '#f4f3f4'}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme].tint }]}>
          <Text style={styles.statsLabel}>Today's Earnings</Text>
          <Text style={styles.statsValue}>UGX {stats.todayEarnings.toLocaleString()}</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme].tint }]}>
          <Text style={styles.statsLabel}>Total Earnings</Text>
          <Text style={styles.statsValue}>UGX {stats.totalEarnings.toLocaleString()}</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme].tint }]}>
          <Text style={styles.statsLabel}>Completed Rides</Text>
          <Text style={styles.statsValue}>{stats.completedRides}</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme].tint }]}>
          <Text style={styles.statsLabel}>Rating</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.statsValue}>{stats.rating.toFixed(1)}</Text>
            <Ionicons name="star" size={20} color="#FFD700" />
          </View>
        </View>
      </View>

      {/* Today's Rides */}
      <View style={styles.ridesSection}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Today's Rides
        </Text>
        {stats.todayRides.length === 0 ? (
          <Text style={[styles.noRidesText, { color: Colors[colorScheme].text }]}>
            No rides scheduled for today
          </Text>
        ) : (
          stats.todayRides.map((ride) => (
            <View 
              key={ride.id} 
              style={[styles.rideCard, { backgroundColor: Colors[colorScheme].tint }]}
            >
              <View style={styles.rideInfo}>
                <Text style={styles.rideLocation}>
                  <Ionicons name="location" size={16} color="#fff" /> {ride.pickup}
                </Text>
                <Text style={styles.rideLocation}>
                  <Ionicons name="location" size={16} color="#fff" /> {ride.dropoff}
                </Text>
                <Text style={styles.rideTime}>
                  <Ionicons name="time" size={16} color="#fff" /> {ride.time}
                </Text>
              </View>
              <Text style={styles.rideAmount}>
                UGX {ride.amount.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  statsValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ridesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noRidesText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  rideCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideInfo: {
    gap: 8,
  },
  rideLocation: {
    color: '#fff',
    fontSize: 16,
  },
  rideTime: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  rideAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
}); 