import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from './';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

export type RoutePoint = {
  latitude: number;
  longitude: number;
  address: string;
  type: 'pickup' | 'dropoff';
};

type RouteDisplayProps = {
  /** Pickup location details */
  pickup: RoutePoint;
  /** Dropoff location details */
  dropoff: RoutePoint;
  /** Optional initial region for the map */
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  /** Whether to show distance and time estimates */
  showEstimates?: boolean;
  /** Optional callback when the map is ready */
  onMapReady?: () => void;
};

/**
 * A component that displays a route between two points on a map.
 * Features:
 * - Interactive map with custom markers for pickup and dropoff
 * - Route visualization with polyline
 * - Distance and time estimates
 * - Offline support with cached map tiles
 */
export default function RouteDisplay({
  pickup,
  dropoff,
  initialRegion = {
    latitude: 0.3476, // Kampala coordinates
    longitude: 32.5825,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  showEstimates = true,
  onMapReady,
}: RouteDisplayProps) {
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [estimates, setEstimates] = useState<{ distance: string; duration: string; } | null>(null);

  useEffect(() => {
    calculateRoute();
  }, [pickup, dropoff]);

  const calculateRoute = async () => {
    try {
      setLoading(true);
      // In a real app, you would use a routing service like Google Directions API
      // For demo, we'll create a simple straight line between points
      setRouteCoordinates([
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ]);

      // Calculate rough estimates
      const distance = calculateDistance(pickup, dropoff);
      const duration = estimateDuration(distance);
      setEstimates({ distance, duration });

      // Fit map to show both points
      mapRef.current?.fitToCoordinates([
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (point1: RoutePoint, point2: RoutePoint) => {
    // Simple distance calculation using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const lat1 = toRad(point1.latitude);
    const lat2 = toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1 
      ? `${Math.round(distance * 1000)}m`
      : `${distance.toFixed(1)}km`;
  };

  const toRad = (value: number) => value * Math.PI / 180;

  const estimateDuration = (distance: string) => {
    // Rough estimation assuming average speed of 30km/h
    const numericDistance = parseFloat(distance.replace(/[^0-9.]/g, ''));
    const unit = distance.includes('km') ? 'km' : 'm';
    const distanceInKm = unit === 'km' ? numericDistance : numericDistance / 1000;
    const timeInHours = distanceInKm / 30;
    const timeInMinutes = Math.round(timeInHours * 60);
    return timeInMinutes < 60 
      ? `${timeInMinutes} min`
      : `${Math.floor(timeInMinutes / 60)}h ${timeInMinutes % 60}min`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={onMapReady}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        loadingEnabled
        cacheEnabled={true} // Enable offline caching
      >
        {/* Pickup Marker */}
        <Marker coordinate={pickup}>
          <View style={[styles.markerContainer, { backgroundColor: Colors[colorScheme].tint }]}>
            <Ionicons name="location" size={20} color="#fff" />
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker coordinate={dropoff}>
          <View style={[styles.markerContainer, { backgroundColor: '#F44336' }]}>
            <Ionicons name="flag" size={20} color="#fff" />
          </View>
        </Marker>

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor={Colors[colorScheme].tint}
          />
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        </View>
      )}

      {showEstimates && estimates && (
        <ThemedView style={styles.estimatesContainer}>
          <View style={styles.estimate}>
            <Ionicons name="time-outline" size={20} color={Colors[colorScheme].text} />
            <ThemedText style={styles.estimateText}>{estimates.duration}</ThemedText>
          </View>
          <View style={styles.estimateDivider} />
          <View style={styles.estimate}>
            <Ionicons name="map-outline" size={20} color={Colors[colorScheme].text} />
            <ThemedText style={styles.estimateText}>{estimates.distance}</ThemedText>
          </View>
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  estimatesContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimateText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  estimateDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
}); 