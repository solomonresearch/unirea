-- Fix quiz_responses table to match code expectations
-- The code inserts one row per question (question_id + option_id),
-- but the table currently uses a single jsonb `answers` column.

-- Step 1: Drop the old table and recreate with per-row structure
DROP TABLE IF EXISTS public.quiz_responses;

CREATE TABLE public.quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  option_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_responses_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE,
  CONSTRAINT quiz_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT quiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT quiz_responses_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.quiz_options(id) ON DELETE CASCADE
);

-- Index for fast lookups by quiz + user
CREATE INDEX idx_quiz_responses_quiz_user ON public.quiz_responses(quiz_id, user_id);

-- Step 2: Create the increment_quiz_response_count RPC function
-- (called after submitting answers)
CREATE OR REPLACE FUNCTION public.increment_quiz_response_count(quiz_id_input uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.quizzes
  SET response_count = response_count + 1
  WHERE id = quiz_id_input;
$$;

-- Step 3: Enable RLS on quiz_responses
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Users can read all responses (needed for stats)
CREATE POLICY "Anyone can read quiz responses"
  ON public.quiz_responses FOR SELECT
  USING (true);

-- Authenticated users can insert their own responses
CREATE POLICY "Users can insert own responses"
  ON public.quiz_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 4: RLS policies for other quiz tables (if missing)

-- quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Quiz creators can update own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = created_by);

-- quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can insert questions"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE id = quiz_id AND created_by = auth.uid()
    )
  );

-- quiz_options
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quiz options"
  ON public.quiz_options FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can insert options"
  ON public.quiz_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_questions q
      JOIN public.quizzes qz ON qz.id = q.quiz_id
      WHERE q.id = question_id AND qz.created_by = auth.uid()
    )
  );

-- quiz_peeks
ALTER TABLE public.quiz_peeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own peeks"
  ON public.quiz_peeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own peeks"
  ON public.quiz_peeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- notifications: RLS policies already exist, skipping
