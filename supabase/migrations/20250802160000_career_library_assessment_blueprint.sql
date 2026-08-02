-- =============================================================================
-- Career Knowledge Library — Assessment Blueprint + Report Rules foundation
-- =============================================================================
-- Incremental / non-destructive. Does NOT rewrite prior migrations.
-- Does NOT insert career fields, specialisms, roles, or courses.
-- Seeds only: Work in my Education question blueprint + system report rules.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Assessment questions
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key text NOT NULL,
  question_key text NOT NULL,
  label text NOT NULL,
  help_text text NOT NULL DEFAULT '',
  answer_type text NOT NULL DEFAULT 'single_select',
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_questions_route_key_unique UNIQUE (route_key, question_key),
  CONSTRAINT career_library_questions_answer_type_check CHECK (
    answer_type IN ('single_select', 'multi_select', 'boolean', 'text', 'number')
  ),
  CONSTRAINT career_library_questions_status_check CHECK (
    status IN ('draft', 'approved', 'disabled')
  ),
  CONSTRAINT career_library_questions_key_format CHECK (
    question_key ~ '^[a-z][a-z0-9_]*$'
  )
);

COMMENT ON TABLE public.career_library_questions IS
  'Career Knowledge Library: assessment blueprint questions (not wired to public Career Assistant yet).';

CREATE INDEX IF NOT EXISTS idx_career_library_questions_route_sort
  ON public.career_library_questions (route_key, sort_order, question_key);

CREATE INDEX IF NOT EXISTS idx_career_library_questions_status_active
  ON public.career_library_questions (status, active);

-- -----------------------------------------------------------------------------
-- 2) Question options (static only — dynamic sources resolved at runtime)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL
    REFERENCES public.career_library_questions (id) ON DELETE CASCADE,
  option_key text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_question_options_unique UNIQUE (question_id, option_key),
  CONSTRAINT career_library_question_options_key_format CHECK (
    option_key ~ '^[a-z][a-z0-9_]*$'
  )
);

CREATE INDEX IF NOT EXISTS idx_career_library_question_options_question_sort
  ON public.career_library_question_options (question_id, sort_order, label);

-- -----------------------------------------------------------------------------
-- 3) Question display conditions
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.career_library_question_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL
    REFERENCES public.career_library_questions (id) ON DELETE CASCADE,
  depends_on_question_key text NOT NULL,
  operator text NOT NULL DEFAULT 'equals',
  expected_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT career_library_question_conditions_operator_check CHECK (
    operator IN ('equals', 'not_equals', 'in', 'not_in', 'contains')
  )
);

CREATE INDEX IF NOT EXISTS idx_career_library_question_conditions_question
  ON public.career_library_question_conditions (question_id, active);

-- -----------------------------------------------------------------------------
-- 4) Extend report rules foundation
-- -----------------------------------------------------------------------------

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS route_key text;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS stage_id uuid
    REFERENCES public.career_library_stages (id) ON DELETE SET NULL;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS condition_group jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS outcome_type text;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS outcome_key text;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS outcome_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 100;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS stop_processing boolean NOT NULL DEFAULT false;

ALTER TABLE public.career_library_report_rules
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

UPDATE public.career_library_report_rules
SET name = COALESCE(NULLIF(btrim(name), ''), NULLIF(btrim(title), ''), rule_key)
WHERE name IS NULL OR btrim(name) = '';

UPDATE public.career_library_report_rules
SET route_key = 'work_in_my_education'
WHERE route_key IS NULL OR btrim(route_key) = '';

UPDATE public.career_library_report_rules
SET outcome_type = COALESCE(NULLIF(btrim(outcome_type), ''), 'add_report_note')
WHERE outcome_type IS NULL OR btrim(outcome_type) = '';

