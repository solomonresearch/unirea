CREATE TABLE quiz_peeks (
  quiz_id   uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id),
  peeked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quiz_id, user_id)
);

ALTER TABLE quiz_peeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_peeks_insert" ON quiz_peeks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_peeks_select" ON quiz_peeks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
