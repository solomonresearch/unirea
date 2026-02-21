-- Announcements table
CREATE TABLE announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  highschool text NOT NULL,
  content text NOT NULL,
  expires_at timestamptz NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read announcements" ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own announcements" ON announcements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own announcements" ON announcements FOR UPDATE USING (auth.uid() = user_id);

-- Votes table (same pattern as post_votes)
CREATE TABLE announcement_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcement_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read announcement votes" ON announcement_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own announcement votes" ON announcement_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own announcement votes" ON announcement_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own announcement votes" ON announcement_votes FOR DELETE USING (auth.uid() = user_id);

-- Comments table (same pattern as comments)
CREATE TABLE announcement_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read announcement comments" ON announcement_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own announcement comments" ON announcement_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own announcement comments" ON announcement_comments FOR UPDATE USING (auth.uid() = user_id);
