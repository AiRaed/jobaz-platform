-- Anonymous Career Path clients must read back rows for profile upserts and engagement signals.
-- (Insert was allowed; SELECT was auth-only, so .select('id') after insert failed for guests.)

CREATE POLICY "Allow select anonymous ai career assessments"
  ON public.ai_career_assessments FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Allow select anonymous ai career events"
  ON public.ai_career_events FOR SELECT
  USING (user_id IS NULL);
