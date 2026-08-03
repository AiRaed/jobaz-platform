-- =============================================================================
-- Career Knowledge Library — IT & Technology skill/experience stage model
-- =============================================================================
-- Additive only. Does NOT modify Engineering academic_level model or data.
-- IT careers use skill, portfolio, certification and commercial experience —
-- NOT Degree / Master's / PhD as the default progression model.
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
  'it_skill_experience',
  'IT skill & experience',
  'IT & Technology progression by practical skills, portfolio, certifications, commercial experience, technical depth and leadership responsibility. Academic/research is optional and used only where research careers genuinely exist. Degrees are not the default seniority driver.',
  true,
  50,
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
      'it_skill_experience',
      'entry_trainee',
      'Entry / Trainee',
      'Suitable for career starters, apprentices, support trainees and candidates with foundational skills. Portfolio, bootcamps or certifications may matter more than degrees.',
      10
    ),
    (
      'it_skill_experience',
      'junior',
      'Junior',
      'Usually 0–2 years experience. Degree may be useful but must not be mandatory unless genuinely required for the role.',
      20
    ),
    (
      'it_skill_experience',
      'practitioner',
      'Practitioner',
      'Independent delivery level. Usually 1–4 years experience; owns day-to-day delivery with limited supervision.',
      30
    ),
    (
      'it_skill_experience',
      'experienced',
      'Experienced',
      'Strong independent contributor. Usually 3–6 years experience; deeper specialisation and reliable ownership.',
      40
    ),
    (
      'it_skill_experience',
      'senior',
      'Senior',
      'Usually 5+ years experience with technical ownership and mentoring. Must not be assigned automatically because of a Master''s degree.',
      50
    ),
    (
      'it_skill_experience',
      'lead_principal',
      'Lead / Principal',
      'Requires substantial delivery experience, technical ownership and mentoring across a team or workstream.',
      60
    ),
    (
      'it_skill_experience',
      'architect_specialist',
      'Architect / Specialist',
      'Reserved for advanced technical depth — architecture, security, cloud, data, AI, infrastructure or platform specialism.',
      70
    ),
    (
      'it_skill_experience',
      'manager_head',
      'Manager / Head',
      'Requires people, delivery, budget, service or programme responsibility.',
      80
    ),
    (
      'it_skill_experience',
      'director_executive',
      'Director / Executive',
      'Future progression only. Requires extensive leadership experience across technology functions or large portfolios.',
      90
    ),
    (
      'it_skill_experience',
      'academic_research',
      'Academic / Research',
      'Use only for genuine research, university, advanced AI/ML, computer science, data science, computer vision or related research roles. Master''s or PhD may be relevant here, but must not imply automatic seniority.',
      100
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
