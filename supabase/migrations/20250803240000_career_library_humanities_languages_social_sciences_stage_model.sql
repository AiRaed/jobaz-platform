-- =============================================================================
-- Career Knowledge Library — Humanities, Languages & Social Sciences stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression via support roles, graduate entry, practitioner careers in
-- culture/policy/languages, specialist depth, leadership and academic tracks.
-- Master’s / PhD mainly for university teaching and research — not automatic seniority.
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
  'humanities_languages_social_sciences_route',
  'Humanities, languages & social sciences route',
  'UK humanities, languages and social sciences progression via support roles, graduate entry, professional practice (culture, policy, languages, research support), experienced and senior specialism, leadership, executive/department head roles and academic/research careers. Master''s and PhD are not automatic seniority outside higher education and research.',
  true,
  130,
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
      'humanities_languages_social_sciences_route',
      'foundation_humanities_support',
      'Foundation / Humanities Support',
      'Library, archive, museum, research admin and language-support entry roles. Degree not required for many posts.',
      10
    ),
    (
      'humanities_languages_social_sciences_route',
      'graduate_academic_entry',
      'Graduate / Academic Entry',
      'Graduate schemes, research assistants, trainee analysts and first professional roles. Relevant degree commonly expected.',
      20
    ),
    (
      'humanities_languages_social_sciences_route',
      'professional_practitioner',
      'Professional Practitioner',
      'Competent practitioners in culture, policy, languages, heritage, communications or applied social research.',
      30
    ),
    (
      'humanities_languages_social_sciences_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with independent project ownership. Master''s may help some niches but is not automatic seniority.',
      40
    ),
    (
      'humanities_languages_social_sciences_route',
      'senior_specialist',
      'Senior Specialist',
      'Senior specialists and principal practitioners with mentoring and complex remit ownership.',
      50
    ),
    (
      'humanities_languages_social_sciences_route',
      'leadership',
      'Leadership',
      'Team and programme leadership in cultural, policy, language or research organisations. Future progression.',
      60
    ),
    (
      'humanities_languages_social_sciences_route',
      'executive_department_head',
      'Executive / Department Head',
      'Heads of department, directors of policy/culture programmes and equivalent. Future progression only.',
      70
    ),
    (
      'humanities_languages_social_sciences_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in humanities, languages and social sciences. PhD typically required for academic tracks.',
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
