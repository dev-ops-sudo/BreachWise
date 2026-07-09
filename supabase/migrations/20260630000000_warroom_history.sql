-- Safe: only alter if war_room_sessions exists (fresh DBs create it in a later migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'war_room_sessions'
  ) THEN
    ALTER TABLE public.war_room_sessions
      DROP CONSTRAINT IF EXISTS war_room_sessions_user_id_training_session_id_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'war_room_answers'
  ) THEN
    ALTER TABLE public.war_room_answers
      ADD COLUMN IF NOT EXISTS answer_mode text DEFAULT 'mcq';
    ALTER TABLE public.war_room_answers
      ADD COLUMN IF NOT EXISTS selected_option text;
  END IF;
END $$;
