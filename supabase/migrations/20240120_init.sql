-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  phone TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_driver BOOLEAN DEFAULT false,
  rating DOUBLE PRECISION DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  vehicle_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL,
  available_seats INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seats_booked INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chats table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  other_user_id uuid references auth.users on delete cascade not null,
  ride_id uuid references rides(id) on delete cascade not null,
  last_message_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unread_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  sender_id uuid references auth.users on delete cascade not null,
  receiver_id uuid references auth.users on delete cascade not null,
  type text not null,
  content text not null,
  metadata jsonb,
  status text default 'sent' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recent_locations table
CREATE TABLE public.recent_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Rides are viewable by everyone" ON public.rides
  FOR SELECT USING (true);

CREATE POLICY "Drivers can insert own rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Users can insert own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

-- Recent locations policies
CREATE POLICY "Users can view own recent locations" ON public.recent_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recent locations" ON public.recent_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on chats and messages
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Create chat policies
create policy "Users can view their own chats."
  on public.chats for select
  using (auth.uid() = user_id OR auth.uid() = other_user_id);

create policy "Users can insert their own chats."
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chats."
  on public.chats for update
  using (auth.uid() = user_id OR auth.uid() = other_user_id);

-- Create message policies
create policy "Users can view messages in their chats."
  on public.messages for select
  using (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

create policy "Users can insert their own messages."
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update message status."
  on public.messages for update
  using (auth.uid() = receiver_id);

-- Create storage bucket for avatars
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict (id) do nothing;

-- Set up storage policy for avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.uid() = owner );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Create trigger for updating timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- Create trigger to sync auth.users phone with profiles
create or replace function public.handle_auth_user_created()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_auth_user_created(); 