-- =============================================================================
-- Career Knowledge Library — Career Roles eligibility model
-- =============================================================================
-- RUN IN SUPABASE SQL EDITOR (or via your usual migration apply path).
-- Incremental / non-destructive. Preserves existing roles (including 30 Civil
-- Engineering draft roles). Does NOT touch Career Assistant or assessment.
-- After apply, run:
--   npx tsx scripts/backfill-civil-engineering-role-eligibility.ts
-- =============================================================================

-- Academic stage link (education relevance ≠ automatic seniority)
ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS stage_id uuid
    REFERENCES public.career_library_stages (id) ON DELETE SET NULL;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS role_category text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS seniority_level text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS minimum_experience_years integer;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS experience_requirement_label text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS professional_registration_requirement text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS professional_membership_requirement text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS academic_requirement text;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS is_research_role boolean NOT NULL DEFAULT false;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS is_academic_role boolean NOT NULL DEFAULT false;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS is_regulated_or_restricted boolean NOT NULL DEFAULT false;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS eligibility_note text NOT NULL DEFAULT '';

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS priority integer;

ALTER TABLE public.career_library_roles
  ADD COLUMN IF NOT EXISTS fit_classification text;

-- Defaults for new rows
ALTER TABLE public.career_library_roles
  ALTER COLUMN role_category SET DEFAULT 'professional_practice';

ALTER TABLE public.career_library_roles
  ALTER COLUMN seniority_level SET DEFAULT 'entry';

ALTER TABLE public.career_library_roles
  ALTER COLUMN minimum_experience_years SET DEFAULT 0;

ALTER TABLE public.career_library_roles
  ALTER COLUMN experience_requirement_label SET DEFAULT 'No prior experience required';

ALTER TABLE public.career_library_roles
  ALTER COLUMN professional_registration_requirement SET DEFAULT 'none';

ALTER TABLE public.career_library_roles
  ALTER COLUMN professional_membership_requirement SET DEFAULT 'none';

ALTER TABLE public.career_library_roles
  ALTER COLUMN academic_requirement SET DEFAULT 'degree_relevant';

ALTER TABLE public.career_library_roles
  ALTER COLUMN fit_classification SET DEFAULT 'realistic_next';

-- Backfill non-null defaults for existing rows (keep Draft status)
UPDATE public.career_library_roles
SET
  role_category = COALESCE(NULLIF(btrim(role_category), ''), 'professional_practice'),
  seniority_level = COALESCE(NULLIF(btrim(seniority_level), ''), 'entry'),
  minimum_experience_years = COALESCE(minimum_experience_years, 0),
  experience_requirement_label = COALESCE(
    NULLIF(btrim(experience_requirement_label), ''),
    'Experience requirements to be confirmed'
  ),
  professional_registration_requirement = COALESCE(
    NULLIF(btrim(professional_registration_requirement), ''),
    'none'
  ),
  professional_membership_requirement = COALESCE(
    NULLIF(btrim(professional_membership_requirement), ''),
    'none'
  ),
  academic_requirement = COALESCE(
    NULLIF(btrim(academic_requirement), ''),
    'degree_relevant'
  ),
  eligibility_note = COALESCE(eligibility_note, ''),
  priority = COALESCE(priority, sort_order, 0),
  fit_classification = COALESCE(
    NULLIF(btrim(fit_classification), ''),
    'realistic_next'
  )
WHERE true;

-- Promote stage_id from metadata when present
UPDATE public.career_library_roles r
SET stage_id = (r.metadata->>'stage_id')::uuid
WHERE r.stage_id IS NULL
  AND r.metadata ? 'stage_id'
  AND (r.metadata->>'stage_id') ~* '^[0-9a-f-]{36}$'
  AND EXISTS (
    SELECT 1 FROM public.career_library_stages s
    WHERE s.id = (r.metadata->>'stage_id')::uuid
  );

ALTER TABLE public.career_library_roles
  ALTER COLUMN role_category SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN seniority_level SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN minimum_experience_years SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN experience_requirement_label SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN professional_registration_requirement SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN professional_membership_requirement SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN academic_requirement SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN priority SET NOT NULL;

ALTER TABLE public.career_library_roles
  ALTER COLUMN fit_classification SET NOT NULL;

-- Controlled value checks
ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_role_category_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_role_category_check CHECK (
    role_category IN (
      'graduate_entry',
      'professional_practice',
      'design',
      'site_delivery',
      'project_management',
      'technical_specialist',
      'research',
      'academic',
      'consultancy',
      'leadership'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_seniority_level_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_seniority_level_check CHECK (
    seniority_level IN (
      'entry',
      'early_career',
      'mid_level',
      'senior',
      'principal',
      'leadership',
      'academic_research'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_registration_req_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_registration_req_check CHECK (
    professional_registration_requirement IN (
      'none',
      'desirable',
      'commonly_expected',
      'required'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_membership_req_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_membership_req_check CHECK (
    professional_membership_requirement IN (
      'none',
      'desirable',
      'commonly_expected',
      'required'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_academic_requirement_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_academic_requirement_check CHECK (
    academic_requirement IN (
      'none',
      'degree_relevant',
      'masters_relevant',
      'phd_relevant',
      'accredited_degree_preferred'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_fit_classification_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_fit_classification_check CHECK (
    fit_classification IN (
      'immediate',
      'realistic_next',
      'future_progression',
      'academic_or_research'
    )
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_min_experience_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_min_experience_check CHECK (
    minimum_experience_years >= 0 AND minimum_experience_years <= 50
  );

ALTER TABLE public.career_library_roles
  DROP CONSTRAINT IF EXISTS career_library_roles_status_check;
ALTER TABLE public.career_library_roles
  ADD CONSTRAINT career_library_roles_status_check CHECK (
    status IN ('draft', 'approved', 'disabled')
  );

CREATE INDEX IF NOT EXISTS idx_career_library_roles_specialism_priority
  ON public.career_library_roles (specialism_id, priority, name);

CREATE INDEX IF NOT EXISTS idx_career_library_roles_stage
  ON public.career_library_roles (stage_id);

CREATE INDEX IF NOT EXISTS idx_career_library_roles_seniority
  ON public.career_library_roles (seniority_level, fit_classification);

CREATE INDEX IF NOT EXISTS idx_career_library_roles_status_active
  ON public.career_library_roles (status, active);

COMMENT ON COLUMN public.career_library_roles.stage_id IS
  'Academic/professional stage for which this role is educationally relevant — not automatic eligibility.';
COMMENT ON COLUMN public.career_library_roles.fit_classification IS
  'How the future report should present this role: immediate, realistic_next, future_progression, academic_or_research.';
COMMENT ON COLUMN public.career_library_roles.eligibility_note IS
  'Human-readable note that education relevance ≠ seniority or registration eligibility.';

COMMENT ON TABLE public.career_library_roles IS
  'Career Knowledge Library roles: academic stage = relevance; seniority/experience/registration = professional eligibility.';
