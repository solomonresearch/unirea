-- Add domain field to profiles
alter table public.profiles
  add column if not exists domain text;
