import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme, Avatar, ThemedText, ThemedView } from '../../components';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
}

export default function ProfileEdit() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
  });
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setFullName(profile.full_name);
      setAvatarUrl(profile.avatar_url);
      setIsDriver(profile.is_driver);
      if (profile.vehicle_details) {
        setVehicleDetails(profile.vehicle_details);
      }
      setIdPhotoUrl(profile.id_photo_url);
      setVehiclePhotoUrl(profile.vehicle_photo_url);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'avatar' | 'id' | 'vehicle') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `${type}_${Date.now()}.jpg`,
        };

        const formData = new FormData();
        formData.append('file', file as any);

        const { data, error } = await supabase.storage
          .from('profile-photos')
          .upload(`${type}/${Date.now()}.jpg`, formData);

        if (error) throw error;

        const photoUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-photos/${data.path}`;
        
        switch (type) {
          case 'avatar':
            setAvatarUrl(photoUrl);
            break;
          case 'id':
            setIdPhotoUrl(photoUrl);
            break;
          case 'vehicle':
            setVehiclePhotoUrl(photoUrl);
            break;
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }

      if (isDriver) {
        const { make, model, year, color, license_plate } = vehicleDetails;
        if (!make || !model || !year || !color || !license_plate) {
          Alert.alert('Error', 'Please fill in all vehicle details');
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const updates = {
        id: user.id,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        is_driver: isDriver,
        vehicle_details: isDriver ? vehicleDetails : null,
        id_photo_url: idPhotoUrl,
        vehicle_photo_url: isDriver ? vehiclePhotoUrl : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
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
      {/* Profile Photo */}
      <ThemedView style={styles.photoSection}>
        <Avatar
          size={100}
          imageUrl={avatarUrl}
          name={fullName}
        />
        <Pressable
          onPress={() => pickImage('avatar')}
          style={styles.changePhotoButton}
        >
          <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Basic Information */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={Colors[colorScheme].text + '80'}
          />
        </View>
      </ThemedView>

      {/* Driver Toggle */}
      <ThemedView style={styles.section}>
        <View style={styles.driverToggle}>
          <ThemedText style={styles.driverToggleText}>Register as Driver</ThemedText>
          <Pressable
            onPress={() => setIsDriver(!isDriver)}
            style={[
              styles.toggleButton,
              { backgroundColor: isDriver ? Colors[colorScheme].tint : Colors[colorScheme].border }
            ]}
          >
            <View style={[styles.toggleKnob, { transform: [{ translateX: isDriver ? 20 : 0 }] }]} />
          </Pressable>
        </View>
      </ThemedView>

      {/* Vehicle Details (for drivers) */}
      {isDriver && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vehicle Details</ThemedText>
          <View style={styles.vehicleInputs}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Make</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
                ]}
                value={vehicleDetails.make}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, make: text })}
                placeholder="Vehicle make"
                placeholderTextColor={Colors[colorScheme].text + '80'}
              />
            </View>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Model</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
                ]}
                value={vehicleDetails.model}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, model: text })}
                placeholder="Vehicle model"
                placeholderTextColor={Colors[colorScheme].text + '80'}
              />
            </View>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Year</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
                ]}
                value={vehicleDetails.year}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, year: text })}
                placeholder="Vehicle year"
                keyboardType="numeric"
                placeholderTextColor={Colors[colorScheme].text + '80'}
              />
            </View>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Color</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
                ]}
                value={vehicleDetails.color}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, color: text })}
                placeholder="Vehicle color"
                placeholderTextColor={Colors[colorScheme].text + '80'}
              />
            </View>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>License Plate</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].border }
                ]}
                value={vehicleDetails.license_plate}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, license_plate: text })}
                placeholder="License plate number"
                placeholderTextColor={Colors[colorScheme].text + '80'}
              />
            </View>
          </View>
        </ThemedView>
      )}

      {/* Document Upload */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Document Verification</ThemedText>
        <View style={styles.documentSection}>
          <ThemedText style={styles.documentTitle}>ID Document</ThemedText>
          <Pressable
            onPress={() => pickImage('id')}
            style={styles.uploadButton}
          >
            <Ionicons
              name={idPhotoUrl ? 'checkmark-circle' : 'cloud-upload'}
              size={24}
              color={idPhotoUrl ? '#4CAF50' : Colors[colorScheme].tint}
            />
            <ThemedText style={styles.uploadText}>
              {idPhotoUrl ? 'ID Uploaded' : 'Upload ID'}
            </ThemedText>
          </Pressable>
        </View>

        {isDriver && (
          <View style={[styles.documentSection, styles.marginTop]}>
            <ThemedText style={styles.documentTitle}>Vehicle Registration</ThemedText>
            <Pressable
              onPress={() => pickImage('vehicle')}
              style={styles.uploadButton}
            >
              <Ionicons
                name={vehiclePhotoUrl ? 'checkmark-circle' : 'cloud-upload'}
                size={24}
                color={vehiclePhotoUrl ? '#4CAF50' : Colors[colorScheme].tint}
              />
              <ThemedText style={styles.uploadText}>
                {vehiclePhotoUrl ? 'Registration Uploaded' : 'Upload Registration'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ThemedView>

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[
          styles.saveButton,
          { opacity: saving ? 0.7 : 1 }
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        )}
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
  photoSection: {
    alignItems: 'center',
    padding: 20,
  },
  changePhotoButton: {
    marginTop: 12,
    padding: 8,
  },
  changePhotoText: {
    color: Colors.light.tint,
    fontSize: 16,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  driverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverToggleText: {
    fontSize: 16,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  vehicleInputs: {
    gap: 12,
  },
  documentSection: {
    marginBottom: 16,
  },
  documentTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
  },
  marginTop: {
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 