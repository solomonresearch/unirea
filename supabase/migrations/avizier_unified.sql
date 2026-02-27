-- New unified table
CREATE TABLE avizier_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('class', 'promotion', 'school')),
  highschool TEXT NOT NULL,
  graduation_year INTEGER,
  class TEXT,
  content TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE avizier_post_votes (
  post_id UUID NOT NULL REFERENCES avizier_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE avizier_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES avizier_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Migrate announcements → school scope
INSERT INTO avizier_posts (id, user_id, scope, highschool, graduation_year, class, content, expires_at, created_at, deleted_at)
SELECT id, user_id, 'school', highschool, NULL, NULL, content, expires_at, created_at, deleted_at
FROM announcements;

-- Migrate posts → class scope (join profiles for class metadata)
INSERT INTO avizier_posts (id, user_id, scope, highschool, graduation_year, class, content, expires_at, created_at, deleted_at)
SELECT p.id, p.user_id, 'class', pr.highschool, pr.graduation_year, pr.class, p.content, NULL, p.created_at, p.deleted_at
FROM posts p JOIN profiles pr ON pr.id = p.user_id
WHERE pr.highschool IS NOT NULL AND pr.class IS NOT NULL;

-- Migrate votes
INSERT INTO avizier_post_votes (post_id, user_id, vote)
SELECT announcement_id, user_id, vote FROM announcement_votes;
INSERT INTO avizier_post_votes (post_id, user_id, vote)
SELECT post_id, user_id, vote FROM post_votes;

-- Migrate comments
INSERT INTO avizier_post_comments (id, post_id, user_id, content, created_at, deleted_at)
SELECT id, announcement_id, user_id, content, created_at, deleted_at FROM announcement_comments;
INSERT INTO avizier_post_comments (id, post_id, user_id, content, created_at, deleted_at)
SELECT id, post_id, user_id, content, created_at, deleted_at FROM comments;

-- Indexes
CREATE INDEX avizier_posts_school ON avizier_posts (highschool, scope, deleted_at);
CREATE INDEX avizier_posts_promotion ON avizier_posts (highschool, graduation_year, scope, deleted_at);
CREATE INDEX avizier_posts_class ON avizier_posts (highschool, graduation_year, class, scope, deleted_at);

-- RLS
ALTER TABLE avizier_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE avizier_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avizier_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read" ON avizier_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert" ON avizier_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON avizier_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "read" ON avizier_post_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "all" ON avizier_post_votes FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "read" ON avizier_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert" ON avizier_post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON avizier_post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
