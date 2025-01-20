import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Switch, ViewStyle, TextStyle, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { buttonStyles } from './theme/components/buttons';
import { Ionicons } from '@expo/vector-icons';
import CityInput from './components/CityInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { supabase } from './lib/supabase';

type City = {
  id: string;
  name: string;
  region: string;
};

type CarFeatures = {
  hasAirCon: boolean;
  hasLuggageSpace: boolean;
  hasWifi: boolean;
  allowsSmoking: boolean;
  allowsPets: boolean;
  hasChildSeat: boolean;
  hasCharger: boolean;
  hasRefreshments: boolean;
  hasMusicSystem: boolean;
};

type ValidationErrors = {
  origin?: string;
  destination?: string;
  pricePerSeat?: string;
  availableSeats?: string;
  carMake?: string;
  carModel?: string;
  carYear?: string;
};

export default function PostRideScreen() {
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [availableSeats, setAvailableSeats] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carFeatures, setCarFeatures] = useState<CarFeatures>({
    hasAirCon: false,
    hasLuggageSpace: false,
    hasWifi: false,
    allowsSmoking: false,
    allowsPets: false,
    hasChildSeat: false,
    hasCharger: false,
    hasRefreshments: false,
    hasMusicSystem: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [description, setDescription] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [additionalFeatures, setAdditionalFeatures] = useState<CarFeatures>({
    ...carFeatures,
    hasCharger: false,
    hasRefreshments: false,
    hasMusicSystem: false,
  });

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    if (!origin) newErrors.origin = 'Please select departure city';
    if (!destination) newErrors.destination = 'Please select destination city';
    if (!pricePerSeat) newErrors.pricePerSeat = 'Please enter price per seat';
    if (!availableSeats) newErrors.availableSeats = 'Please enter available seats';
    if (!carMake) newErrors.carMake = 'Please enter car make';
    if (!carModel) newErrors.carModel = 'Please enter car model';
    if (!carYear) newErrors.carYear = 'Please enter car year';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (!origin || !destination) return; // TypeScript safety

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      if (!profile) throw new Error('No profile found');

      const departureDateTime = new Date(
        departureDate.getFullYear(),
        departureDate.getMonth(),
        departureDate.getDate(),
        departureTime.getHours(),
        departureTime.getMinutes()
      );

      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          driver_id: profile.id,
          origin_city: origin.name,
          destination_city: destination.name,
          departure_time: departureDateTime.toISOString(),
          price_per_seat: parseInt(pricePerSeat),
          available_seats: parseInt(availableSeats),
          description,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          car_details: {
            make: carMake,
            model: carModel,
            year: parseInt(carYear),
            color: carColor,
            plate_number: carPlateNumber,
            features: additionalFeatures,
          },
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      Alert.alert('Success', 'Your ride has been posted successfully!');
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error posting ride:', error);
      Alert.alert('Error', 'Failed to post ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post a Ride',
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontFamily: typography.fonts.primary,
            fontWeight: '600',
          },
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <CityInput
            placeholder="Departure city"
            value={origin}
            onCitySelect={setOrigin}
            containerStyle={styles.input}
          />
          <CityInput
            placeholder="Destination city"
            value={destination}
            onCitySelect={setDestination}
            containerStyle={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.label}>Trip Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add any additional information about your trip..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <Text style={styles.label}>Pickup Location</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Kampala Bus Terminal"
            value={pickupLocation}
            onChangeText={setPickupLocation}
          />
          
          <Text style={styles.label}>Dropoff Location</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Gulu Main Station"
            value={dropoffLocation}
            onChangeText={setDropoffLocation}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Details</Text>
          <Pressable 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text.disabled} />
            <Text style={styles.dateText}>
              {format(departureDate, 'EEE, MMM d, yyyy')}
            </Text>
          </Pressable>

          <Pressable 
            style={styles.dateInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={colors.text.disabled} />
            <Text style={styles.dateText}>
              {format(departureTime, 'h:mm a')}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={departureDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDepartureDate(selectedDate);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={departureTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setDepartureTime(selectedTime);
              }}
            />
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Price per seat</Text>
              <TextInput
                style={styles.textInput}
                placeholder="UGX"
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Available seats</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Number of seats"
                value={availableSeats}
                onChangeText={setAvailableSeats}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Make</Text>
              <TextInput
                style={[styles.textInput, errors.carMake && styles.inputError]}
                placeholder="e.g. Toyota"
                value={carMake}
                onChangeText={(text) => {
                  setCarMake(text);
                  setErrors(prev => ({ ...prev, carMake: undefined }));
                }}
              />
              {errors.carMake && <Text style={styles.errorText}>{errors.carMake}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={[styles.textInput, errors.carModel && styles.inputError]}
                placeholder="e.g. Hiace"
                value={carModel}
                onChangeText={(text) => {
                  setCarModel(text);
                  setErrors(prev => ({ ...prev, carModel: undefined }));
                }}
              />
              {errors.carModel && <Text style={styles.errorText}>{errors.carModel}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={[styles.textInput, errors.carYear && styles.inputError]}
                placeholder="e.g. 2020"
                value={carYear}
                onChangeText={(text) => {
                  setCarYear(text);
                  setErrors(prev => ({ ...prev, carYear: undefined }));
                }}
                keyboardType="numeric"
              />
              {errors.carYear && <Text style={styles.errorText}>{errors.carYear}</Text>}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. UAX 123A"
                value={carPlateNumber}
                onChangeText={setCarPlateNumber}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="snow-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Air Conditioning</Text>
              </View>
              <Switch
                value={carFeatures.hasAirCon}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, hasAirCon: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="briefcase-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Luggage Space</Text>
              </View>
              <Switch
                value={carFeatures.hasLuggageSpace}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, hasLuggageSpace: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="wifi-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>WiFi</Text>
              </View>
              <Switch
                value={carFeatures.hasWifi}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, hasWifi: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="leaf-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Smoking Allowed</Text>
              </View>
              <Switch
                value={carFeatures.allowsSmoking}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, allowsSmoking: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="paw-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Pets Allowed</Text>
              </View>
              <Switch
                value={carFeatures.allowsPets}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, allowsPets: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="car-sport-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Child Seat</Text>
              </View>
              <Switch
                value={carFeatures.hasChildSeat}
                onValueChange={(value) => setCarFeatures(prev => ({ ...prev, hasChildSeat: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Phone Charger</Text>
              </View>
              <Switch
                value={additionalFeatures.hasCharger}
                onValueChange={(value) => setAdditionalFeatures(prev => ({ ...prev, hasCharger: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="cafe-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Refreshments</Text>
              </View>
              <Switch
                value={additionalFeatures.hasRefreshments}
                onValueChange={(value) => setAdditionalFeatures(prev => ({ ...prev, hasRefreshments: value }))}
              />
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureInfo}>
                <Ionicons name="musical-notes-outline" size={24} color={colors.text.primary} />
                <Text style={styles.featureLabel}>Music System</Text>
              </View>
              <Switch
                value={additionalFeatures.hasMusicSystem}
                onValueChange={(value) => setAdditionalFeatures(prev => ({ ...prev, hasMusicSystem: value }))}
              />
            </View>
          </View>
        </View>

        <View style={styles.submitSection}>
          <Pressable 
            style={[
              buttonStyles.base,
              buttonStyles.primary,
              loading && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={[buttonStyles.text, { color: colors.text.inverse }]}>
              {loading ? 'Posting...' : 'Post Ride'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  contentContainer: {
    padding: 24,
  } as ViewStyle,
  section: {
    marginBottom: 32,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  } as TextStyle,
  input: {
    marginBottom: 16,
  } as ViewStyle,
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  } as ViewStyle,
  dateText: {
    flex: 1,
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.primary,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  } as ViewStyle,
  halfInput: {
    flex: 1,
  } as ViewStyle,
  label: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    color: colors.text.disabled,
    marginBottom: 8,
  } as TextStyle,
  textInput: {
    height: 56,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.primary,
  } as TextStyle,
  featuresList: {
    gap: 16,
  } as ViewStyle,
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  featureLabel: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.primary,
  } as TextStyle,
  submitSection: {
    marginTop: 16,
  } as ViewStyle,
  buttonDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 16,
  } as TextStyle,
  inputError: {
    borderWidth: 1,
    borderColor: colors.status.error,
  } as TextStyle,
  errorText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    color: colors.status.error,
    marginTop: 4,
  } as TextStyle,
}); 