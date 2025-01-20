export type LocationPoint = {
  latitude: number;
  longitude: number;
  address: string;
};

export type Driver = {
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

export type Ride = {
  id: string;
  driver: Driver;
  origin_address: string;
  destination_address: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
};

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  wallet_balance: number;
}; 