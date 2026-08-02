-- Link admin tasks back to the AI report that suggested them

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS related_report_id uuid;

CREATE INDEX IF NOT EXISTS idx_admin_tasks_related_report
  ON public.admin_tasks (related_report_id)
  WHERE related_report_id IS NOT NULL;

COMMENT ON COLUMN public.admin_tasks.related_report_id IS
  'Optional link to admin_ai_reports.id when task was saved from a report action.';
