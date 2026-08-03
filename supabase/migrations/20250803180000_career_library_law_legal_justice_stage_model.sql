-- =============================================================================
-- Career Knowledge Library — Law, Legal & Justice stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression is qualification-driven: training, SQE/Bar/CILEx, practice rights,
-- experience, judicial appointment. Master’s/PhD are NOT automatic seniority.
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
  'law_legal_justice_route',
  'Law, legal & justice route',
  'UK law and justice progression via legal support, graduate/academic entry, qualified legal professionals (solicitor/barrister/CILEx), experienced and senior practice, partner/head roles, judicial/King''s Counsel pathways, executive legal leadership and academic/research careers. Master''s and PhD are not automatic progression.',
  true,
  100,
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
      'law_legal_justice_route',
      'foundation_legal_support',
      'Foundation / Legal Support',
      'Legal assistants, administrators, secretaries, court clerks and case support. Degree not required for many roles.',
      10
    ),
    (
      'law_legal_justice_route',
      'graduate_academic_entry',
      'Graduate / Academic Entry',
      'Graduate paralegals, trainee solicitors, pupil barristers and graduate legal researchers. LLB/GDL commonly expected; not yet fully qualified.',
      20
    ),
    (
      'law_legal_justice_route',
      'qualified_legal_professional',
      'Qualified Legal Professional',
      'Admitted solicitors, called barristers, Chartered Legal Executives and equivalent qualified legal advisers with practice rights where applicable.',
      30
    ),
    (
      'law_legal_justice_route',
      'experienced_lawyer',
      'Experienced Lawyer',
      'Post-qualification experience with substantial case ownership; not automatic from Master''s alone.',
      40
    ),
    (
      'law_legal_justice_route',
      'senior_lawyer_specialist',
      'Senior Lawyer / Specialist',
      'Senior practitioners and specialist counsel with deep practice-area expertise.',
      50
    ),
    (
      'law_legal_justice_route',
      'partner_head',
      'Partner / Head',
      'Partners, heads of practice and heads of legal teams. Future progression requiring substantial experience.',
      60
    ),
    (
      'law_legal_justice_route',
      'judicial_kings_counsel',
      'Judicial / King''s Counsel',
      'Judicial appointments, tribunal judiciary and King''s Counsel. Appointment-based; future progression.',
      70
    ),
    (
      'law_legal_justice_route',
      'executive_leadership',
      'Executive Leadership',
      'General Counsel, Directors of Legal Services and equivalent executive legal leadership.',
      80
    ),
    (
      'law_legal_justice_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in law. PhD typically required for academic tracks.',
      90
    )
) AS v(model_key, stage_key, label, description, sort_order)
  ON m.model_key = v.model_key
ON CONFLICT (stage_model_id, stage_key) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = true;
