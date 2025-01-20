import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { GradientBackground } from '../../components/GradientBackground';

interface VehicleData {
  make: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_driver: boolean;
  phone_number: string;
  rating: number;
  total_rides: number;
  wallet_balance: number;
  vehicle?: VehicleData;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    phone_number: string;
    vehicle?: {
      make: string;
      model: string;
      year: string;
      color: string;
      license_plate: string;
    };
  }>({
    full_name: '',
    phone_number: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session) {
        router.replace('/(auth)/verify');
        return;
      }

      loadProfile();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/(auth)/verify');
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/(auth)/verify');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || '',
        phone_number: profileData.phone_number || '',
        vehicle: profileData.vehicle_details,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
          vehicle_details: profile?.is_driver ? editForm.vehicle : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await loadProfile(); // Reload profile data
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/verify');
    } catch (err: any) {
      console.error('Error logging out:', err.message);
    }
  };

  const updateVehicle = (field: keyof VehicleData, value: string) => {
    const currentVehicle = editForm.vehicle || {
      make: '',
      model: '',
      year: '',
      color: '',
      license_plate: '',
    };

    setEditForm(prev => ({
      ...prev,
      vehicle: {
        ...currentVehicle,
        [field]: value,
      }
    }));
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const handleAvatarUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to change your avatar.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        
        // Convert image to blob
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        // Upload image to Supabase Storage
        const fileName = `avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile?.id);

        if (updateError) throw updateError;

        // Reload profile
        await loadProfile();
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (isEditing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setIsEditing(false)} style={styles.backButton}>
            <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
          </Pressable>
          <ThemedText style={styles.title}>Edit Profile</ThemedText>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme].text }]}
              value={editForm.full_name}
              onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
              placeholder="Enter your full name"
              placeholderTextColor={Colors[colorScheme].tabIconDefault}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={[styles.input, { color: Colors[colorScheme].text }]}
              value={editForm.phone_number}
              onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors[colorScheme].tabIconDefault}
              keyboardType="phone-pad"
            />
          </View>

          {profile?.is_driver && (
            <>
              <ThemedText style={styles.sectionTitle}>Vehicle Information</ThemedText>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Make</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={editForm.vehicle?.make}
                  onChangeText={(text) => updateVehicle('make', text)}
                  placeholder="Vehicle make"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Model</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={editForm.vehicle?.model}
                  onChangeText={(text) => updateVehicle('model', text)}
                  placeholder="Vehicle model"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Year</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={editForm.vehicle?.year}
                  onChangeText={(text) => updateVehicle('year', text)}
                  placeholder="Vehicle year"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Color</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={editForm.vehicle?.color}
                  onChangeText={(text) => updateVehicle('color', text)}
                  placeholder="Vehicle color"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>License Plate</ThemedText>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={editForm.vehicle?.license_plate}
                  onChangeText={(text) => updateVehicle('license_plate', text)}
                  placeholder="License plate number"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}
        </ScrollView>

        <Pressable
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <GradientBackground style={styles.header}>
        <View style={styles.welcomeContainer}>
          <ThemedText style={styles.greeting}>
            Hello, {profile?.full_name ? getFirstName(profile.full_name) : 'there'}! 👋
          </ThemedText>
        </View>
        
        <Pressable onPress={handleAvatarUpload} style={styles.avatarContainer}>
          <Avatar
            size={100}
            imageUrl={profile?.avatar_url}
            name={profile?.full_name || ''}
          />
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>

        <ThemedText style={styles.name}>{profile?.full_name}</ThemedText>
        {profile?.is_driver && (
          <View style={styles.badge}>
            <Ionicons name="car" size={16} color={Colors.accent.mintGreen} />
            <ThemedText style={styles.badgeText}>Verified Driver</ThemedText>
          </View>
        )}
      </GradientBackground>

      {/* Stats Section */}
      <ThemedView style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{profile?.rating?.toFixed(1) || '-'}</ThemedText>
          <ThemedText style={styles.statLabel}>Rating</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{profile?.total_rides || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Rides</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>
            {profile?.wallet_balance?.toLocaleString('en-UG', {
              style: 'currency',
              currency: 'UGX'
            })}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Balance</ThemedText>
        </View>
      </ThemedView>

      {/* Vehicle Details (if driver) */}
      {profile?.is_driver && profile.vehicle && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vehicle Details</ThemedText>
          <View style={styles.vehicleDetails}>
            <ThemedText style={styles.vehicleText}>
              {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.year})
            </ThemedText>
            <ThemedText style={styles.vehicleText}>
              {profile.vehicle.color} • {profile.vehicle.license_plate}
            </ThemedText>
          </View>
        </ThemedView>
      )}

      {/* Action Buttons */}
      <ThemedView style={styles.section}>
        <Pressable
          style={styles.actionButton}
          onPress={() => setIsEditing(true)}
        >
          <Ionicons name="person-outline" size={24} color={Colors[colorScheme].text} />
          <ThemedText style={styles.actionButtonText}>Edit Profile</ThemedText>
          <Ionicons name="chevron-forward" size={24} color={Colors[colorScheme].text} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/wallet')}
        >
          <Ionicons name="wallet-outline" size={24} color={Colors[colorScheme].text} />
          <ThemedText style={styles.actionButtonText}>Wallet</ThemedText>
          <Ionicons name="chevron-forward" size={24} color={Colors[colorScheme].text} />
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.status.error} />
          <ThemedText style={[styles.actionButtonText, styles.logoutText]}>Logout</ThemedText>
        </Pressable>
      </ThemedView>
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
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.inverse,
    textAlign: 'center',
    fontFamily: 'Space Grotesk',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.electricIndigo,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
    color: Colors.text.inverse,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.dark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 14,
    marginLeft: 4,
    color: Colors.accent.mintGreen,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.neutral.stellarSilver,
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Space Grotesk',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  vehicleDetails: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 12,
  },
  vehicleText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
  logoutText: {
    color: Colors.status.error,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.neutral.stellarSilver,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: Colors.text.secondary,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary.electricIndigo,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
}); 