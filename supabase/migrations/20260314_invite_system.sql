-- Invite system: referred_by + invite_count on profiles, waitlist_schools table

-- Add invite tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS invite_count integer NOT NULL DEFAULT 0;

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
