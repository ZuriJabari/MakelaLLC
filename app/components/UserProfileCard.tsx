import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';

type VerificationBadge = {
  type: 'phone' | 'email' | 'id' | 'license';
  verified: boolean;
};

export type UserProfileCardProps = {
  /** User's full name */
  name: string;
  /** URL to user's avatar image */
  avatarUrl?: string | null;
  /** User's rating (0-5) */
  rating?: number;
  /** Number of ratings received */
  ratingCount?: number;
  /** Array of verification badges */
  verificationBadges?: VerificationBadge[];
  /** User's phone number */
  phoneNumber?: string;
  /** Whether the user is a driver */
  isDriver?: boolean;
  /** User's total completed rides */
  completedRides?: number;
  /** Whether to show the full profile or compact version */
  compact?: boolean;
  /** Optional click handler */
  onPress?: () => void;
};

/**
 * A reusable user profile card component that displays user information
 * with verification badges and ratings.
 * 
 * Features:
 * - Profile photo with fallback
 * - Rating display
 * - Verification badges
 * - Basic user info
 * - Compact and full layouts
 */
export default function UserProfileCard({
  name,
  avatarUrl,
  rating = 0,
  ratingCount = 0,
  verificationBadges = [],
  phoneNumber,
  isDriver = false,
  completedRides = 0,
  compact = false,
  onPress,
}: UserProfileCardProps) {
  const colorScheme = useColorScheme();

  const getBadgeIcon = (type: VerificationBadge['type']) => {
    switch (type) {
      case 'phone':
        return 'phone-portrait';
      case 'email':
        return 'mail';
      case 'id':
        return 'card';
      case 'license':
        return 'car';
      default:
        return 'checkmark-circle';
    }
  };

  const renderBadges = () => (
    <View style={styles.badgesContainer}>
      {verificationBadges.map((badge, index) => (
        <View 
          key={index}
          style={[
            styles.badge,
            { backgroundColor: badge.verified ? '#32CD32' : '#FF4444' }
          ]}
        >
          <Ionicons 
            name={getBadgeIcon(badge.type)} 
            size={12} 
            color="#fff" 
          />
        </View>
      ))}
    </View>
  );

  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Ionicons name="star" size={16} color="#FFD700" />
      <Text style={[styles.ratingText, { color: Colors[colorScheme].text }]}>
        {rating.toFixed(1)}
      </Text>
      <Text style={[styles.ratingCount, { color: Colors[colorScheme].text }]}>
        ({ratingCount})
      </Text>
    </View>
  );

  if (compact) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          { backgroundColor: Colors[colorScheme].background }
        ]}
        onPress={onPress}
      >
        <Avatar size={40} imageUrl={avatarUrl} name={name} />
        <View style={styles.compactInfo}>
          <Text style={[styles.name, { color: Colors[colorScheme].text }]}>
            {name}
          </Text>
          {renderRating()}
        </View>
        {renderBadges()}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background }
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Avatar size={60} imageUrl={avatarUrl} name={name} />
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: Colors[colorScheme].text }]}>
            {name}
          </Text>
          {renderRating()}
          {renderBadges()}
        </View>
      </View>

      <View style={styles.details}>
        {phoneNumber && (
          <View style={styles.detailRow}>
            <Ionicons 
              name="call" 
              size={16} 
              color={Colors[colorScheme].text} 
            />
            <Text style={[styles.detailText, { color: Colors[colorScheme].text }]}>
              {phoneNumber}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons 
            name="car" 
            size={16} 
            color={Colors[colorScheme].text} 
          />
          <Text style={[styles.detailText, { color: Colors[colorScheme].text }]}>
            {isDriver ? 'Driver' : 'Passenger'} • {completedRides} rides
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
}); 