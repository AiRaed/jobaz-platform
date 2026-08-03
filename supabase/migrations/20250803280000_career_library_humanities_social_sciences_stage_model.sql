-- =============================================================================
-- Career Knowledge Library — Humanities & Social Sciences stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Education/academic stages are separate from professional practice stages.
-- Graduate entry does NOT require professional registration.
-- Master’s / PhD mainly for university teaching and research.
-- =============================================================================

INSERT INTO public.career_library_stage_models (
  model_key,
  name,
  description,
  active,
  sort_order,
  is_system
)
VALUES (
  'humanities_social_sciences_route',
  'Humanities & social sciences route',
  'UK humanities and social sciences progression via social support, graduate entry, professional practice, experienced and senior specialism, leadership, executive/director roles and academic/research careers. Graduate entry does not require professional registration. Master''s and PhD are not automatic seniority outside higher education and research.',
  true,
  150,
  true
)
ON CONFLICT (model_key) DO UPDATE
SET
  is_system = true,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = true,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.career_library_stages (
  stage_model_id,
  stage_key,
  label,
  description,
  sort_order,
  active
)
SELECT m.id, v.stage_key, v.label, v.description, v.sort_order, true
FROM public.career_library_stage_models m
JOIN (
  VALUES
    (
      'humanities_social_sciences_route',
      'foundation_social_support',
      'Foundation / Social Support',
      'Admin, research support, museum/archive and community programme support. Degree not required for many roles. No professional registration required.',
      10
    ),
    (
      'humanities_social_sciences_route',
      'graduate_social_sciences_entry',
      'Graduate / Social Sciences Entry',
      'Graduate schemes, research assistants and first professional roles. Relevant degree commonly expected. Professional registration not required at this stage.',
      20
    ),
    (
      'humanities_social_sciences_route',
      'professional_practitioner',
      'Professional Practitioner',
      'Competent practitioners in research, policy, heritage, culture or applied social science delivery.',
      30
    ),
    (
      'humanities_social_sciences_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with independent project ownership. Master''s may help niches but is not automatic seniority.',
      40
    ),
    (
      'humanities_social_sciences_route',
      'senior_specialist',
      'Senior Specialist',
      'Senior specialists mentoring juniors and owning complex remits.',
      50
    ),
    (
      'humanities_social_sciences_route',
      'leadership',
      'Leadership',
      'Team and programme leadership. Future progression requiring substantial experience.',
      60
    ),
    (
      'humanities_social_sciences_route',
      'executive_director',
      'Executive / Director',
      'Directors and heads of function. Future progression only.',
      70
    ),
    (
      'humanities_social_sciences_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching. PhD typically required for academic tracks. Separate from professional practice seniority.',
      80
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
