-- Active My Plan source of truth: one active jaz_user_action_plans row per user.
-- Old plans remain as history (is_active = false / archived_at set).

ALTER TABLE public.jaz_user_action_plans
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.jaz_user_action_plans
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

ALTER TABLE public.jaz_user_action_plans
  ADD COLUMN IF NOT EXISTS source text NULL;

COMMENT ON COLUMN public.jaz_user_action_plans.is_active IS
  'Only one active plan per user. My Plan dashboard loads is_active = true.';
COMMENT ON COLUMN public.jaz_user_action_plans.archived_at IS
  'Set when a plan is replaced by a newer active plan.';
COMMENT ON COLUMN public.jaz_user_action_plans.source IS
  'career_assistant_selected_items | jaz_plan_generate | fallback | manual';

-- One-time cleanup: keep newest plan active per user; archive the rest.
WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC
    ) AS rn
  FROM public.jaz_user_action_plans
  WHERE user_id IS NOT NULL
)
UPDATE public.jaz_user_action_plans p
SET
  is_active = (r.rn = 1),
  archived_at = CASE
    WHEN r.rn = 1 THEN NULL
    ELSE COALESCE(p.archived_at, now())
  END,
  updated_at = p.updated_at
FROM ranked r
WHERE p.id = r.id;

-- Enforce at most one active plan per authenticated user.
DROP INDEX IF EXISTS jaz_user_action_plans_one_active_per_user_idx;
CREATE UNIQUE INDEX jaz_user_action_plans_one_active_per_user_idx
  ON public.jaz_user_action_plans (user_id)
  WHERE is_active = true AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS jaz_user_action_plans_user_active_idx
  ON public.jaz_user_action_plans (user_id, is_active, updated_at DESC);
