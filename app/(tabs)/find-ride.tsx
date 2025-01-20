import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Pressable, RefreshControl, TextInput, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { buttonStyles } from '../theme/components/buttons';
import RideCard from '../components/RideCard';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

type Driver = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  total_rides: number;
  vehicle_details: {
    type: string;
    color: string;
    plate_number: string;
    year: number;
    seats: number;
  };
  rating_count: number;
  verification_badges: Array<{
    type: 'phone' | 'email' | 'id' | 'license';
    verified: boolean;
  }>;
};

type Ride = {
  id: string;
  driver: Driver;
  origin_address: string;
  destination_address: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
};

type SortOption = 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'seats_asc' | 'seats_desc';

export default function FindRideScreen() {
  const colorScheme = useColorScheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minSeats, setMinSeats] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey (
            id,
            full_name,
            avatar_url,
            rating,
            total_rides,
            vehicle_details
          )
        `)
        .eq('status', 'pending')
        .gte('departure_time', new Date().toISOString())
        .gt('available_seats', 0);

      const { data, error } = await query;
      
      if (error) throw error;
      
      setRides(data || []);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading rides:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const handleBookRide = async (rideId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('bookings')
        .insert({
          ride_id: rideId,
          passenger_id: user.id,
          seats_booked: 1,
          status: 'pending'
        });

      if (error) throw error;
      router.push(`/booking/${rideId}`);
    } catch (error) {
      console.error('Error booking ride:', error);
    }
  };

  const sortRides = (rides: Ride[]) => {
    return [...rides].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price_per_seat - b.price_per_seat;
        case 'price_desc':
          return b.price_per_seat - a.price_per_seat;
        case 'date_asc':
          return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
        case 'date_desc':
          return new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime();
        case 'seats_asc':
          return a.available_seats - b.available_seats;
        case 'seats_desc':
          return b.available_seats - a.available_seats;
        default:
          return 0;
      }
    });
  };

  const filterRides = (rides: Ride[]) => {
    return rides.filter(ride => {
      if (minPrice && ride.price_per_seat < minPrice) return false;
      if (maxPrice && ride.price_per_seat > maxPrice) return false;
      if (minSeats && ride.available_seats < minSeats) return false;
      if (selectedDate) {
        const rideDate = new Date(ride.departure_time);
        const selected = new Date(selectedDate);
        if (
          rideDate.getDate() !== selected.getDate() ||
          rideDate.getMonth() !== selected.getMonth() ||
          rideDate.getFullYear() !== selected.getFullYear()
        ) {
          return false;
        }
      }
      return true;
    });
  };

  const renderRide = ({ item }: { item: Ride }) => (
    <RideCard
      originAddress={item.origin_address}
      destinationAddress={item.destination_address}
      departureTime={item.departure_time}
      pricePerSeat={item.price_per_seat}
      availableSeats={item.available_seats}
      driver={item.driver}
      status={item.status}
      primaryActionText="Book Now"
      onPrimaryAction={() => handleBookRide(item.id)}
    />
  );

  const renderSortButton = (option: SortOption, icon: keyof typeof Ionicons.glyphMap, label: string) => (
    <Pressable 
      style={[
        styles.filterButton,
        sortBy === option && styles.filterButtonActive
      ]}
      onPress={() => setSortBy(option)}
    >
      <Ionicons 
        name={icon}
        size={20} 
        color={sortBy === option ? colors.text.inverse : colors.text.primary} 
      />
      <Text style={[
        styles.filterButtonText,
        sortBy === option && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.primary.colors[0], gradients.primary.colors[1]]}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Available Rides</Text>
        
        {/* Sort Controls */}
        <View style={styles.controls}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortButtons}
          >
            {renderSortButton('price_asc', 'arrow-up', 'Price Low to High')}
            {renderSortButton('price_desc', 'arrow-down', 'Price High to Low')}
            {renderSortButton('date_asc', 'time-outline', 'Earliest First')}
            {renderSortButton('date_desc', 'time-outline', 'Latest First')}
            {renderSortButton('seats_asc', 'people-outline', 'Least Seats')}
            {renderSortButton('seats_desc', 'people-outline', 'Most Seats')}
          </ScrollView>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={minPrice?.toString()}
                onChangeText={(text) => setMinPrice(text ? parseInt(text) : null)}
                keyboardType="numeric"
                placeholderTextColor={colors.text.disabled}
              />
              <Text style={styles.filterLabel}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={maxPrice?.toString()}
                onChangeText={(text) => setMaxPrice(text ? parseInt(text) : null)}
                keyboardType="numeric"
                placeholderTextColor={colors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Min Seats</Text>
            <TextInput
              style={styles.seatsInput}
              placeholder="1"
              value={minSeats?.toString()}
              onChangeText={(text) => setMinSeats(text ? parseInt(text) : null)}
              keyboardType="numeric"
              placeholderTextColor={colors.text.disabled}
            />
          </View>

          <Pressable 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.text.inverse} />
            <Text style={styles.dateButtonText}>
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select Date'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Rides List */}
      <FlatList
        data={sortRides(filterRides(rides))}
        renderItem={renderRide}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.text.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {loading ? 'Finding available rides...' : 'No rides available'}
            </Text>
          </View>
        }
      />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  } as ViewStyle,
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.primary,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: 16,
  } as TextStyle,
  controls: {
    marginBottom: 16,
  } as ViewStyle,
  sortButtons: {
    gap: 8,
    paddingRight: 20,
  } as ViewStyle,
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    gap: 8,
  } as ViewStyle,
  filterButtonActive: {
    backgroundColor: colors.primary.deepPurple,
  } as ViewStyle,
  filterButtonText: {
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.primary,
  } as TextStyle,
  filterButtonTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  filterSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  } as ViewStyle,
  filterGroup: {
    gap: 8,
  } as ViewStyle,
  filterLabel: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.inverse,
  } as TextStyle,
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  priceInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.text.primary,
    fontSize: typography.sizes.body2,
  } as TextStyle,
  seatsInput: {
    height: 40,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.text.primary,
    fontSize: typography.sizes.body2,
    width: 80,
  } as TextStyle,
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary.deepPurple,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  } as ViewStyle,
  dateButtonText: {
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.inverse,
  } as TextStyle,
  list: {
    padding: 16,
  } as ViewStyle,
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  } as TextStyle,
}); 