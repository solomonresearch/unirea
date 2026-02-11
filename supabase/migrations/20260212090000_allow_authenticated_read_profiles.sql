-- Allow authenticated users to read all profiles (needed for search/cauta page)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
