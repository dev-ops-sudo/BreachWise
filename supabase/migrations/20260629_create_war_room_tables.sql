-- Create war_room_sessions table
create table if not exists public.war_room_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.war_room_answers (
  id uuid primary key default gen_random_uuid(),
  war_room_session_id uuid not null references public.war_room_sessions(id) on delete cascade,
  question_id uuid,
  answer_mode text default 'mcq',
  selected_option text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

alter table public.war_room_sessions enable row level security;
alter table public.war_room_answers enable row level security;

create policy "Users can view their own war room sessions"
  on public.war_room_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own war room sessions"
  on public.war_room_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own war room sessions"
  on public.war_room_sessions for update
  using (auth.uid() = user_id);

create policy "Users can view their own war room answers"
  on public.war_room_answers for select
  using (
    exists (
      select 1 from public.war_room_sessions s
      where s.id = war_room_session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert their own war room answers"
  on public.war_room_answers for insert
  with check (
    exists (
      select 1 from public.war_room_sessions s
      where s.id = war_room_session_id and s.user_id = auth.uid()
    )
  );
