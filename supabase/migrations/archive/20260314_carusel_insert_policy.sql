-- Add missing INSERT policies for carusel tables
-- carusel_posts had RLS enabled but no INSERT policy, blocking all uploads

CREATE POLICY "insert" ON carusel_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert" ON carusel_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert" ON carusel_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
