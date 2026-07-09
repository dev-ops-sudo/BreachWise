-- Align war room schema with application code (ai_warroom_schema.sql)
-- Tables are empty, so safe to drop and recreate.

drop table if exists public.war_room_answers cascade;
drop table if exists public.war_room_sessions cascade;

create table public.war_room_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  scenario_context text not null,
  total_questions integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'paused'))
);

alter table public.war_room_sessions enable row level security;

create policy "Users can view own war room sessions"
  on public.war_room_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own war room sessions"
  on public.war_room_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own war room sessions"
  on public.war_room_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.war_room_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  correct_answer text not null,
  nist_phase text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  topic text not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_number)
);

alter table public.war_room_questions enable row level security;

create policy "Users can view own questions"
  on public.war_room_questions for select
  to authenticated
  using (
    (select auth.uid()) in (
      select user_id from public.war_room_sessions where id = session_id
    )
  );

create policy "Users can insert own questions"
  on public.war_room_questions for insert
  to authenticated
  with check (
    (select auth.uid()) in (
      select user_id from public.war_room_sessions where id = session_id
    )
  );

create table public.war_room_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  question_id uuid references public.war_room_questions (id) on delete cascade,
  user_answer text not null,
  answer_time_seconds integer not null default 0,
  is_correct boolean not null default false,
  confidence_score numeric not null default 0.5 check (confidence_score >= 0 and confidence_score <= 1),
  ai_feedback text,
  answer_mode text default 'mcq',
  selected_option text,
  answered_at timestamptz not null default now()
);

alter table public.war_room_answers enable row level security;

create policy "Users can view own answers"
  on public.war_room_answers for select
  to authenticated
  using (
    (select auth.uid()) in (
      select user_id from public.war_room_sessions where id = session_id
    )
  );

create policy "Users can insert own answers"
  on public.war_room_answers for insert
  to authenticated
  with check (
    (select auth.uid()) in (
      select user_id from public.war_room_sessions where id = session_id
    )
  );

create table public.war_room_rankings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  total_score integer not null,
  accuracy_percentage numeric not null,
  speed_score integer not null default 0,
  overall_rank text not null,
  ranking_analysis text not null default '',
  strengths text[],
  weaknesses text[],
  recommendations text,
  created_at timestamptz not null default now(),
  unique (session_id)
);

alter table public.war_room_rankings enable row level security;

create policy "Users can view own rankings"
  on public.war_room_rankings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own rankings"
  on public.war_room_rankings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create table public.war_room_ai_chats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.war_room_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null check (message_type in ('user_question', 'ai_guidance', 'ai_solution')),
  user_message text,
  ai_response text not null,
  context_question_id uuid references public.war_room_questions (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.war_room_ai_chats enable row level security;

create policy "Users can view own chat history"
  on public.war_room_ai_chats for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert chat messages"
  on public.war_room_ai_chats for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Fix generated_questions upsert (on_conflict=user_id,scenario_id,question_number)
alter table public.generated_questions
  add constraint generated_questions_user_scenario_qnum_key
  unique (user_id, scenario_id, question_number);

-- Add missing scenario_results columns used by save-results API
alter table public.scenario_results
  add column if not exists summary text,
  add column if not exists top_recommendation text,
  add column if not exists suitable_for text;

-- Performance indexes
create index if not exists idx_war_room_sessions_user on public.war_room_sessions (user_id);
create index if not exists idx_war_room_sessions_training on public.war_room_sessions (training_session_id);
create index if not exists idx_war_room_questions_session on public.war_room_questions (session_id);
create index if not exists idx_war_room_answers_session on public.war_room_answers (session_id);
create index if not exists idx_war_room_rankings_user on public.war_room_rankings (user_id);
create index if not exists idx_war_room_ai_chats_session on public.war_room_ai_chats (session_id);
