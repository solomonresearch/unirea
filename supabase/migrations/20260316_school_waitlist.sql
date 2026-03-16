-- 1. Ensure schools has enabled + request_count (may already exist)
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_count integer NOT NULL DEFAULT 0;

-- 2. App-wide config table
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
INSERT INTO public.app_config (key, value)
  VALUES ('thresh_enable_school', '50')
  ON CONFLICT (key) DO NOTHING;

-- 3. RLS: app_config readable by all authenticated users
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_config' AND policyname = 'authenticated read app_config'
  ) THEN
    CREATE POLICY "authenticated read app_config"
      ON public.app_config FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
