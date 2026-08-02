-- Admin tasks board: timestamps + ignored status

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS related_report_id uuid;

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS ignored_at timestamptz;

ALTER TABLE public.admin_tasks
  DROP CONSTRAINT IF EXISTS admin_tasks_status_check;

ALTER TABLE public.admin_tasks
  ADD CONSTRAINT admin_tasks_status_check
  CHECK (status IN ('open', 'in_progress', 'done', 'ignored', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_admin_tasks_related_report
  ON public.admin_tasks (related_report_id)
  WHERE related_report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tasks_completed_at
  ON public.admin_tasks (completed_at DESC)
  WHERE completed_at IS NOT NULL;
