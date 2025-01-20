import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

// List of major Ugandan cities and towns
const UGANDAN_CITIES = [
  { id: '1', name: 'Kampala', region: 'Central' },
  { id: '2', name: 'Gulu', region: 'Northern' },
  { id: '3', name: 'Mbarara', region: 'Western' },
  { id: '4', name: 'Jinja', region: 'Eastern' },
  { id: '5', name: 'Arua', region: 'Northern' },
  { id: '6', name: 'Fort Portal', region: 'Western' },
  { id: '7', name: 'Masaka', region: 'Central' },
  { id: '8', name: 'Mbale', region: 'Eastern' },
  { id: '9', name: 'Kasese', region: 'Western' },
  { id: '10', name: 'Lira', region: 'Northern' },
  { id: '11', name: 'Entebbe', region: 'Central' },
  { id: '12', name: 'Hoima', region: 'Western' },
  { id: '13', name: 'Soroti', region: 'Eastern' },
  { id: '14', name: 'Tororo', region: 'Eastern' },
  { id: '15', name: 'Kabale', region: 'Western' },
  // Add more cities as needed
];

type City = {
  id: string;
  name: string;
  region: string;
};

type CityInputProps = {
  placeholder: string;
  value: City | null;
  onCitySelect: (city: City | null) => void;
  containerStyle?: ViewStyle;
};

export default function CityInput({ placeholder, value, onCitySelect, containerStyle }: CityInputProps) {
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredCities = UGANDAN_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchText.toLowerCase()) ||
    city.region.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCitySelect = useCallback((city: City) => {
    onCitySelect(city);
    setSearchText(city.name);
    setShowSuggestions(false);
  }, [onCitySelect]);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color={colors.text.disabled} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setShowSuggestions(true);
            if (!text) onCitySelect(null);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {value && (
          <Pressable 
            onPress={() => {
              setSearchText('');
              onCitySelect(null);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.text.disabled} />
          </Pressable>
        )}
      </View>
      
      {showSuggestions && searchText && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable 
                style={styles.suggestionItem}
                onPress={() => handleCitySelect(item)}
              >
                <Ionicons name="location" size={16} color={colors.text.disabled} />
                <View>
                  <Text style={styles.cityName}>{item.name}</Text>
                  <Text style={styles.regionName}>{item.region} Region</Text>
                </View>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    gap: 12,
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    color: colors.text.primary,
  } as TextStyle,
  clearButton: {
    padding: 4,
  } as ViewStyle,
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  } as ViewStyle,
  suggestionsList: {
    padding: 8,
  } as ViewStyle,
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  } as ViewStyle,
  cityName: {
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.primary,
  } as TextStyle,
  regionName: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    color: colors.text.disabled,
    marginTop: 2,
  } as TextStyle,
}); 