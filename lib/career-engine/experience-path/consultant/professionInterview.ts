/**
 * Profession archetypes — drive adaptive interview + UK market reasoning
 * without hardcoding a full roadmap per profession.
 */

import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import { EXPERIENCE_INDUSTRY_QUESTION, EXPERIENCE_SPECIALISATION_QUESTION } from '../questions'
import {
  shouldAskExperienceQuestion,
  ukWorkExperienceQuestionText,
} from './interviewDedup'
import type { ExperienceIndustryId } from '../types'
import { parseExperienceSpecialisations } from './multiSelect'
import { generateDynamicInterviewQuestions } from './dynamicProfessionAnalysis'
import {
  INDUSTRY_SPEC_ARCHETYPE_OVERRIDES,
  NEW_SPECIALISATION_ARCHETYPE,
} from '../industries/newExperienceSectors'

export type ProfessionArchetype =
  | 'passenger_transport'
  | 'hgv_commercial'
  | 'delivery_driver'
  | 'regulated_health'
  | 'dental'
  | 'nursing'
  | 'software_engineering'
  | 'qa_testing'
  | 'data_tech'
  | 'trades_electrical'
  | 'trades_construction'
  | 'warehouse_logistics'
  | 'security_sia'
  | 'care_support'
  | 'hospitality_kitchen'
  | 'hospitality_foh'
  | 'finance_accounting'
  | 'sales_business'
  | 'office_admin'
  | 'manufacturing_engineering'
  | 'customer_service'
  | 'marketing_digital'
  | 'education_teaching'
  | 'hr_recruitment'
  | 'cleaning_facilities'
  | 'general'

export type ProfessionInterviewQuestion = CareerEngineQuestion & {
  /** Only ask when prior answer matches (e.g. experience_country=outside_uk) */
  when?: (answers: Record<string, string>) => boolean
  archetypes?: ProfessionArchetype[]
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  extra?: Partial<ProfessionInterviewQuestion>
): ProfessionInterviewQuestion {
  return { id, text, options, ...extra }
}

