-- AI War Room Tables for BreachWise
-- Run this in Supabase Dashboard → SQL Editor after schema.sql

-- War room sessions (each time user enters)
create table if not exists public.war_room_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  scenario_context text not null, -- The attack/scenario details
  total_questions integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  unique(user_id, training_session_id)
);

alter table public.war_room_sessions enable row level security;

create policy "Users can view own war room sessions"
  on public.war_room_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own war room sessions"
  on public.war_room_sessions for insert
  with check (auth.uid() = user_id);

-- Generated questions for each war room session
create table if not exists public.war_room_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  correct_answer text not null, -- Expected answer from AI
  nist_phase text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  topic text not null, -- Category like 'incident-response', 'forensics', etc.
  created_at timestamptz not null default now(),
  unique(session_id, question_number)
);

alter table public.war_room_questions enable row level security;

create policy "Users can view own questions"
  on public.war_room_questions for select
  using (auth.uid() in (
    select user_id from public.war_room_sessions where id = session_id
  ));

-- User answers during war room
create table if not exists public.war_room_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  question_id uuid not null references public.war_room_questions (id) on delete cascade,
  user_answer text not null,
  answer_time_seconds integer not null, -- How long user took to answer
  is_correct boolean not null,
  confidence_score numeric not null default 0.5 check (confidence_score >= 0 and confidence_score <= 1),
  ai_feedback text, -- AI explanation of the answer
  answered_at timestamptz not null default now()
);

alter table public.war_room_answers enable row level security;

create policy "Users can view own answers"
  on public.war_room_answers for select
  using (auth.uid() in (
    select user_id from public.war_room_sessions where id = session_id
  ));

create policy "Users can insert own answers"
  on public.war_room_answers for insert
  with check (auth.uid() in (
    select user_id from public.war_room_sessions where id = session_id
  ));

-- War room rankings (final analysis after session)
create table if not exists public.war_room_rankings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  total_score integer not null,
  accuracy_percentage numeric not null,
  speed_score integer not null, -- Based on answer times
  overall_rank text not null, -- Rank like 'Expert', 'Advanced', 'Intermediate', 'Beginner'
  ranking_analysis text not null, -- AI-generated analysis of performance
  strengths text[], -- Array of strong topics
  weaknesses text[], -- Array of weak topics
  recommendations text, -- AI recommendations for improvement
  created_at timestamptz not null default now(),
  unique(session_id)
);

alter table public.war_room_rankings enable row level security;

create policy "Users can view own rankings"
  on public.war_room_rankings for select
  using (auth.uid() = user_id);

-- AI guidance chat messages during war room
create table if not exists public.war_room_ai_chats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null check (message_type in ('user_question', 'ai_guidance', 'ai_solution')),
  user_message text, -- User's question to AI
  ai_response text not null, -- AI's guidance/solution
  context_question_id uuid references public.war_room_questions (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.war_room_ai_chats enable row level security;

create policy "Users can view own chat history"
  on public.war_room_ai_chats for select
  using (auth.uid() = user_id);

create policy "Users can insert chat messages"
  on public.war_room_ai_chats for insert
  with check (auth.uid() = user_id);

-- Pre-generated questions for logged-in users
create table if not exists public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  question_number integer not null,
  question text not null,
  context text,
  options jsonb not null,
  nist_phase text not null,
  status text not null default 'ready',
  session_id text,
  created_at timestamptz not null default now(),
  unique(user_id, scenario_id, question_number, session_id)
);

alter table public.generated_questions enable row level security;

create policy "Users can view own generated questions"
  on public.generated_questions for select
  using (auth.uid() = user_id);

create policy "Users can insert own generated questions"
  on public.generated_questions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own generated questions"
  on public.generated_questions for delete
  using (auth.uid() = user_id);

create policy "Users can update own generated questions"
  on public.generated_questions for update
  using (auth.uid() = user_id);

-- Stored user answers for final scenario reporting
create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  question_number integer not null,
  question text not null,
  selected_option text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

alter table public.user_answers enable row level security;

create policy "Users can view own answer history"
  on public.user_answers for select
  using (auth.uid() = user_id);

create policy "Users can insert own answer history"
  on public.user_answers for insert
  with check (auth.uid() = user_id);

-- Scenario-level results for completed training runs
create table if not exists public.scenario_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  scenario_title text not null,
  scores integer[] not null,
  overall_score integer not null,
  readiness_level text,
  strong_phases text[],
  weak_phases text[],
  summary text,
  top_recommendation text,
  suitable_for text,
  session_id text,
  completed_at timestamptz not null default now()
);

alter table public.scenario_results enable row level security;

create policy "Users can view own scenario results"
  on public.scenario_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own scenario results"
  on public.scenario_results for insert
  with check (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_war_room_sessions_user on public.war_room_sessions(user_id);
create index if not exists idx_war_room_sessions_training on public.war_room_sessions(training_session_id);
create index if not exists idx_war_room_questions_session on public.war_room_questions(session_id);
create index if not exists idx_war_room_answers_session on public.war_room_answers(session_id);
create index if not exists idx_war_room_answers_question on public.war_room_answers(question_id);
create index if not exists idx_war_room_rankings_user on public.war_room_rankings(user_id);
create index if not exists idx_war_room_ai_chats_session on public.war_room_ai_chats(session_id);