UPDATE public.career_library_report_rules
SET outcome_key = COALESCE(NULLIF(btrim(outcome_key), ''), rule_key)
WHERE outcome_key IS NULL OR btrim(outcome_key) = '';

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN name SET DEFAULT '';

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN route_key SET DEFAULT 'work_in_my_education';

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN route_key SET NOT NULL;

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN outcome_type SET DEFAULT 'add_report_note';

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN outcome_type SET NOT NULL;

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN outcome_key SET DEFAULT '';

ALTER TABLE public.career_library_report_rules
  ALTER COLUMN outcome_key SET NOT NULL;

ALTER TABLE public.career_library_report_rules
  DROP CONSTRAINT IF EXISTS career_library_report_rules_status_check;

ALTER TABLE public.career_library_report_rules
  ADD CONSTRAINT career_library_report_rules_status_check
  CHECK (status IN ('draft', 'approved', 'disabled'));

ALTER TABLE public.career_library_report_rules
  DROP CONSTRAINT IF EXISTS career_library_report_rules_outcome_type_check;

ALTER TABLE public.career_library_report_rules
  ADD CONSTRAINT career_library_report_rules_outcome_type_check
  CHECK (
    outcome_type IN (
      'load_stage_roles',
      'add_recognition_section',
      'add_english_section',
      'no_english_section',
      'enable_english_question',
      'exclude_learning_option',
      'recommend_learning_category',
      'add_report_note',
      'reorder_roles',
      'skip_english_question'
    )
  );

-- Prefer route+rule uniqueness for system/scoped rules
ALTER TABLE public.career_library_report_rules
  DROP CONSTRAINT IF EXISTS career_library_report_rules_key_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_career_library_report_rules_route_key
  ON public.career_library_report_rules (route_key, rule_key);

CREATE INDEX IF NOT EXISTS idx_career_library_report_rules_route_priority
  ON public.career_library_report_rules (route_key, priority, active);

CREATE INDEX IF NOT EXISTS idx_career_library_report_rules_specialism
  ON public.career_library_report_rules (specialism_id);

CREATE INDEX IF NOT EXISTS idx_career_library_report_rules_stage
  ON public.career_library_report_rules (stage_id);

-- -----------------------------------------------------------------------------
-- 5) updated_at triggers + RLS
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_career_library_questions_updated ON public.career_library_questions;
CREATE TRIGGER trg_career_library_questions_updated
  BEFORE UPDATE ON public.career_library_questions
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_question_options_updated
  ON public.career_library_question_options;
CREATE TRIGGER trg_career_library_question_options_updated
  BEFORE UPDATE ON public.career_library_question_options
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

DROP TRIGGER IF EXISTS trg_career_library_question_conditions_updated
  ON public.career_library_question_conditions;
CREATE TRIGGER trg_career_library_question_conditions_updated
  BEFORE UPDATE ON public.career_library_question_conditions
  FOR EACH ROW EXECUTE FUNCTION public.career_library_set_updated_at();

ALTER TABLE public.career_library_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_library_question_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS career_library_questions_admin_all ON public.career_library_questions;
CREATE POLICY career_library_questions_admin_all
  ON public.career_library_questions
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_question_options_admin_all
  ON public.career_library_question_options;
CREATE POLICY career_library_question_options_admin_all
  ON public.career_library_question_options
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS career_library_question_conditions_admin_all
  ON public.career_library_question_conditions;
CREATE POLICY career_library_question_conditions_admin_all
  ON public.career_library_question_conditions
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

-- -----------------------------------------------------------------------------
-- 6) Seed Work in my Education blueprint (questions only — no careers)
-- -----------------------------------------------------------------------------

