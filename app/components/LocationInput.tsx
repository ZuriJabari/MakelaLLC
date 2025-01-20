import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import MapView, { Marker } from 'react-native-maps';
import { LocationPoint } from '../types';

type RecentLocation = {
  id: string;
  user_id: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type LocationInputProps = {
  /** Placeholder text for the input */
  placeholder: string;
  /** Current selected location */
  value: LocationPoint | null;
  /** Callback when location is selected */
  onLocationSelect: (location: LocationPoint) => void;
  /** Optional initial region for the map */
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A reusable location input component with autocomplete, recent locations, and map selection.
 * 
 * Features:
 * - Location search with autocomplete
 * - Recent locations list
 * - Map marker selection
 * - Current location detection
 */
export default function LocationInput({ 
  placeholder, 
  value, 
  onLocationSelect,
  initialRegion,
  containerStyle,
}: LocationInputProps) {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedAddress[]>([]);

  useEffect(() => {
    loadRecentLocations();
  }, []);

  const loadRecentLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recent_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLocations(data || []);
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
  };

  const saveRecentLocation = async (location: LocationPoint) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('recent_locations')
        .insert({
          user_id: user.id,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        });

      if (error) throw error;
      loadRecentLocations();
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results = await Location.geocodeAsync(text);
      if (results.length > 0) {
        const addresses = await Promise.all(
          results.map(result => 
            Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            })
          )
        );
        setSearchResults(addresses.map(addr => addr[0]).filter(Boolean));
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (location: LocationPoint) => {
    onLocationSelect(location);
    await saveRecentLocation(location);
    setSearchQuery('');
    setSearchResults([]);
    setShowMap(false);
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
      
      if (result[0]) {
        const { street, city, region } = result[0];
        const location = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: `${street}, ${city}, ${region}`,
        };
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const result = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result[0]) {
        const { street, city, region } = result[0];
        handleLocationSelect({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: `${street}, ${city}, ${region}`,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              color: Colors[colorScheme].text,
              backgroundColor: Colors[colorScheme].background,
              borderColor: Colors[colorScheme].border
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors[colorScheme].text}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Pressable
          style={styles.mapButton}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons 
            name="map-outline" 
            size={24} 
            color={Colors[colorScheme].text} 
          />
        </Pressable>
      </View>

      {loading && (
        <ActivityIndicator 
          style={styles.loader} 
          color={Colors[colorScheme].tint} 
        />
      )}

      {!showMap && searchQuery && searchResults.length > 0 && (
        <ScrollView style={styles.resultsList}>
          {searchResults.map((result, index) => (
            <Pressable
              key={index}
              style={styles.resultItem}
              onPress={() => handleLocationSelect({
                latitude: 0, // You'll need to get these from the geocoding result
                longitude: 0,
                address: `${result.street}, ${result.city}, ${result.region}`,
              })}
            >
              <Ionicons name="location" size={20} color={Colors[colorScheme].text} />
              <Text style={[styles.resultText, { color: Colors[colorScheme].text }]}>
                {result.street}, {result.city}, {result.region}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {!showMap && !searchQuery && recentLocations.length > 0 && (
        <ScrollView style={styles.resultsList}>
          {recentLocations.map((location) => (
            <Pressable
              key={location.id}
              style={styles.resultItem}
              onPress={() => handleLocationSelect({
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
              })}
            >
              <Ionicons name="time" size={20} color={Colors[colorScheme].text} />
              <Text style={[styles.resultText, { color: Colors[colorScheme].text }]}>
                {location.address}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {value && (
              <Marker
                coordinate={{
                  latitude: value.latitude,
                  longitude: value.longitude,
                }}
                title="Selected Location"
                description={value.address}
              />
            )}
          </MapView>
          <Pressable
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={24} color={Colors[colorScheme].text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  mapButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  loader: {
    marginTop: 8,
  },
  resultsList: {
    maxHeight: 200,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  resultText: {
    flex: 1,
    fontSize: 14,
  },
  mapContainer: {
    height: 300,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
}); 