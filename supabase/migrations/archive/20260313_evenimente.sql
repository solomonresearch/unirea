-- Table: evenimente
CREATE TABLE public.evenimente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope = ANY (ARRAY['class','promotion','school'])),
  highschool text NOT NULL,
  graduation_year integer,
  class text,
  title text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  location text,
  description text,
  image_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT evenimente_pkey PRIMARY KEY (id),
  CONSTRAINT evenimente_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE INDEX idx_evenimente_highschool ON public.evenimente (highschool);
CREATE INDEX idx_evenimente_event_date ON public.evenimente (event_date);

-- Table: eveniment_participanti
CREATE TABLE public.eveniment_participanti (
  eveniment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT eveniment_participanti_pkey PRIMARY KEY (eveniment_id, user_id),
  CONSTRAINT eveniment_participanti_eveniment_id_fkey FOREIGN KEY (eveniment_id) REFERENCES public.evenimente(id),
  CONSTRAINT eveniment_participanti_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- RLS: evenimente
ALTER TABLE public.evenimente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read non-deleted events"
  ON public.evenimente FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Users can insert their own events"
  ON public.evenimente FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events"
  ON public.evenimente FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS: eveniment_participanti
ALTER TABLE public.eveniment_participanti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read participants"
  ON public.eveniment_participanti FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own participation"
  ON public.eveniment_participanti FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own participation"
  ON public.eveniment_participanti FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger (reuses handle_updated_at if exists, otherwise creates it)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_evenimente_updated_at
  BEFORE UPDATE ON public.evenimente
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
