import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, Image, RefreshControl, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useColorScheme } from '../components/useColorScheme';
import { typography } from '../theme/typography';
import { colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { buttonStyles } from '../theme/components/buttons';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../components/Avatar';
import CityInput from '../components/CityInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type City = {
  id: string;
  name: string;
  region: string;
};

type PopularDestination = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const POPULAR_ROUTES: PopularDestination[] = [
  {
    id: '1',
    name: 'Kampala to Gulu',
    address: '330km • 6h drive',
    latitude: 2.7747,
    longitude: 32.2990,
  },
  {
    id: '2',
    name: 'Kampala to Mbarara',
    address: '270km • 4h drive',
    latitude: -0.6071,
    longitude: 30.6545,
  },
  {
    id: '3',
    name: 'Kampala to Jinja',
    address: '80km • 2h drive',
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
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
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

  const handleSearch = () => {
    if (origin && destination) {
      router.push({
        pathname: '/(tabs)/find-ride',
        params: {
          origin: origin.name,
          destination: destination.name
        }
      });
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
        colors={[colors.primary.deepPurple, colors.accent.mintGreen]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroContainer, { paddingTop: insets.top + 32 }]}
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
          <CityInput
            placeholder="Leaving from..."
            value={origin}
            onCitySelect={setOrigin}
            containerStyle={styles.locationInput}
          />
          <CityInput
            placeholder="Going to..."
            value={destination}
            onCitySelect={setDestination}
            containerStyle={styles.locationInput}
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
          style={[buttonStyles.base, buttonStyles.secondary, styles.quickActionButton]} 
          onPress={handlePostRide}
        >
          <Ionicons name="car-outline" size={24} color={colors.primary.deepPurple} />
          <Text style={[buttonStyles.text, { color: colors.text.primary }]}>Post a ride</Text>
        </Pressable>
        <Pressable 
          style={[buttonStyles.base, buttonStyles.secondary, styles.quickActionButton]} 
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
                  id: route.id,
                  name: route.name,
                  region: route.address.split(' ')[0]
                });
                router.push('/(tabs)/find-ride');
              }}
            >
              <View style={styles.routeCardContent}>
                <View style={styles.routeIconContainer}>
                  <Ionicons name="navigate-circle-outline" size={32} color={colors.primary.deepPurple} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={styles.routeDetailsContainer}>
                    <Ionicons name="time-outline" size={16} color={colors.text.disabled} />
                    <Text style={styles.routeDetails}>{route.address}</Text>
                  </View>
                </View>
                <View style={styles.routeAction}>
                  <View style={styles.routeActionButton}>
                    <Ionicons name="arrow-forward" size={20} color={colors.primary.deepPurple} />
                  </View>
                </View>
              </View>
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
    paddingBottom: 32,
  } as ViewStyle,
  heroContainer: {
    padding: 32,
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
    marginBottom: 24,
    marginTop: 48,
  } as TextStyle,
  searchForm: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  } as ViewStyle,
  locationInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 16,
    height: 56,
  } as ViewStyle,
  searchButtonDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: colors.background.primary,
    marginTop: -24,
    marginHorizontal: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  } as ViewStyle,
  quickActionButton: {
    flex: 1,
  } as ViewStyle,
  section: {
    padding: 32,
  } as ViewStyle,
  sectionTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 24,
  } as TextStyle,
  popularRoutesGrid: {
    gap: 16,
  } as ViewStyle,
  routeCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.neutral.spaceBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.secondary,
    marginBottom: 8,
  } as ViewStyle,
  routeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  } as ViewStyle,
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  routeInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  routeName: {
    fontSize: typography.sizes.body1,
    fontFamily: typography.fonts.primary,
    fontWeight: '600',
    color: colors.text.primary,
  } as TextStyle,
  routeDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  routeDetails: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.primary,
    fontWeight: '500',
    color: colors.text.disabled,
  } as TextStyle,
  routeAction: {
    alignItems: 'flex-end',
  } as ViewStyle,
  routeActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  brandSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  } as ViewStyle,
  brandName: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fonts.primary,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: typography.letterSpacing.h1,
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
