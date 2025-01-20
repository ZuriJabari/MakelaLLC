import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';

type RideDetails = {
  id: string;
  driver_id: string;
  origin_address: string;
  destination_address: string;
  departure_time: string;
  price_per_seat: number;
  driver: {
    full_name: string;
    avatar_url: string | null;
    rating: number;
    phone_number: string;
  };
};

export default function BookingConfirmationScreen() {
  const { rideId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey (
            full_name,
            avatar_url,
            rating,
            phone_number
          )
        `)
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);
    } catch (error) {
      console.error('Error loading ride details:', error);
      setError('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // Implement payment logic here
    // For now, just show success and navigate to chat
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update booking status to paid
      const { error } = await supabase
        .from('passenger_requests')
        .update({ status: 'paid' })
        .eq('ride_id', rideId)
        .eq('passenger_id', user.id);

      if (error) throw error;

      // Navigate to chat with driver
      router.push(`/chat/${ride?.driver_id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>
          {error || 'Ride not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Booking Confirmation</Text>

      {/* Driver Info */}
      <View style={styles.driverCard}>
        <Avatar
          size={60}
          imageUrl={ride.driver.avatar_url}
          name={ride.driver.full_name}
        />
        <View style={styles.driverInfo}>
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
      <View style={styles.detailsCard}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Ride Details
        </Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color={Colors[colorScheme].text} />
          <View style={styles.detailTexts}>
            <Text style={[styles.detailLabel, { color: Colors[colorScheme].text }]}>From</Text>
            <Text style={[styles.detailValue, { color: Colors[colorScheme].text }]}>
              {ride.origin_address}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color={Colors[colorScheme].text} />
          <View style={styles.detailTexts}>
            <Text style={[styles.detailLabel, { color: Colors[colorScheme].text }]}>To</Text>
            <Text style={[styles.detailValue, { color: Colors[colorScheme].text }]}>
              {ride.destination_address}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color={Colors[colorScheme].text} />
          <View style={styles.detailTexts}>
            <Text style={[styles.detailLabel, { color: Colors[colorScheme].text }]}>Departure</Text>
            <Text style={[styles.detailValue, { color: Colors[colorScheme].text }]}>
              {new Date(ride.departure_time).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Details */}
      <View style={styles.paymentCard}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Payment Details
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: Colors[colorScheme].text }]}>Price per seat</Text>
          <Text style={[styles.priceValue, { color: Colors[colorScheme].text }]}>
            UGX {ride.price_per_seat.toLocaleString()}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: Colors[colorScheme].text }]}>Service fee</Text>
          <Text style={[styles.priceValue, { color: Colors[colorScheme].text }]}>
            UGX {(ride.price_per_seat * 0.1).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: Colors[colorScheme].text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: Colors[colorScheme].text }]}>
            UGX {(ride.price_per_seat * 1.1).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.paymentMethodsCard}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Payment Methods
        </Text>
        <Pressable style={styles.paymentMethod}>
          <Ionicons name="phone-portrait" size={24} color={Colors[colorScheme].text} />
          <Text style={[styles.paymentMethodText, { color: Colors[colorScheme].text }]}>
            Mobile Money
          </Text>
        </Pressable>
        <Pressable style={styles.paymentMethod}>
          <Ionicons name="wallet" size={24} color={Colors[colorScheme].text} />
          <Text style={[styles.paymentMethodText, { color: Colors[colorScheme].text }]}>
            Wallet Balance
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.payButton}
        onPress={handlePayment}
      >
        <Text style={styles.payButtonText}>Pay Now</Text>
      </Pressable>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
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
  detailsCard: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailTexts: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
  },
  paymentCard: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  paymentMethodsCard: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 12,
  },
  payButton: {
    backgroundColor: '#32CD32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    marginTop: 8,
  },
}); 