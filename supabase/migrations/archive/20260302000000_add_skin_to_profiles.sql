-- Add skin preference column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skin text DEFAULT 'campus';
