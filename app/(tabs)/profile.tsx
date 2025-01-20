import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput, Image, ViewStyle, TextStyle, ImageStyle, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface VehicleData {
  make: string;
  model: string;
  year: string;
  color: string;
  plate_number: string;
  has_ac: boolean;
  has_refreshments: boolean;
  has_charger: boolean;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string;
  email: string;
  vehicle: VehicleData | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const profileData: UserProfile = {
        id: data.id,
        full_name: data.full_name || '',
        avatar_url: data.avatar_url,
        phone_number: data.phone_number || '',
        email: data.email || '',
        vehicle: data.vehicle || null,
      };
      
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingImage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (profile) {
        const updatedProfile = { ...profile, avatar_url: publicUrl };
        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          phone_number: editedProfile.phone_number,
          vehicle: editedProfile.vehicle,
        })
        .eq('id', editedProfile.id);

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    if (!editedProfile) return;
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const updateVehicleField = (field: keyof VehicleData, value: string | boolean) => {
    if (!editedProfile?.vehicle) return;
    setEditedProfile({
      ...editedProfile,
      vehicle: { ...editedProfile.vehicle, [field]: value },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#7209B7', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          {uploadingImage ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <Pressable style={styles.editAvatarButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/wallet')}
        >
          <LinearGradient
            colors={['#F72585', '#7209B7']}
            style={styles.actionIcon}
          >
            <Ionicons name="wallet" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.actionText}>Wallet</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/wallet/history')}
        >
          <LinearGradient
            colors={['#4361EE', '#3A0CA3']}
            style={styles.actionIcon}
          >
            <Ionicons name="time" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.actionText}>History</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <LinearGradient
            colors={['#7209B7', '#4361EE']}
            style={styles.actionIcon}
          >
            <Ionicons name="settings" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.actionText}>Settings</Text>
        </Pressable>
      </View>

      {/* Profile Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {isEditing ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editedProfile?.full_name}
                onChangeText={(text) => updateField('full_name', text)}
                placeholder="Enter your full name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editedProfile?.phone_number}
                onChangeText={(text) => updateField('phone_number', text)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={Colors[colorScheme].text} />
              <Text style={styles.infoText}>{profile?.full_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={Colors[colorScheme].text} />
              <Text style={styles.infoText}>{profile?.phone_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={Colors[colorScheme].text} />
              <Text style={styles.infoText}>{profile?.email}</Text>
            </View>
          </>
        )}
      </View>

      {/* Vehicle Information */}
      {profile?.vehicle && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          {isEditing ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Make</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile?.vehicle?.make}
                  onChangeText={(text) => updateVehicleField('make', text)}
                  placeholder="Enter vehicle make"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile?.vehicle?.model}
                  onChangeText={(text) => updateVehicleField('model', text)}
                  placeholder="Enter vehicle model"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile?.vehicle?.year}
                  onChangeText={(text) => updateVehicleField('year', text)}
                  placeholder="Enter vehicle year"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Plate Number</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile?.vehicle?.plate_number}
                  onChangeText={(text) => updateVehicleField('plate_number', text)}
                  placeholder="Enter plate number"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="car" size={20} color={Colors[colorScheme].text} />
                <Text style={styles.infoText}>
                  {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.year})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="card" size={20} color={Colors[colorScheme].text} />
                <Text style={styles.infoText}>{profile.vehicle.plate_number}</Text>
              </View>
              <View style={styles.features}>
                {profile.vehicle.has_ac && (
                  <View style={styles.feature}>
                    <Ionicons name="snow" size={16} color={Colors[colorScheme].text} />
                    <Text style={styles.featureText}>AC</Text>
                  </View>
                )}
                {profile.vehicle.has_refreshments && (
                  <View style={styles.feature}>
                    <Ionicons name="cafe" size={16} color={Colors[colorScheme].text} />
                    <Text style={styles.featureText}>Refreshments</Text>
                  </View>
                )}
                {profile.vehicle.has_charger && (
                  <View style={styles.feature}>
                    <Ionicons name="battery-charging" size={16} color={Colors[colorScheme].text} />
                    <Text style={styles.featureText}>Charger</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isEditing ? (
          <>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                setEditedProfile(profile);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={saveProfile}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save Changes</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={[styles.buttonText, styles.logoutButtonText]}>Log Out</Text>
          </Pressable>
        )}
      </View>
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
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.tint,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: -32,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FC',
    borderWidth: 1,
    borderColor: '#E5E5E9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F8F9FC',
    borderWidth: 1,
    borderColor: '#E5E5E9',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
  },
  logoutButtonText: {
    color: '#fff',
  },
}); 