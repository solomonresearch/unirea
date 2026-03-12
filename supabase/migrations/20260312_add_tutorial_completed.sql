ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false;

-- Backfill: don't show tutorial to existing users
UPDATE public.profiles
SET tutorial_completed = true
WHERE onboarding_completed = true
   OR created_at < NOW() - INTERVAL '1 day';
