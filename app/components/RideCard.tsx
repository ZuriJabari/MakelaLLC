import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import UserProfileCard from './UserProfileCard';

type Driver = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  rating: number;
  rating_count: number;
  verification_badges: Array<{
    type: 'phone' | 'email' | 'id' | 'license';
    verified: boolean;
  }>;
};

export type RideCardProps = {
  /** Ride origin address */
  originAddress: string;
  /** Ride destination address */
  destinationAddress: string;
  /** Departure time */
  departureTime: string;
  /** Price per seat in UGX */
  pricePerSeat: number;
  /** Number of available seats */
  availableSeats: number;
  /** Driver information */
  driver: Driver;
  /** Ride status */
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  /** Primary action button text */
  primaryActionText?: string;
  /** Secondary action button text */
  secondaryActionText?: string;
  /** Primary action handler */
  onPrimaryAction?: () => void;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Whether to show the full card or compact version */
  compact?: boolean;
};

/**
 * A reusable ride card component that displays ride information
 * with route visualization and action buttons.
 * 
 * Features:
 * - Route visualization with icons
 * - Price and seat availability
 * - Driver information
 * - Status indicators
 * - Action buttons
 * - Compact and full layouts
 */
export default function RideCard({
  originAddress,
  destinationAddress,
  departureTime,
  pricePerSeat,
  availableSeats,
  driver,
  status = 'pending',
  primaryActionText,
  secondaryActionText,
  onPrimaryAction,
  onSecondaryAction,
  compact = false,
}: RideCardProps) {
  const colorScheme = useColorScheme();

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return '#32CD32';
      case 'in_progress':
        return '#4A90E2';
      case 'completed':
        return '#9370DB';
      case 'cancelled':
        return '#FF4444';
      default:
        return '#FFB347';
    }
  };

  const renderRoute = () => (
    <View style={styles.routeContainer}>
      <View style={styles.routeIcons}>
        <View style={styles.routeIcon}>
          <Ionicons name="ellipse" size={12} color="#32CD32" />
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeIcon}>
          <Ionicons name="location" size={12} color="#FF4444" />
        </View>
      </View>
      <View style={styles.routeAddresses}>
        <Text 
          style={[styles.address, { color: Colors[colorScheme].text }]}
          numberOfLines={1}
        >
          {originAddress}
        </Text>
        <Text 
          style={[styles.address, { color: Colors[colorScheme].text }]}
          numberOfLines={1}
        >
          {destinationAddress}
        </Text>
      </View>
    </View>
  );

  const renderInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoItem}>
        <Ionicons name="time" size={16} color={Colors[colorScheme].text} />
        <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
          {new Date(departureTime).toLocaleString()}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={16} color={Colors[colorScheme].text} />
          <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
            UGX {pricePerSeat.toLocaleString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people" size={16} color={Colors[colorScheme].text} />
          <Text style={[styles.infoText, { color: Colors[colorScheme].text }]}>
            {availableSeats} seats
          </Text>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {primaryActionText && (
        <Pressable
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onPrimaryAction}
        >
          <Text style={styles.actionButtonText}>{primaryActionText}</Text>
        </Pressable>
      )}
      {secondaryActionText && (
        <Pressable
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onSecondaryAction}
        >
          <Text style={[styles.actionButtonText, { color: Colors[colorScheme].text }]}>
            {secondaryActionText}
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (compact) {
    return (
      <View 
        style={[
          styles.compactContainer,
          { backgroundColor: Colors[colorScheme].background }
        ]}
      >
        <View style={styles.compactHeader}>
          {renderRoute()}
          <View 
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() }
            ]}
          >
            <Text style={styles.statusText}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>
        {renderInfo()}
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background }
      ]}
    >
      <View style={styles.header}>
        <UserProfileCard
          name={driver.full_name}
          avatarUrl={driver.avatar_url}
          rating={driver.rating}
          ratingCount={driver.rating_count}
          verificationBadges={driver.verification_badges}
          compact
        />
        <View 
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() }
          ]}
        >
          <Text style={styles.statusText}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      {renderRoute()}
      {renderInfo()}
      {renderActions()}
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
  },
  routeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E1E1E1',
    marginVertical: 4,
    alignSelf: 'center',
  },
  routeAddresses: {
    flex: 1,
    marginLeft: 8,
    gap: 20,
  },
  address: {
    fontSize: 14,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#32CD32',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 