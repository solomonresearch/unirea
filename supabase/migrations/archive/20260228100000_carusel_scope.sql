ALTER TABLE public.carusel_posts
  ADD COLUMN scope text NOT NULL DEFAULT 'promotion' CHECK (scope = ANY (ARRAY['class', 'promotion', 'school'])),
  ADD COLUMN highschool text,
  ADD COLUMN graduation_year integer,
  ADD COLUMN class text;
