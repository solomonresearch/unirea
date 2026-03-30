-- ============================================
-- UNIREA - Database Schema
-- Run this in Supabase SQL Editor if CLI push fails
-- https://supabase.com/dashboard/project/bijgvffnjplvcpnejrdn/sql
-- ============================================

-- Create profiles table for extended user data
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  username text unique not null,
  email text not null,
  phone text,
  highschool text not null,
  graduation_year integer not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Function to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================
-- Schools (unitati de invatamant)
-- ============================================

create table if not exists public.schools (
  id bigint generated always as identity primary key,
  an text,
  judet_pj text,
  localitate_pj text,
  cod_siruta_pj numeric,
  mediu_loc_pj text,
  cod_siiir_pj numeric,
  denumire_pj text,
  localitate_unitate text,
  cod_siruta_unitate numeric,
  mediu_loc_unitate text,
  cod_sirues text,
  cod_siiir_unitate numeric,
  denumire_scurta_unitate text,
  denumire_lunga_unitate text,
  tip_unitate text,
  statut_unitate text,
  cod_fiscal text,
  mod_functionare text,
  forma_finantare text,
  forma_proprietate text,
  strada text,
  numar text,
  cod_postal numeric,
  telefon numeric,
  fax numeric,
  email text,
  created_at timestamptz default now() not null
);

alter table public.schools enable row level security;

create policy "Schools are publicly readable"
  on public.schools for select
  using (true);

create index idx_schools_judet on public.schools (judet_pj);
create index idx_schools_denumire on public.schools (denumire_lunga_unitate);
create index idx_schools_localitate on public.schools (localitate_unitate);

-- ============================================
-- Mentorship Profiles
-- ============================================

create table if not exists public.mentorship_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  highschool    text not null,

  mentor_text   text,
  mentor_active boolean not null default false,
  mentee_text   text,
  mentee_active boolean not null default false,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint mentorship_profiles_user_id_key unique (user_id)
);

alter table public.mentorship_profiles enable row level security;

create trigger on_mentorship_profile_updated
  before update on public.mentorship_profiles
  for each row execute function public.handle_updated_at();

create policy "Mentorship profiles are publicly readable"
  on public.mentorship_profiles for select
  using (true);

create policy "Users can insert own mentorship profile"
  on public.mentorship_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mentorship profile"
  on public.mentorship_profiles for update
  using (auth.uid() = user_id);

create index idx_mentorship_highschool on public.mentorship_profiles (highschool);
create index idx_mentorship_mentor_active on public.mentorship_profiles (mentor_active) where mentor_active = true;
create index idx_mentorship_mentee_active on public.mentorship_profiles (mentee_active) where mentee_active = true;
