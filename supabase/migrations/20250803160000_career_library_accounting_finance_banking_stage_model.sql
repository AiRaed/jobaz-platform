-- =============================================================================
-- Career Knowledge Library — Accounting, Finance & Banking stage model
-- =============================================================================
-- Additive only. Does NOT modify completed Career Fields.
-- Progression combines apprenticeships, technician routes, graduate schemes,
-- professional exams, regulated advice and executive pathways.
-- Degree / Master’s / MBA / PhD are NOT automatic seniority.
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
  'accounting_finance_banking_route',
  'Accounting, finance & banking route',
  'UK accounting, finance and banking progression via support, apprenticeship/technician, graduate trainee, qualified practitioner, specialist, management, head/director, regulated adviser/controlled function, executive/partner and academic/research pathways. Professional exams and experience often matter more than Master''s degrees. PhD mainly for academic/quantitative research.',
  true,
  90,
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
      'accounting_finance_banking_route',
      'foundation_finance_support',
      'Foundation / Finance Support',
      'School-leaver, college and support roles in accounts, payroll, credit and banking operations. Degree not required.',
      10
    ),
    (
      'accounting_finance_banking_route',
      'apprentice_technician',
      'Apprentice / Technician',
      'Apprenticeships and technician pathways (e.g. AAT, ATT, payroll technician, banking apprentice). Distinct from fully qualified chartered routes.',
      20
    ),
    (
      'accounting_finance_banking_route',
      'graduate_trainee',
      'Graduate / Trainee',
      'Graduate schemes and professional training contracts. Degree commonly expected for schemes; exams and experience still required for qualification.',
      30
    ),
    (
      'accounting_finance_banking_route',
      'qualified_practitioner',
      'Qualified Practitioner',
      'Professionally qualified or equivalent competent practitioners (e.g. ACA/ACCA/CIMA, auditors, tax advisers, analysts).',
      40
    ),
    (
      'accounting_finance_banking_route',
      'experienced_specialist',
      'Experienced Specialist',
      'Experienced specialists with deep technical or client responsibility beyond newly qualified level.',
      50
    ),
    (
      'accounting_finance_banking_route',
      'senior_manager',
      'Senior / Manager',
      'Managers with team, portfolio or substantial workstream responsibility. Experience required — not automatic from qualification alone.',
      60
    ),
    (
      'accounting_finance_banking_route',
      'head_director',
      'Head / Director',
      'Heads of function and finance/banking directors. Future progression requiring substantial leadership experience.',
      70
    ),
    (
      'accounting_finance_banking_route',
      'regulated_adviser_controlled',
      'Regulated Adviser / Controlled Function',
      'FCA-regulated advice and controlled functions (financial advice, mortgage advice, compliance oversight). Regulatory approval required.',
      80
    ),
    (
      'accounting_finance_banking_route',
      'executive_partner',
      'Executive / Partner',
      'CFO, partners, CRO/CIO and equivalent executive leadership. Future progression only.',
      90
    ),
    (
      'accounting_finance_banking_route',
      'academic_research',
      'Academic / Research',
      'Doctoral, research and university teaching in accounting, finance, banking or financial economics. PhD typically required for academic tracks.',
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
