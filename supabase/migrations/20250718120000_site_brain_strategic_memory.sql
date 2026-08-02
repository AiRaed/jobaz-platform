-- Site Brain strategic memory fields (safe additive migration)
-- Preserves existing rows; new columns default to empty and are filled from code defaults when blank.

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS user_value_proposition text NOT NULL DEFAULT '';

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS core_user_journey text NOT NULL DEFAULT '';

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS founder_admin_context text NOT NULL DEFAULT '';

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS current_launch_stage text NOT NULL DEFAULT '';

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS success_metrics text NOT NULL DEFAULT '';

ALTER TABLE public.site_brain_rules
  ADD COLUMN IF NOT EXISTS known_risks text NOT NULL DEFAULT '';
