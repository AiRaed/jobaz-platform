-- Career Engine Path 1: Work in my Education — scalable knowledge base
-- Add new education fields by inserting rows; decision engine logic stays unchanged.

CREATE TABLE IF NOT EXISTS public.career_education_fields (
  id text PRIMARY KEY,
  label text NOT NULL,
  goal_role text NOT NULL,
  career_hub_path_id text NOT NULL DEFAULT 'office-admin',
  typical_jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
  graduate_jobs jsonb NOT NULL DEFAULT '[]'::jsonb,
  professional_registration jsonb NOT NULL DEFAULT '[]'::jsonb,
  qualification_recognition jsonb NOT NULL DEFAULT '{}'::jsonb,
  career_progression jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  professional_certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  essential_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_employers jsonb NOT NULL DEFAULT '[]'::jsonb,
  transferable_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  temporary_entry_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_education_fields_active ON public.career_education_fields(active);

ALTER TABLE public.career_education_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active education fields"
  ON public.career_education_fields FOR SELECT
  USING (active = true);

CREATE POLICY "Service role manage education fields"
  ON public.career_education_fields FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.career_education_fields IS
  'Structured knowledge for Career Engine Path 1 (Work in my Education). Runtime seed fallback in lib/career-engine/education-path/knowledge/seed.ts';
