-- =============================================================================
-- Career Knowledge Library — Healthcare & Medicine professional stage model
-- =============================================================================
-- Additive only. Does NOT modify Engineering (academic_level) or IT
-- (it_skill_experience) models or data.
-- Healthcare progression is driven by qualification, registration/licence,
-- clinical training and regulatory bodies — not Degree/Master's/PhD by default.
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
  'healthcare_professional_route',
  'Healthcare professional route',
  'UK healthcare progression by professional qualification, registration/licence, clinical practice, specialist and advanced practice, leadership, and academic/research where genuine. Master''s/PhD are not default seniority drivers.',
  true,
  60,
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
      'healthcare_professional_route',
      'qualification',
      'Qualification',
      'Pre-registration education and clinical training toward an approved professional qualification (student, trainee, apprentice pathways).',
      10
    ),
    (
      'healthcare_professional_route',
      'registration_licence',
      'Registration / Licence',
      'Newly qualified professionals obtaining or holding the required regulator registration or licence to practise.',
      20
    ),
    (
      'healthcare_professional_route',
      'practitioner',
      'Practitioner',
      'Registered practitioners delivering day-to-day clinical or professional care with appropriate supervision frameworks.',
      30
    ),
    (
      'healthcare_professional_route',
      'experienced',
      'Experienced',
      'Experienced practitioners with sustained clinical/professional experience and greater autonomous responsibility.',
      40
    ),
    (
      'healthcare_professional_route',
      'specialist',
      'Specialist',
      'Specialist practice, specialty training or focused clinical domains requiring additional training or credentials.',
      50
    ),
    (
      'healthcare_professional_route',
      'advanced_practice_consultant',
      'Advanced Practice / Consultant',
      'Advanced clinical practice, consultant practitioners, or equivalent senior autonomous clinical roles.',
      60
    ),
    (
      'healthcare_professional_route',
      'leadership',
      'Leadership',
      'Clinical and service leadership — team leads, matrons, service managers, directors of care pathways.',
      70
    ),
    (
      'healthcare_professional_route',
      'academic_research',
      'Academic / Research',
      'Genuine research, university teaching or clinical academic roles. Master''s/PhD may be relevant here but do not imply automatic clinical seniority.',
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
