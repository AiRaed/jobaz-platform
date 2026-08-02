-- JobAZ Admin AI — reports, site brain rules, and affiliate/ops tasks

CREATE TABLE IF NOT EXISTS public.admin_ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  title text NOT NULL,
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_markdown text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('High', 'Medium', 'Low')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewed', 'actioned', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_ai_reports_type_created
  ON public.admin_ai_reports (report_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.site_brain_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL DEFAULT 1,
  mission text NOT NULL DEFAULT '',
  business_model text NOT NULL DEFAULT '',
  recommendation_rules text NOT NULL DEFAULT '',
  course_strategy text NOT NULL DEFAULT '',
  affiliate_rules text NOT NULL DEFAULT '',
  tone_of_voice text NOT NULL DEFAULT '',
  must_not_do text NOT NULL DEFAULT '',
  admin_priorities text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_brain_rules_one_active
  ON public.site_brain_rules (is_active)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'admin_ai',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('High', 'Medium', 'Low')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  related_route text,
  related_provider text,
  related_course text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_status_priority
  ON public.admin_tasks (status, priority, created_at DESC);

ALTER TABLE public.admin_ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_brain_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_ai_reports_admin_all ON public.admin_ai_reports;
CREATE POLICY admin_ai_reports_admin_all
  ON public.admin_ai_reports
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS site_brain_rules_admin_all ON public.site_brain_rules;
CREATE POLICY site_brain_rules_admin_all
  ON public.site_brain_rules
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS admin_tasks_admin_all ON public.admin_tasks;
CREATE POLICY admin_tasks_admin_all
  ON public.admin_tasks
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());
