-- Add archived_at column to profiles for soft-delete / account archival
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
