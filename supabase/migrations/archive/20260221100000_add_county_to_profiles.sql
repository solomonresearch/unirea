-- Add county column to profiles (2-letter Romanian county code, e.g. 'CJ', 'IS', 'B')
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS county text;