/** Maps specialisation id → archetype for reasoning */
export const SPECIALISATION_ARCHETYPE: Record<string, ProfessionArchetype> = {
  taxi_driver: 'passenger_transport',
  private_hire_driver: 'passenger_transport',
  bus_driver: 'passenger_transport',
  coach_driver: 'passenger_transport',
  chauffeur: 'passenger_transport',
  hgv_driver: 'hgv_commercial',
  logistics_driver: 'hgv_commercial',
  delivery_driver: 'delivery_driver',
  courier_driver: 'delivery_driver',
  van_driver: 'delivery_driver',
  dentist: 'dental',
  dental_nurse: 'dental',
  dental_hygienist: 'dental',
  nurse: 'nursing',
  pharmacist: 'regulated_health',
  physiotherapist: 'regulated_health',
  occupational_therapist: 'regulated_health',
  radiographer: 'regulated_health',
  social_worker: 'regulated_health',
  care_assistant: 'care_support',
  senior_care_worker: 'care_support',
  support_worker: 'care_support',
  healthcare_assistant: 'care_support',
  frontend_developer: 'software_engineering',
  backend_developer: 'software_engineering',
  full_stack_developer: 'software_engineering',
  mobile_developer: 'software_engineering',
  devops_engineer: 'software_engineering',
  cloud_engineer: 'software_engineering',
  network_engineer: 'software_engineering',
  system_administrator: 'software_engineering',
  it_support: 'software_engineering',
  qa_engineer: 'qa_testing',
  test_automation_engineer: 'qa_testing',
  data_analyst: 'data_tech',
  data_engineer: 'data_tech',
  cyber_security: 'data_tech',
  electrician: 'trades_electrical',
  maintenance_electrician: 'trades_electrical',
  industrial_electrician: 'trades_electrical',
  electrical_technician: 'trades_electrical',
  electronics_technician: 'trades_electrical',
  solar_installer: 'trades_electrical',
  hvac_technician: 'trades_electrical',
  appliance_engineer: 'trades_electrical',
  labourer: 'trades_construction',
  carpenter: 'trades_construction',
  plumber: 'trades_construction',
  bricklayer: 'trades_construction',
  painter: 'trades_construction',
  roofer: 'trades_construction',
  groundworker: 'trades_construction',
  site_supervisor: 'trades_construction',
  site_manager: 'trades_construction',
  quantity_surveyor: 'trades_construction',
  warehouse_operative: 'warehouse_logistics',
  picker_packer: 'warehouse_logistics',
  forklift_driver: 'warehouse_logistics',
  forklift_operator: 'warehouse_logistics',
  inventory_controller: 'warehouse_logistics',
  warehouse_supervisor: 'warehouse_logistics',
  logistics_coordinator: 'warehouse_logistics',
  dispatch_clerk: 'warehouse_logistics',
  supply_chain_assistant: 'warehouse_logistics',
  door_supervisor: 'security_sia',
  security_guard: 'security_sia',
  cctv_operator: 'security_sia',
  event_security: 'security_sia',
  close_protection: 'security_sia',
  security_supervisor: 'security_sia',
  control_room_operator: 'security_sia',
  kitchen_porter: 'hospitality_kitchen',
  commis_chef: 'hospitality_kitchen',
  chef_de_partie: 'hospitality_kitchen',
  sous_chef: 'hospitality_kitchen',
  head_chef: 'hospitality_kitchen',
  pastry_chef: 'hospitality_kitchen',
  catering_assistant: 'hospitality_kitchen',
  waiter: 'hospitality_foh',
  bartender: 'hospitality_foh',
  receptionist: 'hospitality_foh',
  hotel_receptionist: 'hospitality_foh',
  barista: 'hospitality_foh',
  restaurant_supervisor: 'hospitality_foh',
  hotel_duty_manager: 'hospitality_foh',
  concierge: 'hospitality_foh',
  bookkeeper: 'finance_accounting',
  accounts_assistant: 'finance_accounting',
  payroll_officer: 'finance_accounting',
  accounts_payable: 'finance_accounting',
  accounts_receivable: 'finance_accounting',
  assistant_accountant: 'finance_accounting',
  accountant: 'finance_accounting',
  senior_accountant: 'finance_accounting',
  management_accountant: 'finance_accounting',
  financial_accountant: 'finance_accounting',
  financial_analyst: 'finance_accounting',
  finance_business_partner: 'finance_accounting',
  finance_manager: 'finance_accounting',
  auditor: 'finance_accounting',
  tax_accountant: 'finance_accounting',
  credit_controller: 'finance_accounting',
  sales_assistant: 'sales_business',
  retail_sales: 'sales_business',
  account_manager: 'sales_business',
  business_development_executive: 'sales_business',
  sales_manager: 'sales_business',
  recruitment_consultant: 'sales_business',
  customer_success: 'sales_business',
  administrator: 'office_admin',
  personal_assistant: 'office_admin',
  executive_assistant: 'office_admin',
  office_manager: 'office_admin',
  hr_administrator: 'office_admin',
  payroll_administrator: 'office_admin',
  data_entry_clerk: 'office_admin',
  ...NEW_SPECIALISATION_ARCHETYPE,
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

/** Profession-specific interview blocks */
const ARCHETYPE_INTERVIEW: Record<ProfessionArchetype, ProfessionInterviewQuestion[]> = {
  passenger_transport: [
    q('phv_or_taxi', 'Are you targeting PHV (private hire) or Hackney taxi (black cab)?', [
      { value: 'phv', label: 'PHV / Private Hire' },
      { value: 'hackney', label: 'Hackney Carriage (black cab)' },
      { value: 'both', label: 'Open to both' },
    ]),
    q('employment_model', 'Self-employed or employed driver?', [
      { value: 'self_employed', label: 'Self-employed' },
      { value: 'employed', label: 'Employed by operator' },
      { value: 'both', label: 'Either' },
    ]),
    q('uk_driving_licence', 'Do you hold a valid UK driving licence?', YES_NO),
    q('council_licence', 'Do you already have a local authority taxi/PHV licence?', YES_NO),
    q('own_vehicle', 'Do you have your own vehicle (or access to one)?', YES_NO),
  ],
  hgv_commercial: [
    q('hgv_category', 'Which HGV category do you hold or need?', [
      { value: 'cat_c', label: 'Category C (rigid)' },
      { value: 'cat_ce', label: 'Category C+E (artic)' },
      { value: 'none', label: 'Not yet — need training' },
    ]),
    q('driver_cpc', 'Do you have a valid Driver CPC?', YES_NO),
    q('uk_driving_licence', 'Do you hold a UK driving licence?', YES_NO),
    q('adr_required', 'Do you need ADR (hazardous goods)?', [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: 'Not sure' },
    ]),
  ],
  delivery_driver: [
    q('uk_driving_licence', 'Do you hold a valid UK driving licence?', YES_NO),
    q('own_vehicle', 'Do you have your own van or car for deliveries?', YES_NO),
    q('delivery_platform', 'Preferred work type?', [
      { value: 'employed', label: 'Employed courier' },
      { value: 'gig', label: 'Gig platform (Amazon, etc.)' },
      { value: 'both', label: 'Either' },
    ]),
  ],
  dental: [
    q('gdc_registered', 'Are you registered with the GDC (General Dental Council)?', YES_NO),
    q('nhs_experience', 'Do you have NHS dental experience?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('nhs_experience', a),
    }),
    q('private_practice', 'Have you worked in private dental practice?', YES_NO),
    q('performer_number', 'Do you have an NHS Performer Number?', YES_NO),
    q('overseas_dental_qual', 'Was your dental qualification obtained outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_dental_qual', a),
    }),
  ],
  nursing: [
    q('nmc_registered', 'Do you have an active NMC PIN?', YES_NO),
    q('nhs_experience', 'Do you have NHS nursing experience?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('nhs_experience', a),
    }),
    q('overseas_nursing', 'Was your nursing qualification obtained outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_nursing', a),
    }),
  ],
  regulated_health: [
    q('uk_regulator_registered', 'Are you registered with the relevant UK regulator (HCPC, GPhC, etc.)?', YES_NO),
    q('nhs_experience', 'Do you have NHS experience in this role?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('nhs_experience', a),
    }),
    q('overseas_qualification', 'Was your professional qualification obtained outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_qualification', a),
    }),
  ],
  software_engineering: [
    q('dev_focus', 'Primary development focus?', [
      { value: 'backend', label: 'Backend' },
      { value: 'frontend', label: 'Frontend' },
      { value: 'fullstack', label: 'Full Stack' },
      { value: 'mobile', label: 'Mobile' },
    ]),
    q('primary_languages', 'Main languages you use professionally?', [
      { value: 'javascript_ts', label: 'JavaScript / TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java_csharp', label: 'Java / C#' },
      { value: 'other', label: 'Other' },
    ]),
    q('github_portfolio', 'Do you have a GitHub or live project portfolio?', YES_NO),
    q('cloud_experience', 'Commercial cloud experience (AWS, Azure, GCP)?', [
      { value: 'yes', label: 'Yes' },
      { value: 'some', label: 'Some exposure' },
      { value: 'no', label: 'No' },
    ]),
    q('commercial_experience', 'Have you shipped code in a commercial/production environment?', YES_NO),
  ],
  qa_testing: [
    q('testing_type', 'Primary testing experience?', [
      { value: 'manual', label: 'Manual QA' },
      { value: 'automation', label: 'Test automation' },
      { value: 'both', label: 'Both' },
    ]),
    q('github_portfolio', 'Do you have test automation examples on GitHub?', YES_NO),
    q('istqb', 'Do you hold ISTQB or similar certification?', YES_NO),
    q('tools_used', 'Which tools have you used?', [
      { value: 'selenium', label: 'Selenium / Cypress' },
      { value: 'postman', label: 'Postman / API testing' },
      { value: 'jmeter', label: 'JMeter / performance' },
      { value: 'other', label: 'Other' },
    ], { allowMultiple: true }),
  ],
  data_tech: [
    q('data_stack', 'Primary data stack?', [
      { value: 'sql_bi', label: 'SQL / BI / Excel' },
      { value: 'python_ml', label: 'Python / ML' },
      { value: 'engineering', label: 'Data engineering (ETL, pipelines)' },
    ]),
    q('portfolio_projects', 'Do you have portfolio projects (GitHub, dashboards)?', YES_NO),
    q('cloud_experience', 'Cloud or warehouse experience (Snowflake, BigQuery, AWS)?', YES_NO),
  ],
  trades_electrical: [
    q('ecs_card', 'Do you hold an ECS card?', YES_NO),
    q('edition_18', 'Have you passed 18th Edition Wiring Regulations?', YES_NO),
    q('nvq_level3', 'Do you hold NVQ Level 3 Electrical (or equivalent)?', YES_NO),
    q('niceic_registered', 'Are you NICEIC / NAPIT registered?', YES_NO),
    q('overseas_electrical', 'Was your electrical training completed outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_electrical', a),
    }),
  ],
  trades_construction: [
    q('cscs_card', 'Do you hold a CSCS card?', YES_NO),
    q('trade_qualification', 'Do you hold a UK trade NVQ or equivalent?', YES_NO),
    q('site_experience', 'Have you worked on UK construction sites?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('site_experience', a),
    }),
    q('gas_safe', 'Do you need Gas Safe registration (for gas work)?', YES_NO),
  ],
  warehouse_logistics: [
    q('forklift_licence', 'Do you hold a forklift licence (FLT)?', YES_NO),
    q('forklift_type', 'Which forklift types can you operate?', [
      { value: 'counterbalance', label: 'Counterbalance' },
      { value: 'reach', label: 'Reach truck' },
      { value: 'both', label: 'Both' },
      { value: 'none', label: 'None yet' },
    ], { allowMultiple: true }),
    q('picker_packer_exp', 'Experience as picker/packer?', YES_NO),
    q('wms_systems', 'Have you used WMS warehouse systems?', YES_NO),
  ],
  security_sia: [
    q('sia_licence', 'Do you hold a valid SIA licence?', YES_NO),
    q('sia_licence_type', 'Which SIA licences do you have or need?', [
      { value: 'door_supervisor', label: 'Door Supervisor' },
      { value: 'security_guard', label: 'Security Guard' },
      { value: 'cctv', label: 'CCTV (Public Space Surveillance)' },
      { value: 'close_protection', label: 'Close Protection' },
      { value: 'none', label: 'Not yet' },
    ], { allowMultiple: true }),
    q('dbs_clear', 'Do you have an enhanced DBS check?', YES_NO),
  ],
  care_support: [
    q('care_certificate', 'Have you completed the Care Certificate?', YES_NO),
    q('dbs_clear', 'Do you have an enhanced DBS check?', YES_NO),
    q('direct_care', 'Experience providing hands-on personal care?', YES_NO),
  ],
  hospitality_kitchen: [
    q('food_hygiene', 'Do you hold Food Hygiene Level 2 or above?', YES_NO),
    q('kitchen_level', 'Highest kitchen role held?', [
      { value: 'porter_commis', label: 'Porter / Commis' },
      { value: 'cdp', label: 'Chef de Partie' },
      { value: 'sous_head', label: 'Sous / Head Chef' },
    ]),
  ],
  hospitality_foh: [
    q('customer_service_years', 'Years of front-of-house customer service?', [
      { value: 'under_2', label: 'Under 2 years' },
      { value: '2_5', label: '2–5 years' },
      { value: '5_plus', label: '5+ years' },
    ]),
    q('personal_licence', 'Do you hold a personal licence (alcohol sales)?', YES_NO),
  ],
  finance_accounting: [
    q('accounting_body', 'Professional body membership or progress?', [
      { value: 'acca', label: 'ACCA' },
      { value: 'cima', label: 'CIMA' },
      { value: 'icaew', label: 'ICAEW' },
      { value: 'aat', label: 'AAT' },
      { value: 'none', label: 'None yet' },
    ]),
    q('sage_xero', 'Proficient with Sage, Xero, or QuickBooks?', YES_NO),
    q('overseas_accounting', 'Was your accounting qualification obtained outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_accounting', a),
    }),
  ],
  sales_business: [
    q('b2b_b2c', 'Primary sales experience?', [
      { value: 'b2b', label: 'B2B' },
      { value: 'b2c', label: 'B2C / Retail' },
      { value: 'both', label: 'Both' },
    ]),
    q('crm_experience', 'Experience with CRM systems (Salesforce, HubSpot)?', YES_NO),
  ],
  office_admin: [
    q('ms_office', 'Proficient with Microsoft Office / Google Workspace?', YES_NO),
    q('industry_preference', 'Preferred sector?', [
      { value: 'any', label: 'Any' },
      { value: 'corporate', label: 'Corporate / Professional services' },
      { value: 'public', label: 'Public sector / NHS' },
      { value: 'sme', label: 'SME / Startup' },
    ]),
  ],
  manufacturing_engineering: [],
  customer_service: [],
  marketing_digital: [],
  education_teaching: [],
  hr_recruitment: [],
  cleaning_facilities: [],
  general: [
    q('role_seniority', 'What level are you targeting in the UK?', [
      { value: 'same_level', label: 'Same level as my experience' },
      { value: 'step_up', label: 'One step up' },
      { value: 'entry', label: 'Entry / restart' },
    ]),
  ],
}

