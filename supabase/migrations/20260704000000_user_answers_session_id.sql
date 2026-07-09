ALTER TABLE public.user_answers
ADD COLUMN IF NOT EXISTS session_id text;

CREATE INDEX IF NOT EXISTS idx_user_answers_session
  ON public.user_answers (user_id, scenario_id, session_id);
