import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Avatar from '../components/Avatar';

type Ride = {
  id: string;
  driver_id: string;
  origin_address: string;
  destination_address: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  status: string;
  driver: {
    full_name: string;
    avatar_url: string | null;
    rating: number;
  };
};

export default function RidesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<any>(null);

  useEffect(() => {
    // Only update search params if they've changed
    const newParams = {
      originLat: params.originLat,
      originLng: params.originLng,
      originAddress: params.originAddress,
      destLat: params.destLat,
      destLng: params.destLng,
      destAddress: params.destAddress,
      date: params.date,
      seats: params.seats,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
    };

    // Check if params have actually changed
    if (JSON.stringify(newParams) !== JSON.stringify(searchParams)) {
      setSearchParams(newParams);
      loadRides();
    }
  }, [params]);

  const loadRides = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey (
            full_name,
            avatar_url,
            rating
          )
        `)
        .eq('status', 'pending')
        .gt('available_seats', 0)
        .gte('departure_time', new Date().toISOString());

      // Apply filters if they exist
      if (params.originLat && params.originLng) {
        query = query.ilike('origin_address', `%${params.originAddress}%`);
      }
      if (params.destLat && params.destLng) {
        query = query.ilike('destination_address', `%${params.destAddress}%`);
      }
      if (params.date) {
        const searchDate = new Date(params.date as string).toISOString().split('T')[0];
        query = query.gte('departure_time', `${searchDate}T00:00:00`)
          .lt('departure_time', `${searchDate}T23:59:59`);
      }
      if (params.seats) {
        query = query.gte('available_seats', parseInt(params.seats as string));
      }
      if (params.minPrice) {
        query = query.gte('price_per_seat', parseInt(params.minPrice as string));
      }
      if (params.maxPrice) {
        query = query.lte('price_per_seat', parseInt(params.maxPrice as string));
      }

      const { data: ridesData, error: ridesError } = await query
        .order('departure_time', { ascending: true });

      if (ridesError) throw ridesError;
      setRides(ridesData || []);
    } catch (error) {
      console.error('Error loading rides:', error);
      setError('Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const handleBooking = async (ride: Ride) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('passenger_requests')
        .insert({
          ride_id: ride.id,
          passenger_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      // Navigate to booking confirmation
      router.push({
        pathname: '/booking/[rideId]',
        params: { rideId: ride.id },
      });
    } catch (error) {
      console.error('Error booking ride:', error);
      setError('Failed to book ride');
    }
  };

  const renderRideCard = ({ item: ride }: { item: Ride }) => (
    <View 
      style={[
        styles.rideCard,
        { backgroundColor: Colors[colorScheme].background }
      ]}
    >
      {/* Driver Info */}
      <View style={styles.driverInfo}>
        <Avatar
          size={48}
          imageUrl={ride.driver.avatar_url}
          name={ride.driver.full_name}
        />
        <View style={styles.driverDetails}>
          <Text style={[styles.driverName, { color: Colors[colorScheme].text }]}>
            {ride.driver.full_name}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={[styles.ratingText, { color: Colors[colorScheme].text }]}>
              {ride.driver.rating?.toFixed(1) || 'New'}
            </Text>
          </View>
        </View>
      </View>

      {/* Ride Details */}
      <View style={styles.rideDetails}>
        <Text style={[styles.locationText, { color: Colors[colorScheme].text }]}>
          <Ionicons name="location" size={16} color={Colors[colorScheme].text} /> {ride.origin_address}
        </Text>
        <Text style={[styles.locationText, { color: Colors[colorScheme].text }]}>
          <Ionicons name="location" size={16} color={Colors[colorScheme].text} /> {ride.destination_address}
        </Text>
        <Text style={[styles.departureTime, { color: Colors[colorScheme].text }]}>
          <Ionicons name="time" size={16} color={Colors[colorScheme].text} /> {new Date(ride.departure_time).toLocaleString()}
        </Text>
      </View>

      {/* Price and Seats */}
      <View style={styles.rideInfo}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>Price per seat</Text>
          <Text style={[styles.infoValue, { color: Colors[colorScheme].text }]}>
            UGX {ride.price_per_seat.toLocaleString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: Colors[colorScheme].text }]}>Available seats</Text>
          <Text style={[styles.infoValue, { color: Colors[colorScheme].text }]}>
            {ride.available_seats}
          </Text>
        </View>
      </View>

      {/* Book Button */}
      <Pressable
        style={styles.bookButton}
        onPress={() => handleBooking(ride)}
      >
        <Text style={styles.bookButtonText}>Book Ride</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <FlatList
        data={rides}
        renderItem={renderRideCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors[colorScheme].text}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: Colors[colorScheme].text }]}>
            No rides found matching your criteria
          </Text>
        }
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  rideCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  rideDetails: {
    marginBottom: 16,
    gap: 8,
  },
  locationText: {
    fontSize: 16,
  },
  departureTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#32CD32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    margin: 16,
  },
}); 