/** Universal questions — reordered in buildProfessionInterview; context first */
export const UNIVERSAL_EXPERIENCE_QUESTIONS: ProfessionInterviewQuestion[] = [
  q('years_experience', 'How many years of work experience do you have in this profession?', [
    { value: '1_2', label: '1–2 years' },
    { value: '3_5', label: '3–5 years' },
    { value: '6_10', label: '6–10 years' },
    { value: '10_plus', label: '10+ years' },
  ]),
  q('experience_country', 'Where did you gain most of this experience?', [
    { value: 'uk', label: 'United Kingdom' },
    { value: 'outside_uk', label: 'Outside the UK' },
  ]),
  q('english_level', 'What is your English level?', [
    { value: 'beginner', label: 'Beginner' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'good', label: 'Good' },
    { value: 'fluent', label: 'Fluent' },
  ]),
  q('open_to_certifications', 'Are you willing to complete UK licences or certifications if required?', YES_NO),
  q('preferred_location', 'Preferred location for job search', [
    { value: 'London', label: 'London' },
    { value: 'Manchester', label: 'Manchester' },
    { value: 'Birmingham', label: 'Birmingham' },
    { value: 'UK-wide', label: 'UK-wide' },
  ], { allowFreeText: true }),
]

const CONTEXT_QUESTION_IDS = new Set(['years_experience', 'experience_country'])
const TAIL_QUESTION_IDS = new Set(['english_level', 'open_to_certifications', 'preferred_location'])

