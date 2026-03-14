-- Allow admins to update/delete any post or comment across all tables
-- (soft delete = UPDATE setting deleted_at, edit = UPDATE setting content)

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- avizier_posts: allow admin update
DROP POLICY IF EXISTS "update" ON avizier_posts;
CREATE POLICY "update" ON avizier_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- avizier_post_comments: allow admin update
DROP POLICY IF EXISTS "update" ON avizier_post_comments;
CREATE POLICY "update" ON avizier_post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- carusel_posts: allow admin update
DROP POLICY IF EXISTS "update" ON carusel_posts;
CREATE POLICY "update" ON carusel_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- carusel_comments: allow admin update
DROP POLICY IF EXISTS "update" ON carusel_comments;
CREATE POLICY "update" ON carusel_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- posts (tabla): allow admin update
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- comments (tabla): allow admin update
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- ziar_posts: allow admin update (soft delete)
DROP POLICY IF EXISTS "update" ON ziar_posts;
CREATE POLICY "update" ON ziar_posts FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin());

-- announcement_comments: allow admin update
DROP POLICY IF EXISTS "Users can update own announcement comments" ON announcement_comments;
CREATE POLICY "Users can update own announcement comments" ON announcement_comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());
