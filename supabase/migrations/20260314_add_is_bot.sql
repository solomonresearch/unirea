-- Add is_bot column to profiles for identifying test/bot accounts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

-- Mark existing bots: email ending in @bot.unirea or containing '+bot' before @
UPDATE public.profiles
SET is_bot = true
WHERE email ILIKE '%@bot.unirea%'
   OR email ILIKE '%+bot%@%'
   OR email ILIKE 'bot-%@%'
   OR email ILIKE '%@test.%'
   OR name ILIKE 'Bot %'
   OR name ILIKE '% Bot';
