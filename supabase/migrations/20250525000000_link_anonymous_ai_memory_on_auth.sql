-- Let authenticated users claim anonymous AI Career Path data after signup/login.

GRANT UPDATE ON TABLE public.ai_career_assessments TO authenticated;
GRANT UPDATE ON TABLE public.ai_career_events TO authenticated;
GRANT DELETE ON TABLE public.ai_user_profiles TO authenticated;

CREATE POLICY "ai_career_assessments_link_user"
  ON public.ai_career_assessments
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_career_events_link_user"
  ON public.ai_career_events
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_user_profiles_delete_claimed"
  ON public.ai_user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id IS NULL);
