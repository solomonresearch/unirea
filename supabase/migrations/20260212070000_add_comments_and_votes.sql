-- Comments on posts
CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments" ON comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Votes on posts (1 = upvote, -1 = downvote)
CREATE TABLE post_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read votes" ON post_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own votes" ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON post_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON post_votes FOR DELETE USING (auth.uid() = user_id);
