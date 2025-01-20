-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY,
  phone text
);

-- Insert test drivers
INSERT INTO auth.users (id, phone)
VALUES 
  ('d1b23c45-6789-4a0b-b1c2-3d4e5f6a7b8c', '+256700000001'),
  ('e2c34d56-789a-5b1c-c2d3-4e5f6a7b8c9d', '+256700000002'),
  ('f3d45e67-89ab-6c2d-d3e4-5f6a7b8c9d0e', '+256700000003')
ON CONFLICT (id) DO NOTHING;

-- Update test drivers
UPDATE public.profiles 
SET 
  full_name = 'John Doe',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  is_driver = true,
  rating = 4.8,
  total_rides = 156,
  wallet_balance = 250000,
  vehicle_details = '{"type":"Toyota Hiace","color":"White","plate_number":"UAX 123K","year":2019,"seats":14}'::jsonb
WHERE id = 'd1b23c45-6789-4a0b-b1c2-3d4e5f6a7b8c'::uuid;

UPDATE public.profiles 
SET 
  full_name = 'Sarah Smith',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  is_driver = true,
  rating = 4.9,
  total_rides = 203,
  wallet_balance = 380000,
  vehicle_details = '{"type":"Nissan Caravan","color":"Silver","plate_number":"UBB 456L","year":2020,"seats":14}'::jsonb
WHERE id = 'e2c34d56-789a-5b1c-c2d3-4e5f6a7b8c9d'::uuid;

UPDATE public.profiles 
SET 
  full_name = 'Michael Johnson',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  is_driver = true,
  rating = 4.7,
  total_rides = 128,
  wallet_balance = 175000,
  vehicle_details = '{"type":"Toyota Coaster","color":"Blue","plate_number":"UAZ 789M","year":2018,"seats":28}'::jsonb
WHERE id = 'f3d45e67-89ab-6c2d-d3e4-5f6a7b8c9d0e'::uuid;

-- Insert test rides
INSERT INTO public.rides (id, driver_id, origin_lat, origin_lng, destination_lat, destination_lng, origin_address, destination_address, departure_time, price_per_seat, available_seats, status)
VALUES 
  -- Kampala to Gulu routes
  ('a1b23c45-6789-4a0b-b1c2-3d4e5f6a7b8c'::uuid, 'd1b23c45-6789-4a0b-b1c2-3d4e5f6a7b8c'::uuid, 0.3476, 32.5825, 2.7747, 32.2990, 'Kampala', 'Gulu', NOW() + INTERVAL '1 day', 50000, 10, 'pending'),
  ('b2c34d56-789a-5b1c-c2d3-4e5f6a7b8c9d'::uuid, 'e2c34d56-789a-5b1c-c2d3-4e5f6a7b8c9d'::uuid, 0.3476, 32.5825, 2.7747, 32.2990, 'Kampala', 'Gulu', NOW() + INTERVAL '2 days', 45000, 12, 'pending'),
  
  -- Kampala to Mbarara routes
  ('c3d45e67-89ab-6c2d-d3e4-5f6a7b8c9d0e'::uuid, 'f3d45e67-89ab-6c2d-d3e4-5f6a7b8c9d0e'::uuid, 0.3476, 32.5825, -0.6071, 30.6545, 'Kampala', 'Mbarara', NOW() + INTERVAL '1 day', 35000, 24, 'pending'),
  ('d4e56f78-9abc-7d3e-e4f5-6a7b8c9d0e1f'::uuid, 'd1b23c45-6789-4a0b-b1c2-3d4e5f6a7b8c'::uuid, 0.3476, 32.5825, -0.6071, 30.6545, 'Kampala', 'Mbarara', NOW() + INTERVAL '3 days', 40000, 8, 'pending'),
  
  -- Kampala to Jinja routes
  ('e5f67890-abcd-8e4f-f5f6-7b8c9d0e1f2f'::uuid, 'e2c34d56-789a-5b1c-c2d3-4e5f6a7b8c9d'::uuid, 0.3476, 32.5825, 0.4478, 33.2027, 'Kampala', 'Jinja', NOW() + INTERVAL '1 day', 25000, 12, 'pending'),
  ('f6789abc-bcde-9f5f-f6f7-8c9d0e1f2f3f'::uuid, 'f3d45e67-89ab-6c2d-d3e4-5f6a7b8c9d0e'::uuid, 0.3476, 32.5825, 0.4478, 33.2027, 'Kampala', 'Jinja', NOW() + INTERVAL '2 days', 20000, 20, 'pending'); 