INSERT INTO public.career_library_questions (
  route_key, question_key, label, help_text, answer_type, required,
  sort_order, status, active, is_system, configuration
)
VALUES
  (
    'work_in_my_education',
    'study_field',
    'What did you study?',
    'Choose the career field that best matches your education.',
    'single_select',
    true,
    10,
    'approved',
    true,
    true,
    '{"option_source":{"type":"career_fields"}}'::jsonb
  ),
  (
    'work_in_my_education',
    'specialism',
    'Which specialism best matches your qualification?',
    'Options come from approved specialisms in the selected field.',
    'single_select',
    true,
    20,
    'approved',
    true,
    true,
    '{"option_source":{"type":"specialisms_by_field","filter_answer_key":"study_field"}}'::jsonb
  ),
  (
    'work_in_my_education',
    'qualification_stage',
    'What is your qualification or professional stage?',
    'Stages come from the stage model linked to the selected specialism.',
    'single_select',
    true,
    30,
    'approved',
    true,
    true,
    '{"option_source":{"type":"stages_by_specialism","filter_answer_key":"specialism"}}'::jsonb
  ),
  (
    'work_in_my_education',
    'qualification_country',
    'Was this qualification obtained in the UK?',
    'This controls recognition guidance and whether English level is asked.',
    'single_select',
    true,
    40,
    'approved',
    true,
    true,
    '{"option_source":{"type":"static"}}'::jsonb
  ),
  (
    'work_in_my_education',
    'english_level',
    'What is your English level?',
    'Shown only when the qualification was obtained outside the UK.',
    'single_select',
    true,
    50,
    'approved',
    true,
    true,
    '{"option_source":{"type":"static"}}'::jsonb
  ),
  (
    'work_in_my_education',
    'existing_learning',
    'Do you already have relevant courses, licences, software skills or memberships?',
    'Later this will load learning options for the selected specialism.',
    'multi_select',
    false,
    60,
    'approved',
    true,
    true,
    '{"option_source":{"type":"learning_options_by_specialism","filter_answer_key":"specialism"}}'::jsonb
  )
ON CONFLICT (route_key, question_key) DO UPDATE
SET
  label = EXCLUDED.label,
  help_text = EXCLUDED.help_text,
  answer_type = EXCLUDED.answer_type,
  required = EXCLUDED.required,
  sort_order = EXCLUDED.sort_order,
  configuration = EXCLUDED.configuration,
  is_system = true,
  status = 'approved',
  active = true;

-- Static options: qualification country
INSERT INTO public.career_library_question_options (
  question_id, option_key, label, value, sort_order, active
)
SELECT q.id, v.option_key, v.label, v.value, v.sort_order, true
FROM public.career_library_questions q
JOIN (
  VALUES
    ('uk', 'Yes — obtained in the UK', 'uk', 10),
    ('outside_uk', 'No — obtained outside the UK', 'outside_uk', 20)
) AS v(option_key, label, value, sort_order)
  ON true
WHERE q.route_key = 'work_in_my_education'
  AND q.question_key = 'qualification_country'
ON CONFLICT (question_id, option_key) DO NOTHING;

-- Static options: english level
INSERT INTO public.career_library_question_options (
  question_id, option_key, label, value, sort_order, active
)
SELECT q.id, v.option_key, v.label, v.value, v.sort_order, true
FROM public.career_library_questions q
JOIN (
  VALUES
    ('beginner', 'Beginner', 'beginner', 10),
    ('elementary', 'Elementary', 'elementary', 20),
    ('intermediate', 'Intermediate', 'intermediate', 30),
    ('upper_intermediate', 'Upper intermediate', 'upper_intermediate', 40),
    ('advanced', 'Advanced', 'advanced', 50)
) AS v(option_key, label, value, sort_order)
  ON true
WHERE q.route_key = 'work_in_my_education'
  AND q.question_key = 'english_level'
ON CONFLICT (question_id, option_key) DO NOTHING;

-- Display condition: english_level only when qualification_country = outside_uk
INSERT INTO public.career_library_question_conditions (
  question_id, depends_on_question_key, operator, expected_value, active
)
SELECT q.id, 'qualification_country', 'equals', '"outside_uk"'::jsonb, true
FROM public.career_library_questions q
WHERE q.route_key = 'work_in_my_education'
  AND q.question_key = 'english_level'
  AND NOT EXISTS (
    SELECT 1
    FROM public.career_library_question_conditions c
    WHERE c.question_id = q.id
      AND c.depends_on_question_key = 'qualification_country'
      AND c.operator = 'equals'
  );

