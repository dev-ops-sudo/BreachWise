-- Generated questions and user answers for pre-generation flow

create table if not exists public.generated_questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  scenario_id text,
  question_number integer,
  question text,
  context text,
  options jsonb,
  nist_phase text,
  status text default 'ready',
  created_at timestamptz default now()
);

create table if not exists public.user_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  scenario_id text,
  question_number integer,
  question text,
  selected_option text,
  is_correct boolean,
  created_at timestamptz default now()
);

alter table public.generated_questions enable row level security;
alter table public.user_answers enable row level security;

create policy "Users manage own questions"
  on public.generated_questions for all
  using (auth.uid() = user_id);

create policy "Users manage own answers"
  on public.user_answers for all
  using (auth.uid() = user_id);
