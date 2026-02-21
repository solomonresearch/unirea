-- Soft delete: add deleted_at to posts and comments
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Allow users to update their own posts (for soft delete)
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to update their own comments (for soft delete)
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
