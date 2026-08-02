-- Fix ai_user_profiles client access: grants + RLS aligned with anonymous Career Path saves.

GRANT SELECT, INSERT, UPDATE ON TABLE public.ai_user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ai_user_profiles TO authenticated;

DROP POLICY IF EXISTS "Allow insert ai user profiles" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "Select ai user profiles" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "Update ai user profiles" ON public.ai_user_profiles;

CREATE POLICY "ai_user_profiles_insert"
  ON public.ai_user_profiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL AND anonymous_id IS NOT NULL)
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

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
