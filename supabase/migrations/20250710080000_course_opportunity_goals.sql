-- Career goals / journeys linked to course opportunities (many-to-many)

CREATE TABLE IF NOT EXISTS public.course_opportunity_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.course_opportunities(id) ON DELETE CASCADE,
  goal_key text NOT NULL,
  goal_label text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_opportunity_goals_opportunity
  ON public.course_opportunity_goals(opportunity_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_course_opportunity_goal_per_opportunity
  ON public.course_opportunity_goals (opportunity_id, goal_key);

ALTER TABLE public.course_opportunity_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_opportunity_goals_admin_all ON public.course_opportunity_goals;
CREATE POLICY course_opportunity_goals_admin_all ON public.course_opportunity_goals
  FOR ALL USING (public.is_jobaz_admin()) WITH CHECK (public.is_jobaz_admin());

NOTIFY pgrst, 'reload schema';
