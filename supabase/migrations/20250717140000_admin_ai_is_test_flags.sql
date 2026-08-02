-- Admin AI metrics hygiene: optional is_test flags
-- Table name in JobAZ is ai_career_assessments (not career_assessments).
-- site_events does not exist; flag ai_career_events instead.

ALTER TABLE public.ai_career_assessments
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ai_career_assessments_is_test
  ON public.ai_career_assessments (is_test)
  WHERE is_test = true;

ALTER TABLE public.ai_career_events
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ai_career_events_is_test
  ON public.ai_career_events (is_test)
  WHERE is_test = true;

COMMENT ON COLUMN public.ai_career_assessments.is_test IS
  'Admin AI: mark demo/dev assessment rows so metrics can exclude them.';
COMMENT ON COLUMN public.ai_career_events.is_test IS
  'Admin AI: mark demo/dev event rows so metrics can exclude them.';
