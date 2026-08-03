-- =============================================================================
-- Career Knowledge Library — Education & Teaching stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression via support roles, ITT/QTS/EYTS/PGCE pathways, classroom
-- experience, middle/senior leadership and executive headship.
-- Master’s / PhD are NOT automatic seniority (mainly HE/research).
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
  'education_teaching_route',
  'Education & teaching route',
  'UK education and teaching progression via education support, graduate/ITT entry (PGCE, QTS, EYTS), qualified teaching, experienced and senior classroom practice, school/college leadership, executive headship and academic/research careers. Master''s and PhD are not automatic seniority outside higher education and research tracks.',
  true,
  110,
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
      'education_teaching_route',
      'foundation_education_support',
      'Foundation / Education Support',
      'Teaching assistants, learning support, early years assistants and education administrators. Degree not required for many roles.',
      10
    ),
    (
      'education_teaching_route',
      'graduate_teacher_entry',
      'Graduate / Teacher Entry',
      'ITT trainees, PGCE students, unsalaried/salaried trainees and graduate teaching assistants. Working toward QTS/EYTS/QTLS where applicable — not yet fully qualified teachers.',
      20
    ),
    (
      'education_teaching_route',
      'qualified_teacher_practitioner',
      'Qualified Teacher / Practitioner',
      'Teachers with QTS, EYTS, QTLS or equivalent competent practitioners in FE/HE/adult education as applicable.',
      30
    ),
    (
      'education_teaching_route',
      'experienced_teacher',
      'Experienced Teacher',
      'Teachers with substantial classroom experience beyond NQT/ECT induction; not automatic from Master''s alone.',
      40
    ),
    (
      'education_teaching_route',
      'senior_teacher_specialist',
      'Senior Teacher / Specialist',
      'Lead practitioners, subject specialists, SENCO-level specialists and advanced classroom experts.',
      50
    ),
    (
      'education_teaching_route',
      'leadership_middle_senior',
      'Leadership (HoD / Assistant / Deputy Head)',
      'Heads of department/year, assistant heads and deputy heads. Future progression requiring leadership experience.',
      60
    ),
    (
      'education_teaching_route',
      'executive_leadership',
      'Executive Leadership (Headteacher / Principal)',
      'Headteachers, principals, executive heads and multi-academy trust education executives. Future progression only.',
      70
    ),
    (
      'education_teaching_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in education. PhD typically required for academic tracks.',
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
