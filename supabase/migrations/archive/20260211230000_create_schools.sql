-- Schools (unitati de invatamant) table from official registry
create table public.schools (
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

-- Enable RLS
alter table public.schools enable row level security;

-- Everyone can read schools (public data)
create policy "Schools are publicly readable"
  on public.schools for select
  using (true);

-- Index for common lookups
create index idx_schools_judet on public.schools (judet_pj);
create index idx_schools_denumire on public.schools (denumire_lunga_unitate);
create index idx_schools_localitate on public.schools (localitate_unitate);
