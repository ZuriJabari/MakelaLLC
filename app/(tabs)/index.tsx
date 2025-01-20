import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import LocationInput from '../components/LocationInput';
import UserProfileCard from '../components/UserProfileCard';
import RideCard from '../components/RideCard';
import PaymentSelection from '../components/PaymentSelection';
import { supabase } from '../lib/supabase';

type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  // Example payment methods
  const paymentMethods = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      type: 'mobile_money' as const,
      provider: 'mtn' as const,
      balance: 50000,
    },
    {
      id: 'airtel',
      name: 'Airtel Money',
      type: 'mobile_money' as const,
      provider: 'airtel' as const,
      balance: 35000,
    },
    {
      id: 'wallet',
      name: 'Makela Wallet',
      type: 'wallet' as const,
      balance: 75000,
    },
  ];

  // Example transactions
  const transactions = [
    {
      id: '1',
      type: 'debit' as const,
      amount: 15000,
      description: 'Ride to Kampala Road',
      date: '2024-01-15T10:30:00',
    },
    {
      id: '2',
      type: 'credit' as const,
      amount: 50000,
      description: 'Wallet top-up',
      date: '2024-01-14T15:45:00',
    },
  ];

  // Example driver profile
  const driverProfile = {
    name: 'John Doe',
    avatarUrl: null,
    rating: 4.8,
    ratingCount: 156,
    verificationBadges: [
      { type: 'phone' as const, verified: true },
      { type: 'email' as const, verified: true },
      { type: 'id' as const, verified: true },
      { type: 'license' as const, verified: true },
    ],
    phoneNumber: '+256 782 374 230',
    isDriver: true,
    completedRides: 342,
  };

  useEffect(() => {
    loadAvailableRides();
  }, [origin, destination]);

  const loadAvailableRides = async () => {
    if (!origin || !destination) return;

    try {
      setLoading(true);
      // In a real app, you would filter rides based on origin/destination
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id(*)
        `)
        .eq('status', 'pending')
        .gt('available_seats', 0);

      if (error) throw error;
      setAvailableRides(data || []);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = (rideId: string) => {
    // Implement booking logic
    console.log('Booking ride:', rideId);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Your Profile
        </Text>
        <UserProfileCard {...driverProfile} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Find a Ride
        </Text>
        <View style={styles.locationInputs}>
          <LocationInput
            placeholder="Enter pickup location"
            value={origin}
            onLocationSelect={setOrigin}
            initialRegion={{
              latitude: 0.3476,
              longitude: 32.5825,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          />
          <View style={styles.spacer} />
          <LocationInput
            placeholder="Enter destination"
            value={destination}
            onLocationSelect={setDestination}
          />
        </View>
      </View>

      {origin && destination && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Available Rides
          </Text>
          <View style={styles.ridesList}>
            {availableRides.map((ride) => (
              <RideCard
                key={ride.id}
                originAddress={ride.origin_address}
                destinationAddress={ride.destination_address}
                departureTime={ride.departure_time}
                pricePerSeat={ride.price_per_seat}
                availableSeats={ride.available_seats}
                driver={ride.driver}
                primaryActionText="Book Now"
                secondaryActionText="View Details"
                onPrimaryAction={() => handleBookRide(ride.id)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Payment Methods
        </Text>
        <PaymentSelection
          paymentMethods={paymentMethods}
          selectedMethodId={selectedPaymentMethod}
          onSelect={setSelectedPaymentMethod}
          showHistory={true}
          transactions={transactions}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  locationInputs: {
    gap: 16,
  },
  spacer: {
    height: 8,
  },
  ridesList: {
    gap: 16,
  },
});
