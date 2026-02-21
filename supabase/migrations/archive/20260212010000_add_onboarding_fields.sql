-- Add onboarding fields to profiles

alter table public.profiles
  add column if not exists profession text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists hobbies text[],
  add column if not exists bio text,
  add column if not exists onboarding_completed boolean default false not null;
