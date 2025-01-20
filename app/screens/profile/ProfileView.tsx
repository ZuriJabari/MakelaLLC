import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Avatar, ThemedText, ThemedView } from '../../components';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string;
  is_driver: boolean;
  vehicle_details?: {
    make: string;
    model: string;
    year: string;
    color: string;
    license_plate: string;
  };
  rating: number;
  total_rides: number;
  verification_status: {
    phone: boolean;
    id: boolean;
    vehicle?: boolean;
  };
}

export default function ProfileView() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          phone_number,
          is_driver,
          vehicle_details,
          rating,
          total_rides,
          verification_status
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Failed to load profile</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <Avatar
          size={80}
          imageUrl={profile.avatar_url}
          name={profile.full_name}
        />
        <View style={styles.headerInfo}>
          <ThemedText style={styles.name}>{profile.full_name}</ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <ThemedText style={styles.rating}>{profile.rating.toFixed(1)}</ThemedText>
            <ThemedText style={styles.rides}>({profile.total_rides} rides)</ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/profile/edit')}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={24} color={Colors[colorScheme].tint} />
        </Pressable>
      </ThemedView>

      {/* Verification Status */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Verification Status</ThemedText>
        <View style={styles.verificationList}>
          <View style={styles.verificationItem}>
            <Ionicons
              name={profile.verification_status.phone ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={profile.verification_status.phone ? '#4CAF50' : '#F44336'}
            />
            <ThemedText style={styles.verificationText}>Phone Number</ThemedText>
          </View>
          <View style={styles.verificationItem}>
            <Ionicons
              name={profile.verification_status.id ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={profile.verification_status.id ? '#4CAF50' : '#F44336'}
            />
            <ThemedText style={styles.verificationText}>ID Verification</ThemedText>
          </View>
          {profile.is_driver && (
            <View style={styles.verificationItem}>
              <Ionicons
                name={profile.verification_status.vehicle ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={profile.verification_status.vehicle ? '#4CAF50' : '#F44336'}
              />
              <ThemedText style={styles.verificationText}>Vehicle Verification</ThemedText>
            </View>
          )}
        </View>
      </ThemedView>

      {/* Vehicle Details for Drivers */}
      {profile.is_driver && profile.vehicle_details && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vehicle Details</ThemedText>
          <View style={styles.vehicleDetails}>
            <View style={styles.vehicleRow}>
              <ThemedText style={styles.vehicleLabel}>Make:</ThemedText>
              <ThemedText style={styles.vehicleValue}>{profile.vehicle_details.make}</ThemedText>
            </View>
            <View style={styles.vehicleRow}>
              <ThemedText style={styles.vehicleLabel}>Model:</ThemedText>
              <ThemedText style={styles.vehicleValue}>{profile.vehicle_details.model}</ThemedText>
            </View>
            <View style={styles.vehicleRow}>
              <ThemedText style={styles.vehicleLabel}>Year:</ThemedText>
              <ThemedText style={styles.vehicleValue}>{profile.vehicle_details.year}</ThemedText>
            </View>
            <View style={styles.vehicleRow}>
              <ThemedText style={styles.vehicleLabel}>Color:</ThemedText>
              <ThemedText style={styles.vehicleValue}>{profile.vehicle_details.color}</ThemedText>
            </View>
            <View style={styles.vehicleRow}>
              <ThemedText style={styles.vehicleLabel}>License Plate:</ThemedText>
              <ThemedText style={styles.vehicleValue}>{profile.vehicle_details.license_plate}</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}

      {/* Settings Button */}
      <Pressable
        onPress={() => router.push('/profile/settings')}
        style={styles.settingsButton}
      >
        <ThemedText style={styles.settingsText}>Settings</ThemedText>
        <Ionicons name="chevron-forward" size={24} color={Colors[colorScheme].text} />
      </Pressable>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
  },
  rides: {
    marginLeft: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  verificationList: {
    gap: 12,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationText: {
    fontSize: 16,
  },
  vehicleDetails: {
    gap: 8,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  vehicleValue: {
    fontSize: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
  },
  settingsText: {
    fontSize: 16,
  },
}); 