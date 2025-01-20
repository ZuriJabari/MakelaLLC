import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, Image, RefreshControl, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import Colors from '../constants/Colors';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { buttonStyles } from '../theme/components/buttons';
import LocationInput from '../components/LocationInput';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../components/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
};

type PopularDestination = {
  id: string;
  name: string;
  address: string;
  image: string;
  latitude: number;
  longitude: number;
};

const POPULAR_ROUTES: PopularDestination[] = [
  {
    id: '1',
    name: 'Kampala to Gulu',
    address: '330km • 6h drive',
    image: 'https://images.unsplash.com/photo-1618477202872-89cec6f8d62e',
    latitude: 2.7747,
    longitude: 32.2990,
  },
  {
    id: '2',
    name: 'Kampala to Mbarara',
    address: '270km • 4h drive',
    image: 'https://images.unsplash.com/photo-1568634761634-5e0c7c1d0c8f',
    latitude: -0.6071,
    longitude: 30.6545,
  },
  {
    id: '3',
    name: 'Kampala to Jinja',
    address: '80km • 2h drive',
    image: 'https://images.unsplash.com/photo-1589802829985-817e51171b92',
    latitude: 0.4478,
    longitude: 33.2027,
  },
];

const KAMPALA_REGION = {
  latitude: 0.3476,
  longitude: 32.5825,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setMounted(true);
    loadProfile();
    return () => setMounted(false);
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLocationSelect = (point: LocationPoint | null, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(point);
    } else {
      setDestination(point);
    }
  };

  const handleSearch = () => {
    if (origin && destination) {
      router.push('/(tabs)/find-ride');
    }
  };

  const handlePostRide = () => {
    router.push('/post-ride');
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section with Branding and Welcome */}
      <LinearGradient
        colors={[gradients.primary.colors[0], gradients.primary.colors[1]]}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={[styles.heroContainer, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.brandSection}>
          <View>
            <Text style={styles.brandName}>Makela</Text>
            <Text style={styles.brandTagline}>Your trusted carpooling companion</Text>
          </View>
          <Pressable 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Avatar
              size={44}
              imageUrl={profile?.avatar_url}
              name={profile?.full_name || ''}
            />
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {profile?.full_name?.split(' ')[0] || 'Traveler'}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>Where are you going?</Text>
        <View style={styles.searchForm}>
          <LocationInput
            placeholder="Leaving from..."
            value={origin}
            onLocationSelect={(loc) => handleLocationSelect(loc, 'origin')}
            containerStyle={styles.locationInput}
            initialRegion={KAMPALA_REGION}
          />
          <LocationInput
            placeholder="Going to..."
            value={destination}
            onLocationSelect={(loc) => handleLocationSelect(loc, 'destination')}
            containerStyle={styles.locationInput}
            initialRegion={KAMPALA_REGION}
          />
          <Pressable 
            style={[buttonStyles.base, buttonStyles.primary, (!origin || !destination) && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!origin || !destination}
          >
            <Text style={[buttonStyles.text, { color: colors.text.inverse }]}>Search</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable 
          style={[buttonStyles.base, buttonStyles.secondary]} 
          onPress={handlePostRide}
        >
          <Ionicons name="car-outline" size={24} color={colors.primary.deepPurple} />
          <Text style={[buttonStyles.text, { color: colors.text.primary }]}>Post a ride</Text>
        </Pressable>
        <Pressable 
          style={[buttonStyles.base, buttonStyles.secondary]} 
          onPress={() => router.push('/(tabs)/find-ride')}
        >
          <Ionicons name="search-outline" size={24} color={colors.primary.deepPurple} />
          <Text style={[buttonStyles.text, { color: colors.text.primary }]}>Find a ride</Text>
        </Pressable>
      </View>

      {/* Popular Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular routes</Text>
        <View style={styles.popularRoutesGrid}>
          {POPULAR_ROUTES.map((route) => (
            <Pressable 
              key={route.id}
              style={styles.routeCard}
              onPress={() => {
                setDestination({
                  latitude: route.latitude,
                  longitude: route.longitude,
                  address: route.name.split(' to ')[1]
                });
                router.push('/(tabs)/find-ride');
              }}
            >
              <LinearGradient
                colors={[colors.primary.deepPurple, colors.primary.electricIndigo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.routeGradient}
              >
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDetails}>{route.address}</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={colors.text.inverse} />
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: 20,
  } as ViewStyle,
  heroContainer: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  } as ViewStyle,
  heroTitle: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fonts.primary,
    fontWeight: '700',
    letterSpacing: typography.letterSpacing.h1,
    color: colors.text.inverse,
    marginBottom: 20,
  } as TextStyle,
  searchForm: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 15,
    gap: 10,
  } as ViewStyle,
  locationInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: 10,
  } as ViewStyle,
  searchButtonDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: colors.background.primary,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  section: {
    padding: 20,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    letterSpacing: typography.letterSpacing.h2,
    color: colors.text.primary,
    marginBottom: 15,
  } as TextStyle,
  popularRoutesGrid: {
    flexDirection: 'column',
    gap: 12,
  } as ViewStyle,
  routeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  } as ViewStyle,
  routeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  } as ViewStyle,
  routeInfo: {
    flex: 1,
  } as ViewStyle,
  routeName: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: 4,
  } as TextStyle,
  routeDetails: {
    fontSize: typography.sizes.body2,
    fontFamily: typography.fonts.primary,
    fontWeight: '400',
    color: colors.text.inverse,
    opacity: 0.9,
  } as TextStyle,
  brandSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  } as ViewStyle,
  brandName: {
    fontSize: 32,
    fontFamily: typography.fonts.primary,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 0.5,
  } as TextStyle,
  brandTagline: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.inverse,
    opacity: 0.9,
    marginTop: 4,
  } as TextStyle,
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    paddingRight: 16,
    borderRadius: 40,
    gap: 12,
  } as ViewStyle,
  welcomeContent: {
    flex: 1,
  } as ViewStyle,
  welcomeText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.inverse,
    opacity: 0.9,
  } as TextStyle,
  userName: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.inverse,
    maxWidth: 120,
  } as TextStyle,
});
