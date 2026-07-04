-- BreachWise Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  total_score integer not null default 0,
  rank_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Training sessions (resume progress)
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attack_id text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  current_module text not null default 'Module 1 — Briefing',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'paused')),
  score integer not null default 0,
  started_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, attack_id)
);

alter table public.training_sessions enable row level security;

create policy "Users can view own sessions"
  on public.training_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.training_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.training_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.training_sessions for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Index for fast resume lookups
create index if not exists training_sessions_user_last_played_idx
  on public.training_sessions (user_id, last_played_at desc);
