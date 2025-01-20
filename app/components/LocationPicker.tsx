import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView, ThemedText } from './';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';
import { supabase } from '../lib/supabase';

export type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
};

type SavedPlace = LocationPoint & {
  id: string;
  name: string;
  type: 'home' | 'work' | 'other';
};

type LocationPickerProps = {
  /** Placeholder text for the search input */
  placeholder: string;
  /** Current selected location */
  value: LocationPoint | null;
  /** Callback when location is selected */
  onLocationSelect: (location: LocationPoint) => void;
  /** Optional initial region for the map */
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

const RECENT_LOCATIONS_KEY = 'recent_locations';
const MAX_RECENT_LOCATIONS = 5;
const LOCATION_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * An enhanced location picker component with offline support.
 * Features:
 * - Location search with autocomplete and offline cache
 * - Recent locations with local storage
 * - Saved places (home, work, etc.)
 * - Map marker selection
 * - Current location detection
 */
export default function LocationPicker({
  placeholder,
  value,
  onLocationSelect,
  initialRegion = {
    latitude: 0.3476, // Kampala coordinates
    longitude: 32.5825,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
}: LocationPickerProps) {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationPoint[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedAddress[]>([]);

  useEffect(() => {
    loadSavedPlaces();
    loadRecentLocations();
  }, []);

  const loadSavedPlaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedPlaces(data || []);
    } catch (error) {
      console.error('Error loading saved places:', error);
      // Try to load from cache if online fetch fails
      const cachedPlaces = await AsyncStorage.getItem('saved_places');
      if (cachedPlaces) {
        setSavedPlaces(JSON.parse(cachedPlaces));
      }
    }
  };

  const loadRecentLocations = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
      if (stored) {
        const { locations, timestamp } = JSON.parse(stored);
        // Check if cache is still valid
        if (Date.now() - timestamp < LOCATION_CACHE_EXPIRY) {
          setRecentLocations(locations);
        }
      }
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
  };

  const saveRecentLocation = async (location: LocationPoint) => {
    try {
      const newLocations = [
        location,
        ...recentLocations.filter(
          loc => loc.latitude !== location.latitude || loc.longitude !== location.longitude
        ),
      ].slice(0, MAX_RECENT_LOCATIONS);

      await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify({
        locations: newLocations,
        timestamp: Date.now(),
      }));

      setRecentLocations(newLocations);
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  };

  const handleSearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      // Try to get cached results first
      const cacheKey = `search_${text.toLowerCase()}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { results, timestamp } = JSON.parse(cached);
        // Use cache if it's less than a day old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setSearchResults(results);
          setLoading(false);
          return;
        }
      }

      // If no cache or expired, perform new search
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
        const validAddresses = addresses.map(addr => addr[0]).filter(Boolean);
        setSearchResults(validAddresses);

        // Cache the results
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          results: validAddresses,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      // If online search fails, try to use cached results
      const cacheKey = `search_${text.toLowerCase()}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { results } = JSON.parse(cached);
        setSearchResults(results);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
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
          placeholderTextColor={Colors[colorScheme].text + '80'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Pressable
          style={styles.mapButton}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons 
            name={showMap ? "search" : "map-outline"}
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

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
            loadingEnabled
            cacheEnabled={true}
          >
            {value && (
              <Marker coordinate={value}>
                <View style={[styles.markerContainer, { backgroundColor: Colors[colorScheme].tint }]}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
          <Pressable
            style={[styles.currentLocationButton, { backgroundColor: Colors[colorScheme].background }]}
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={24} color={Colors[colorScheme].tint} />
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {/* Saved Places */}
          {savedPlaces.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Saved Places</ThemedText>
              {savedPlaces.map((place) => (
                <Pressable
                  key={place.id}
                  style={styles.resultItem}
                  onPress={() => handleLocationSelect(place)}
                >
                  <Ionicons
                    name={place.type === 'home' ? 'home' : place.type === 'work' ? 'business' : 'bookmark'}
                    size={20}
                    color={Colors[colorScheme].text}
                  />
                  <View style={styles.placeDetails}>
                    <ThemedText style={styles.placeName}>{place.name}</ThemedText>
                    <ThemedText style={styles.placeAddress}>{place.address}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Search Results</ThemedText>
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
                  <ThemedText style={styles.resultText}>
                    {result.street}, {result.city}, {result.region}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {/* Recent Locations */}
          {recentLocations.length > 0 && !searchQuery && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Recent Locations</ThemedText>
              {recentLocations.map((location, index) => (
                <Pressable
                  key={index}
                  style={styles.resultItem}
                  onPress={() => handleLocationSelect(location)}
                >
                  <Ionicons name="time" size={20} color={Colors[colorScheme].text} />
                  <ThemedText style={styles.resultText}>{location.address}</ThemedText>
                </Pressable>
              ))}
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  mapButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.light.tint + '10',
  },
  loader: {
    marginTop: 8,
  },
  mapContainer: {
    flex: 1,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  resultText: {
    flex: 1,
    fontSize: 16,
  },
}); 