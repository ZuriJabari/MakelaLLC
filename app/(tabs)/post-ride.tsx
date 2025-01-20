import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
};

export default function PostRideScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [date, setDate] = useState(new Date());
  const [seats, setSeats] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 0.3476,  // Kampala coordinates
    longitude: 32.5825,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (result[0]) {
        const { street, city, region } = result[0];
        return `${street}, ${city}, ${region}`;
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  const handleMapPress = async (event: any, type: 'origin' | 'destination') => {
    const { coordinate } = event.nativeEvent;
    const address = await getAddressFromCoords(coordinate.latitude, coordinate.longitude);
    const point = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address,
    };
    
    if (type === 'origin') {
      setOrigin(point);
    } else {
      setDestination(point);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!origin || !destination) {
        throw new Error('Please select both pickup and dropoff locations');
      }

      if (!seats || !pricePerSeat) {
        throw new Error('Please fill in all required fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error: rideError } = await supabase
        .from('rides')
        .insert({
          driver_id: user.id,
          origin_latitude: origin.latitude,
          origin_longitude: origin.longitude,
          origin_address: origin.address,
          destination_latitude: destination.latitude,
          destination_longitude: destination.longitude,
          destination_address: destination.address,
          departure_time: date.toISOString(),
          available_seats: parseInt(seats),
          price_per_seat: parseInt(pricePerSeat),
          notes,
          status: 'pending',
        });

      if (rideError) throw rideError;

      // Reset form
      setOrigin(null);
      setDestination(null);
      setDate(new Date());
      setSeats('');
      setPricePerSeat('');
      setNotes('');
      
    } catch (error) {
      console.error('Error posting ride:', error);
      setError(error instanceof Error ? error.message : 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Post a New Ride</Text>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          onPress={(e) => handleMapPress(e, origin ? 'destination' : 'origin')}
        >
          {origin && (
            <Marker
              coordinate={{
                latitude: origin.latitude,
                longitude: origin.longitude,
              }}
              pinColor="green"
              title="Pickup"
              description={origin.address}
            />
          )}
          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              pinColor="red"
              title="Dropoff"
              description={destination.address}
            />
          )}
        </MapView>
        <Text style={[styles.mapInstructions, { color: Colors[colorScheme].text }]}>
          Tap to set {!origin ? 'pickup' : !destination ? 'dropoff' : ''} location
        </Text>
      </View>

      {/* Location Details */}
      <View style={styles.locationDetails}>
        <Text style={[styles.locationLabel, { color: Colors[colorScheme].text }]}>
          Pickup: {origin?.address || 'Not set'}
        </Text>
        <Text style={[styles.locationLabel, { color: Colors[colorScheme].text }]}>
          Dropoff: {destination?.address || 'Not set'}
        </Text>
      </View>

      {/* Date and Time */}
      <Pressable
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {date.toLocaleString()}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          is24Hour={true}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Seats and Price */}
      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            styles.halfInput,
            { 
              color: Colors[colorScheme].text,
              backgroundColor: Colors[colorScheme].background,
              borderColor: Colors[colorScheme].border
            }
          ]}
          placeholder="Available seats"
          placeholderTextColor={Colors[colorScheme].text}
          value={seats}
          onChangeText={setSeats}
          keyboardType="number-pad"
        />
        <TextInput
          style={[
            styles.input,
            styles.halfInput,
            { 
              color: Colors[colorScheme].text,
              backgroundColor: Colors[colorScheme].background,
              borderColor: Colors[colorScheme].border
            }
          ]}
          placeholder="Price per seat (UGX)"
          placeholderTextColor={Colors[colorScheme].text}
          value={pricePerSeat}
          onChangeText={setPricePerSeat}
          keyboardType="number-pad"
        />
      </View>

      {/* Notes */}
      <TextInput
        style={[
          styles.input,
          styles.notesInput,
          { 
            color: Colors[colorScheme].text,
            backgroundColor: Colors[colorScheme].background,
            borderColor: Colors[colorScheme].border
          }
        ]}
        placeholder="Additional notes (optional)"
        placeholderTextColor={Colors[colorScheme].text}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Post Ride</Text>
        )}
      </Pressable>
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
  mapContainer: {
    height: 300,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    color: '#fff',
  },
  locationDetails: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    height: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  button: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 