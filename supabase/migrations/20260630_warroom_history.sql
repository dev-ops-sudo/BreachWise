-- Allow multiple war room attempts per training session (history)
alter table public.war_room_sessions
  drop constraint if exists war_room_sessions_user_id_training_session_id_key;

-- Optional: track answer mode on stored answers
alter table public.war_room_answers
  add column if not exists answer_mode text default 'mcq';

alter table public.war_room_answers
  add column if not exists selected_option text;
