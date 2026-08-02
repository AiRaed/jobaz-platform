-- Session-scoped anonymous profile access for UK Career Assistant guests.

CREATE INDEX IF NOT EXISTS idx_ai_user_profiles_session_anon
  ON public.ai_user_profiles(session_id)
  WHERE user_id IS NULL;

DROP POLICY IF EXISTS "ai_user_profiles_select" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "ai_user_profiles_update" ON public.ai_user_profiles;

CREATE POLICY "ai_user_profiles_select"
  ON public.ai_user_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "ai_user_profiles_update"
  ON public.ai_user_profiles
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  )
  WITH CHECK (
    (user_id IS NULL AND anonymous_id IS NOT NULL)
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );
