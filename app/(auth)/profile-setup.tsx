import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, ScrollView, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type ColorScheme = 'light' | 'dark';

type VehicleDetails = {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
};

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme() as ColorScheme;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [isDriver, setIsDriver] = useState(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
  });

  const pickImage = async (type: 'profile' | 'id') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (type === 'profile') {
          setProfilePhotoUri(result.assets[0].uri);
        } else {
          setIdPhotoUri(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to select image');
    }
  };

  const uploadImage = async (uri: string, path: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob);

      if (uploadError) throw uploadError;

      return path;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!fullName.trim()) {
        throw new Error('Please enter your full name');
      }

      if (isDriver) {
        if (!profilePhotoUri || !idPhotoUri) {
          throw new Error('Please upload both profile photo and ID photo');
        }
        
        const requiredFields = ['make', 'model', 'year', 'color', 'licensePlate'];
        const missingFields = requiredFields.filter(field => !vehicleDetails[field as keyof VehicleDetails]);
        if (missingFields.length > 0) {
          throw new Error(`Please fill in all vehicle details: ${missingFields.join(', ')}`);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let profilePhotoPath = null;
      let idPhotoPath = null;

      if (profilePhotoUri) {
        profilePhotoPath = await uploadImage(
          profilePhotoUri,
          `${user.id}/profile.jpg`
        );
      }

      if (idPhotoUri && isDriver) {
        idPhotoPath = await uploadImage(
          idPhotoUri,
          `${user.id}/id.jpg`
        );
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          avatar_url: profilePhotoPath,
          is_driver: isDriver,
          id_url: idPhotoPath,
          vehicle_details: isDriver ? vehicleDetails : null,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Ionicons name="person-circle" size={64} color={Colors[colorScheme].text} />
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          Complete Your Profile
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme].text }]}>
          Please provide your details to continue
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[
            styles.input,
            { 
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].border,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Full Name"
          placeholderTextColor={Colors[colorScheme].tabIconDefault}
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />

        <View style={styles.photoSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Profile Photo
          </Text>
          {profilePhotoUri ? (
            <Pressable onPress={() => pickImage('profile')}>
              <Image source={{ uri: profilePhotoUri }} style={styles.photoPreview} />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.photoButton, { borderColor: Colors[colorScheme].border }]}
              onPress={() => pickImage('profile')}
            >
              <Ionicons name="camera" size={32} color={Colors[colorScheme].text} />
              <Text style={[styles.photoButtonText, { color: Colors[colorScheme].text }]}>
                Add Photo
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: Colors[colorScheme].text }]}>
            I want to be a driver
          </Text>
          <Switch
            value={isDriver}
            onValueChange={setIsDriver}
            disabled={loading}
          />
        </View>

        {isDriver && (
          <>
            <View style={styles.photoSection}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
                ID Photo
              </Text>
              {idPhotoUri ? (
                <Pressable onPress={() => pickImage('id')}>
                  <Image source={{ uri: idPhotoUri }} style={styles.photoPreview} />
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.photoButton, { borderColor: Colors[colorScheme].border }]}
                  onPress={() => pickImage('id')}
                >
                  <Ionicons name="card" size={32} color={Colors[colorScheme].text} />
                  <Text style={[styles.photoButtonText, { color: Colors[colorScheme].text }]}>
                    Add ID Photo
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.vehicleSection}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
                Vehicle Details
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    backgroundColor: Colors[colorScheme].background,
                  },
                ]}
                placeholder="Vehicle Make"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                value={vehicleDetails.make}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, make: text })}
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    backgroundColor: Colors[colorScheme].background,
                  },
                ]}
                placeholder="Vehicle Model"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                value={vehicleDetails.model}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, model: text })}
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    backgroundColor: Colors[colorScheme].background,
                  },
                ]}
                placeholder="Year"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                value={vehicleDetails.year}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, year: text })}
                keyboardType="number-pad"
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    backgroundColor: Colors[colorScheme].background,
                  },
                ]}
                placeholder="Color"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                value={vehicleDetails.color}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, color: text })}
                editable={!loading}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    backgroundColor: Colors[colorScheme].background,
                  },
                ]}
                placeholder="License Plate Number"
                placeholderTextColor={Colors[colorScheme].tabIconDefault}
                value={vehicleDetails.licensePlate}
                onChangeText={(text) => setVehicleDetails({ ...vehicleDetails, licensePlate: text })}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>
          </>
        )}

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
            <Text style={styles.buttonText}>Complete Profile</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  photoSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  photoButton: {
    height: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButtonText: {
    marginTop: 8,
    fontSize: 16,
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  vehicleSection: {
    gap: 10,
  },
  button: {
    backgroundColor: '#32CD32',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
  },
}); 