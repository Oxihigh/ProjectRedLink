-- Clean up existing objects to allow safe re-runs
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP TABLE IF EXISTS public.blood_requests CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.contact_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS blood_type CASCADE;

-- Create an ENUM for User Roles
CREATE TYPE user_role AS ENUM ('donor', 'requester');

-- Create an ENUM for Blood Groups
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Users Table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    role user_role NOT NULL,
    blood_group blood_type, -- Nullable for Requesters
    pincode INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    last_donation_date DATE, -- Nullable, used for cooldown logic
    fcm_token TEXT, -- Firebase Cloud Messaging push notification token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to search for donors (excluding phone numbers, this requires a specific database function or we can handle it at the API layer. We will handle phone number exclusion at the API layer for simplicity, so we allow Requesters to select from users).
-- For production, we'd use a view or a secure function to prevent data leakage, but API-level filtering is acceptable for Phase 1 MVP.
CREATE POLICY "Users can view donors" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserting own profile
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow updating own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- PHASE 2 SCHEMA ADDITIONS
-- ==========================================

-- 1. Add new columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lifesaver_points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Contact Logs Table (Rate Limiting)
CREATE TABLE public.contact_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT NOT NULL, -- Storing IP Address instead of UUID
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requesters can view their own contact logs" ON public.contact_logs
    FOR SELECT USING (true); -- IP logic handled in backend

CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    requester_id TEXT NOT NULL,
    requester_confirmed BOOLEAN DEFAULT FALSE,
    donor_confirmed BOOLEAN DEFAULT FALSE,
    blood_group TEXT,
    hospital_name TEXT,
    donated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PHASE 3 SCHEMA ADDITIONS (Realtime Blood Requests)
-- ==========================================

CREATE TABLE public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    pincode INTEGER NOT NULL,
    hospital_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    success_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blood requests" ON public.blood_requests FOR SELECT USING (true);

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;

-- ==========================================
-- PHASE 4 SCHEMA ADDITIONS (PostGIS Proximity Matching)
-- ==========================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location columns (geography type uses meters for distance calculations)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location geography(POINT);
ALTER TABLE public.blood_requests ADD COLUMN IF NOT EXISTS location geography(POINT);

-- Function to find nearby donors
-- radius_km specifies search distance in kilometers
CREATE OR REPLACE FUNCTION get_nearby_donors(
    target_lat float,
    target_lon float,
    target_blood_group blood_type,
    radius_km float DEFAULT 10.0
)
RETURNS TABLE (
    id uuid,
    name text,
    blood_group blood_type,
    pincode integer,
    last_donation_date date,
    lifesaver_points integer,
    fcm_token text,
    distance_meters float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, 
        u.name, 
        u.blood_group, 
        u.pincode, 
        u.last_donation_date, 
        u.lifesaver_points,
        u.fcm_token,
        ST_Distance(u.location, ST_SetSRID(ST_MakePoint(target_lon, target_lat), 4326)::geography) as distance_meters
    FROM public.users u
    WHERE u.role = 'donor'
      AND u.is_banned = FALSE
      AND u.is_suspicious = FALSE
      AND u.blood_group = target_blood_group
      AND ST_DWithin(
          u.location, 
          ST_SetSRID(ST_MakePoint(target_lon, target_lat), 4326)::geography, 
          radius_km * 1000 -- Convert km to meters
      )
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
