-- =============================================================================
-- Career Knowledge Library — Engineering professional progression stage model
-- =============================================================================
-- Additive. Replaces academic_level (Degree / Master's / PhD) as Engineering's
-- progression model. Qualifications remain role metadata attributes, not stages.
-- Does NOT delete academic_level (may still be referenced elsewhere).
-- Does NOT modify other Career Fields, Career Assistant, Assessment Blueprint,
-- Report Rules, Learning Options, or Qualification Recognition.
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
  'engineering_professional_route',
  'Engineering professional route',
  'UK engineering progression by responsibility and experience: foundation support, apprentice/technician, graduate engineer, chartered/professional practice, experienced engineer, engineering management, executive leadership and academic/research. Bachelor''s, Master''s, PhD and chartership are role attributes — not stage keys. Master''s/PhD are not automatic seniority.',
  true,
  40,
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
      'engineering_professional_route',
      'foundation_engineering_support',
      'Foundation / Engineering Support',
      'Technical assistants, CAD assistants, workshop and junior site support. Little or no experience; degree not required for many posts.',
      10
    ),
    (
      'engineering_professional_route',
      'apprentice_technician',
      'Apprentice / Technician',
      'Engineering apprentices and technicians (including laboratory, manufacturing, electrical, mechanical and civil technicians). Vocational and EngTech pathways.',
      20
    ),
    (
      'engineering_professional_route',
      'graduate_engineer',
      'Graduate Engineer',
      'Graduate, junior and newly qualified engineers. Typical entry after a relevant Bachelor''s degree; appointment competitive and not automatic from qualification alone.',
      30
    ),
    (
      'engineering_professional_route',
      'chartered_professional_engineer',
      'Chartered / Professional Engineer',
      'Practising professional engineers developing competency toward or holding IEng/CEng-equivalent practice. Design, project, site and production engineers.',
      40
    ),
    (
      'engineering_professional_route',
      'experienced_engineer',
      'Experienced Engineer',
      'Senior, lead, principal and specialist engineers with significant industry experience. Master''s may help niches but is not automatic seniority.',
      50
    ),
    (
      'engineering_professional_route',
      'engineering_management',
      'Engineering Management',
      'Engineering, technical, project and operations managers with people and delivery responsibility.',
      60
    ),
    (
      'engineering_professional_route',
      'executive_leadership',
      'Executive Leadership',
      'Head of Engineering, Engineering/Technical Director, Chief Engineer, VP Engineering, CTO where appropriate. Future progression only.',
      70
    ),
    (
      'engineering_professional_route',
      'academic_research',
      'Academic / Research',
      'Research engineers, fellows, lecturers, professors and doctoral research careers. PhD typically required for academic tracks — not industry seniority.',
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