-- -----------------------------------------------------------------------------
-- 7) Seed system report rules (structured outcomes only)
-- -----------------------------------------------------------------------------

INSERT INTO public.career_library_report_rules (
  name,
  rule_key,
  route_key,
  specialism_id,
  stage_id,
  stage_model_id,
  title,
  condition_group,
  outcome_type,
  outcome_key,
  outcome_payload,
  priority,
  stop_processing,
  status,
  active,
  is_system,
  sort_order,
  rule_json
)
VALUES
  (
    'Add recognition section when qualification is outside UK',
    'outside_uk_add_recognition',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK → recognition section',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"}]}'::jsonb,
    'add_recognition_section',
    'qualification_recognition',
    '{}'::jsonb,
    10,
    false,
    'approved',
    true,
    true,
    10,
    '{}'::jsonb
  ),
  (
    'Skip English section when qualification is UK',
    'uk_no_english_section',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'UK qualification → no English section',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"uk"}]}'::jsonb,
    'no_english_section',
    'no_english_section',
    '{"reason":"qualification_obtained_in_uk"}'::jsonb,
    20,
    false,
    'approved',
    true,
    true,
    20,
    '{}'::jsonb
  ),
  (
    'English question eligible when qualification is outside UK',
    'outside_uk_enable_english_question',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK → English question eligible',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"}]}'::jsonb,
    'enable_english_question',
    'english_level',
    '{}'::jsonb,
    30,
    false,
    'approved',
    true,
    true,
    30,
    '{}'::jsonb
  ),
  (
    'English section — beginner / elementary',
    'english_beginner_elementary_section',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK + beginner/elementary English',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"},{"question_key":"english_level","operator":"in","expected_value":["beginner","elementary"]}]}'::jsonb,
    'add_english_section',
    'general_english_work_interview',
    '{"categories":["general_english","english_for_work","interview_communication"]}'::jsonb,
    40,
    false,
    'approved',
    true,
    true,
    40,
    '{}'::jsonb
  ),
  (
    'English section — intermediate',
    'english_intermediate_section',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK + intermediate English',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"},{"question_key":"english_level","operator":"equals","expected_value":"intermediate"}]}'::jsonb,
    'add_english_section',
    'professional_workplace_english',
    '{"categories":["english_for_work","professional_technical_english","interview_communication"]}'::jsonb,
    50,
    false,
    'approved',
    true,
    true,
    50,
    '{}'::jsonb
  ),
  (
    'English section — upper intermediate',
    'english_upper_intermediate_section',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK + upper intermediate English',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"},{"question_key":"english_level","operator":"equals","expected_value":"upper_intermediate"}]}'::jsonb,
    'add_english_section',
    'optional_professional_communication',
    '{"categories":["optional_professional_communication"]}'::jsonb,
    60,
    false,
    'approved',
    true,
    true,
    60,
    '{}'::jsonb
  ),
  (
    'No English development for advanced',
    'english_advanced_no_section',
    'work_in_my_education',
    NULL,
    NULL,
    NULL,
    'Outside UK + advanced English → no English section',
    '{"logic":"and","conditions":[{"question_key":"qualification_country","operator":"equals","expected_value":"outside_uk"},{"question_key":"english_level","operator":"equals","expected_value":"advanced"}]}'::jsonb,
    'no_english_section',
    'advanced_no_english_development',
    '{"reason":"english_level_advanced"}'::jsonb,
    70,
    false,
    'approved',
    true,
    true,
    70,
    '{}'::jsonb
  )
ON CONFLICT (route_key, rule_key) DO UPDATE
SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  condition_group = EXCLUDED.condition_group,
  outcome_type = EXCLUDED.outcome_type,
  outcome_key = EXCLUDED.outcome_key,
  outcome_payload = EXCLUDED.outcome_payload,
  priority = EXCLUDED.priority,
  status = 'approved',
  active = true,
  is_system = true;
