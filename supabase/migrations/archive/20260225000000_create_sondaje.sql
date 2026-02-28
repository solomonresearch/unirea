create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_scope text not null check (target_scope in ('all', 'school', 'year', 'class')),
  target_highschool text,
  target_year integer,
  target_class text,
  active boolean not null default false,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  emoji text,
  order_index integer not null
);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  option_text text not null,
  emoji text,
  order_index integer not null
);

create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  user_id uuid not null references auth.users(id),
  answers jsonb not null,
  completed_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);

-- RLS
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_responses enable row level security;

-- quizzes: authenticated users can read; admin/moderator can insert/update
create policy "quizzes_select" on quizzes
  for select to authenticated using (true);

create policy "quizzes_insert" on quizzes
  for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

create policy "quizzes_update" on quizzes
  for update to authenticated
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- quiz_questions: authenticated users can read; admin/moderator can insert
create policy "quiz_questions_select" on quiz_questions
  for select to authenticated using (true);

create policy "quiz_questions_insert" on quiz_questions
  for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- quiz_options: authenticated users can read; admin/moderator can insert
create policy "quiz_options_select" on quiz_options
  for select to authenticated using (true);

create policy "quiz_options_insert" on quiz_options
  for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );

-- quiz_responses: users can insert their own; users read their own, admins read all
create policy "quiz_responses_insert" on quiz_responses
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "quiz_responses_select" on quiz_responses
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'moderator')
    )
  );
