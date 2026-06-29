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

-- 3. Reports Table (Shadow Banning)
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- Keep reports private; only system checks them

-- 4. Donations Table (The Trust Handshake)
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT NOT NULL, -- IP Address
    donor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    requester_confirmed BOOLEAN DEFAULT FALSE,
    donor_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own donations" ON public.donations
    FOR SELECT USING (true); -- Backend handles filtering

-- ==========================================
-- PHASE 3 SCHEMA ADDITIONS
-- ==========================================

-- 1. Blood Requests Table
CREATE TABLE public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT NOT NULL, -- IP Address
    blood_group blood_type NOT NULL,
    pincode INTEGER NOT NULL,
    hospital_name TEXT,
    location_details TEXT,
    phone_number TEXT,
    success_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active requests
CREATE POLICY "Users can view blood requests" ON public.blood_requests
    FOR SELECT USING (true);

-- Allow anyone to insert (Backend rate limits by IP)
CREATE POLICY "Requesters can insert blood requests" ON public.blood_requests
    FOR INSERT WITH CHECK (true);

-- Allow system/users to delete
CREATE POLICY "Allow deletion of requests" ON public.blood_requests
    FOR DELETE USING (true); -- Usually restricted to admin or cron, leaving true for MVP cron endpoint

-- 2. Enable Supabase Realtime for blood_requests
-- Drop it if it exists to prevent errors in some Supabase instances
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;

-- ==========================================
-- PHASE 4 SCHEMA ADDITIONS (SMS Rate Limiting)
-- ==========================================

CREATE TABLE public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
-- Internal backend table, no public access policies needed.
