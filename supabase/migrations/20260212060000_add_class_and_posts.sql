-- Add class column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class text;

-- Create posts table
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read posts (class filtering enforced in query)
CREATE POLICY "Authenticated users can read posts" ON posts FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert their own posts
CREATE POLICY "Users can create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
