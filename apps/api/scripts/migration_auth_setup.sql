-- Database Migration: Setup for Authentication & Profiles
-- This script prepares the database for Supabase Auth integration.

-- 1. Ensure public.users table (Profiles) strictly links to auth.users
-- We will recreate the users table to ensure correct constraints if it already exists with wrong ID type
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate public.users as "profiles" table
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  telegram_chat_id text,
  discord_webhook_url text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.users FOR SELECT 
  USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Add RLS to other tables to secure user data
-- Squads
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own squads" ON public.squads
  USING (auth.uid() = user_id);

-- Tracked Targets (Inherits access from Squads mostly, but simple owner check is good)
ALTER TABLE public.tracked_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tracked targets" ON public.tracked_targets
  USING (
    EXISTS (SELECT 1 FROM public.squads WHERE id = tracked_targets.squad_id AND user_id = auth.uid())
  );

-- Watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlists" ON public.watchlists
  USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications
  USING (auth.uid() = user_id);

-- Price Alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
  USING (auth.uid() = user_id);
