-- Add session_id column to scenario_results and generated_questions tables
ALTER TABLE public.scenario_results 
ADD COLUMN IF NOT EXISTS session_id text;

ALTER TABLE public.generated_questions 
ADD COLUMN IF NOT EXISTS session_id text;

-- Update generated_questions to set session_id to id for existing records
UPDATE public.generated_questions 
SET session_id = id::text 
WHERE session_id IS NULL;

-- Modify generated_questions unique constraint to include session_id
ALTER TABLE public.generated_questions 
DROP CONSTRAINT IF EXISTS generated_questions_user_scenario_qnum_key;

ALTER TABLE public.generated_questions 
ADD CONSTRAINT generated_questions_user_scenario_qnum_session_key 
UNIQUE (user_id, scenario_id, question_number, session_id);