function buildUkWorkFollowUp(answers: Record<string, string>): ProfessionInterviewQuestion | null {
  if (!shouldAskExperienceQuestion('uk_work_experience', answers)) return null
  return {
    id: 'uk_work_experience',
    text: ukWorkExperienceQuestionText(answers),
    options: YES_NO,
  }
}

function filterInterviewQuestions(
  questions: ProfessionInterviewQuestion[],
  answers: Record<string, string>
): CareerEngineQuestion[] {
  return questions
    .filter((question) => {
      if (!shouldAskExperienceQuestion(question.id, answers)) return false
      if (question.when && !question.when(answers)) return false
      return true
    })
    .map(({ when: _when, archetypes: _archetypes, ...question }) => question)
}

export function getProfessionArchetype(
  specialisationId: string,
  industryId?: ExperienceIndustryId
): ProfessionArchetype {
  if (industryId) {
    const override = INDUSTRY_SPEC_ARCHETYPE_OVERRIDES[`${industryId}:${specialisationId}`]
    if (override) return override
  }
  return SPECIALISATION_ARCHETYPE[specialisationId] ?? 'general'
}

export function buildProfessionInterview(
  answers: Record<string, string>
): CareerEngineQuestion[] {
  const specIds = parseExperienceSpecialisations(answers)
  const industryId = (answers.industry ?? 'other') as ExperienceIndustryId

  const contextQs = UNIVERSAL_EXPERIENCE_QUESTIONS.filter((q) => CONTEXT_QUESTION_IDS.has(q.id))
  const tailQs = UNIVERSAL_EXPERIENCE_QUESTIONS.filter((q) => TAIL_QUESTION_IDS.has(q.id))
  const ukWorkQ = buildUkWorkFollowUp(answers)

  const professionQs =
    specIds.length > 0
      ? generateDynamicInterviewQuestions(specIds, industryId, answers)
      : []

  return [
    ...filterInterviewQuestions(contextQs, answers),
    ...professionQs,
    ...(ukWorkQ ? [{ ...ukWorkQ, allowMultiple: false }] : []),
    ...filterInterviewQuestions(tailQs, answers),
  ]
}

export function resolveExperienceQuestionFlow(answers: Record<string, string>): CareerEngineQuestion[] {
  const industryQ: CareerEngineQuestion = {
    id: EXPERIENCE_INDUSTRY_QUESTION.id,
    text: EXPERIENCE_INDUSTRY_QUESTION.text,
    options: EXPERIENCE_INDUSTRY_QUESTION.options,
  }

  const specQ: CareerEngineQuestion = {
    id: EXPERIENCE_SPECIALISATION_QUESTION.id,
    text: EXPERIENCE_SPECIALISATION_QUESTION.text,
    options: [],
  }

  if (!answers.industry) return [industryQ, specQ]

  if (!answers.experience_specialisation) return [industryQ, specQ]

  return [industryQ, specQ, ...buildProfessionInterview(answers)]
}
