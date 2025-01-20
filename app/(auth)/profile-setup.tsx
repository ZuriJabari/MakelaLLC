import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, ScrollView, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkAuth();
    }
  }, [mounted]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        if (mounted) {
          router.replace('/(auth)/verify');
        }
        return;
      }

      if (!session?.user) {
        console.log('No session found, redirecting to verify');
        if (mounted) {
          router.replace('/(auth)/verify');
        }
        return;
      }

      // Verify the auth user exists
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth user error or not found:', authError);
        // Force sign out and redirect to verify
        await supabase.auth.signOut();
        if (mounted) {
          router.replace('/(auth)/verify');
        }
        return;
      }

      // Check if profile already exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
        return;
      }

      if (profile?.full_name) {
        console.log('Profile already exists, redirecting to tabs');
        if (mounted) {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      console.error('Error in checkAuth:', err);
      // Force sign out on any error
      await supabase.auth.signOut();
      if (mounted) {
        router.replace('/(auth)/verify');
      }
    }
  };

  const pickImage = async (type: 'profile' | 'id') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
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
      console.log('Starting image upload:', { uri, path });
      
      // First convert image to base64
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const base64 = await response.blob().then(blob => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              // Remove data:image/jpeg;base64, prefix
              const base64Data = reader.result.split(',')[1];
              resolve(base64Data);
            } else {
              reject(new Error('Failed to convert image to base64'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      });

      console.log('Image converted to base64');

      // Upload base64 data
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      console.log('Generated public URL:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Detailed upload error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Starting profile update...');

      if (!fullName.trim()) {
        throw new Error('Please enter your full name');
      }

      // Validate driver details if isDriver is true
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

      // First verify the auth user exists
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth user error or not found:', authError);
        await supabase.auth.signOut();
        router.replace('/(auth)/verify');
        return;
      }

      console.log('Auth user verified:', user.id);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        await supabase.auth.signOut();
        router.replace('/(auth)/verify');
        return;
      }

      console.log('Session details:', {
        userId: session.user.id,
        phone: session.user.phone,
        email: session.user.email,
      });

      // Check if profile exists
      console.log('Checking if profile exists...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }

      // If profile doesn't exist, create it first
      if (!existingProfile) {
        console.log('Profile does not exist, creating base profile...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            phone: user.phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw insertError;
        }
        console.log('Base profile created successfully');

        // Wait a moment to ensure the insert is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Handle image uploads if needed
      let profilePhotoPath = null;
      let idPhotoPath = null;

      if (profilePhotoUri) {
        console.log('Uploading profile photo...');
        profilePhotoPath = await uploadImage(
          profilePhotoUri,
          `${user.id}/profile.jpg`
        );
      }

      if (idPhotoUri && isDriver) {
        console.log('Uploading ID photo...');
        idPhotoPath = await uploadImage(
          idPhotoUri,
          `${user.id}/id.jpg`
        );
      }

      console.log('Photos uploaded:', { profilePhotoPath, idPhotoPath });

      // Prepare profile update data
      const profileData = {
        full_name: fullName,
        avatar_url: profilePhotoPath,
        is_driver: isDriver,
        vehicle_details: isDriver ? vehicleDetails : null,
        updated_at: new Date().toISOString(),
      };

      // Update the profile
      console.log('Updating profile with data:', profileData);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      // If there's a specific error code, add it to the error message
      if (err && typeof err === 'object' && 'code' in err) {
        setError(prev => `${prev} (Error code: ${err.code})`);
      }
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