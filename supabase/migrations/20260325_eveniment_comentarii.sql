CREATE TABLE public.eveniment_comentarii (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  eveniment_id uuid NOT NULL REFERENCES public.evenimente(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT eveniment_comentarii_pkey PRIMARY KEY (id)
);

ALTER TABLE public.eveniment_comentarii ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_eveniment_comentarii" ON public.eveniment_comentarii
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "insert_eveniment_comentarii" ON public.eveniment_comentarii
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_eveniment_comentarii" ON public.eveniment_comentarii
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
