-- Invite system: referred_by + invite_count on profiles, waitlist_schools table

-- Add invite tracking columns to profiles
-- signup_source: 'direct' (visited /inregistrare), 'referral' (came via /i/username), 'google' (Google OAuth direct), 'google_referral' (Google OAuth via referral link)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS invite_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signup_source text NOT NULL DEFAULT 'direct';

-- Referrals table — explicit edge list for social graph queries
-- Each row = one successful referral (referrer → referred user)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals (referred_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all referrals (needed for graph)
CREATE POLICY "Authenticated users can read referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert referrals (on signup)
CREATE POLICY "Authenticated users can insert referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Waitlist schools table: tracks signups per non-top school
CREATE TABLE IF NOT EXISTS public.waitlist_schools (
  highschool text PRIMARY KEY,
  signup_count integer NOT NULL DEFAULT 0,
  activated_at timestamptz
);

ALTER TABLE public.waitlist_schools ENABLE ROW LEVEL SECURITY;

-- Everyone can read waitlist status
CREATE POLICY "Anyone can read waitlist_schools"
  ON public.waitlist_schools FOR SELECT
  USING (true);

-- Service role handles inserts/updates (via API routes)
-- No insert/update policies needed for anon — handled server-side

-- Function to check if a school is active (top_school OR waitlist activated)
CREATE OR REPLACE FUNCTION public.check_school_active(school_name text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools
    WHERE denumire_lunga_unitate = school_name AND top_school = true
  )
  OR EXISTS (
    SELECT 1 FROM public.waitlist_schools
    WHERE highschool = school_name AND activated_at IS NOT NULL
  );
$$ LANGUAGE sql STABLE;

-- Function to increment a user's invite_count
CREATE OR REPLACE FUNCTION public.increment_invite_count(user_id uuid)
RETURNS void AS $$
  UPDATE public.profiles
  SET invite_count = invite_count + 1
  WHERE id = user_id;
$$ LANGUAGE sql VOLATILE;

-- RLS policies for waitlist_schools insert/update (authenticated users can upsert)
CREATE POLICY "Authenticated users can insert waitlist_schools"
  ON public.waitlist_schools FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update waitlist_schools"
  ON public.waitlist_schools FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
