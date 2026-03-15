ALTER TABLE public.carusel_posts
  ADD COLUMN IF NOT EXISTS photo_date  timestamptz,
  ADD COLUMN IF NOT EXISTS location_text text;
