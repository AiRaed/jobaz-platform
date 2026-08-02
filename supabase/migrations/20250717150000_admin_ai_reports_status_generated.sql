-- Allow admin_ai_reports.status = 'generated' for AI Manager reports

ALTER TABLE public.admin_ai_reports
  DROP CONSTRAINT IF EXISTS admin_ai_reports_status_check;

ALTER TABLE public.admin_ai_reports
  ADD CONSTRAINT admin_ai_reports_status_check
  CHECK (status IN ('draft', 'generated', 'reviewed', 'actioned', 'archived'));
