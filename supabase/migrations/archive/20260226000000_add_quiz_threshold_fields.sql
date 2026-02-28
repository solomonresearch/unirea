ALTER TABLE quizzes
  ADD COLUMN reveal_threshold  integer NOT NULL DEFAULT 10,
  ADD COLUMN response_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN results_unlocked_at timestamptz,
  ADD COLUMN result_post_id    uuid,
  ADD COLUMN anonymous_mode    boolean NOT NULL DEFAULT false;
