/**
 * Six new Work in my Experience industries — handcrafted UK career intelligence.
 */

import type { ExperienceIndustryId } from '../types'
import type { ExperienceSpecialisationOption } from '../experienceSpecialisations'
import type { ProfessionArchetype } from '../consultant/professionInterview'
import type { ExperienceSpecialisationBlueprint } from '../dynamic/types'
import type { UkFact } from '../consultant/ukProfessionFacts'

const CV = '/cv-builder-v2'

function req(
  id: string,
  title: string,
  description: string,
  opts: { href?: string; tier?: 'mandatory' | 'recommended' } = {}
) {
  return { id, title, description, tier: 'mandatory' as const, ...opts }
}

function cert(id: string, title: string, description: string, opts: { href?: string } = {}) {
  return { id, title, description, tier: 'recommended' as const, ...opts }
}

export const NEW_EXPERIENCE_INDUSTRY_IDS = [
  'manufacturing_engineering',
  'customer_service',
  'marketing_digital',
  'education_teaching',
  'hr_recruitment',
  'cleaning_facilities',
] as const satisfies readonly ExperienceIndustryId[]

export const NEW_EXPERIENCE_INDUSTRY_LABELS: Record<(typeof NEW_EXPERIENCE_INDUSTRY_IDS)[number], string> = {
  manufacturing_engineering: 'Manufacturing & Engineering',
  customer_service: 'Customer Service & Call Centre',
  marketing_digital: 'Marketing & Digital Marketing',
  education_teaching: 'Education & Teaching',
  hr_recruitment: 'HR & Recruitment',
  cleaning_facilities: 'Cleaning & Facilities',
}

export const NEW_EXPERIENCE_SPECIALISATIONS: Record<
  (typeof NEW_EXPERIENCE_INDUSTRY_IDS)[number],
  ExperienceSpecialisationOption[]
> = {
  manufacturing_engineering: [
    { value: 'production_operative', label: 'Production Operative' },
    { value: 'manufacturing_technician', label: 'Manufacturing Technician' },
    { value: 'mechanical_engineer', label: 'Mechanical Engineer' },
    { value: 'electrical_engineer', label: 'Electrical Engineer' },
    { value: 'maintenance_engineer', label: 'Maintenance Engineer' },
    { value: 'process_engineer', label: 'Process Engineer' },
    { value: 'quality_engineer', label: 'Quality Engineer' },
    { value: 'cnc_machinist', label: 'CNC Machinist' },
    { value: 'design_engineer', label: 'Design Engineer' },
    { value: 'production_supervisor', label: 'Production Supervisor' },
    { value: 'engineering_manager', label: 'Engineering Manager' },
    { value: 'other_manufacturing', label: 'Other', allowFreeText: true },
  ],
  customer_service: [
    { value: 'customer_service_advisor', label: 'Customer Service Advisor' },
    { value: 'customer_support_representative', label: 'Customer Support Representative' },
    { value: 'contact_centre_advisor', label: 'Contact Centre Advisor' },
    { value: 'call_centre_agent', label: 'Call Centre Agent' },
    { value: 'customer_experience_specialist', label: 'Customer Experience Specialist' },
    { value: 'complaints_handler', label: 'Complaints Handler' },
    { value: 'customer_service_team_leader', label: 'Team Leader' },
    { value: 'customer_service_manager', label: 'Customer Service Manager' },
    { value: 'other_customer_service', label: 'Other', allowFreeText: true },
  ],
  marketing_digital: [
    { value: 'marketing_assistant', label: 'Marketing Assistant' },
    { value: 'marketing_executive', label: 'Marketing Executive' },
    { value: 'digital_marketing_executive', label: 'Digital Marketing Executive' },
    { value: 'seo_specialist', label: 'SEO Specialist' },
    { value: 'ppc_specialist', label: 'PPC Specialist' },
    { value: 'social_media_manager', label: 'Social Media Manager' },
    { value: 'content_marketing_executive', label: 'Content Marketing Executive' },
    { value: 'email_marketing_specialist', label: 'Email Marketing Specialist' },
    { value: 'marketing_manager', label: 'Marketing Manager' },
    { value: 'brand_manager', label: 'Brand Manager' },
    { value: 'other_marketing', label: 'Other', allowFreeText: true },
  ],
  education_teaching: [
    { value: 'teaching_assistant', label: 'Teaching Assistant' },
    { value: 'sen_teaching_assistant', label: 'SEN Teaching Assistant' },
    { value: 'early_years_practitioner', label: 'Early Years Practitioner' },
    { value: 'primary_teacher', label: 'Primary Teacher' },
    { value: 'secondary_teacher', label: 'Secondary Teacher' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'tutor', label: 'Tutor' },
    { value: 'cover_supervisor', label: 'Cover Supervisor' },
    { value: 'head_teacher', label: 'Head Teacher' },
    { value: 'other_education_teaching', label: 'Other', allowFreeText: true },
  ],
  hr_recruitment: [
    { value: 'hr_administrator', label: 'HR Administrator' },
    { value: 'hr_assistant', label: 'HR Assistant' },
    { value: 'hr_advisor', label: 'HR Advisor' },
    { value: 'hr_business_partner', label: 'HR Business Partner' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'hr_recruitment_consultant', label: 'Recruitment Consultant' },
    { value: 'internal_recruiter', label: 'Internal Recruiter' },
    { value: 'talent_acquisition_specialist', label: 'Talent Acquisition Specialist' },
    { value: 'learning_development_officer', label: 'Learning & Development Officer' },
    { value: 'other_hr', label: 'Other', allowFreeText: true },
  ],
  cleaning_facilities: [
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'domestic_cleaner', label: 'Domestic Cleaner' },
    { value: 'commercial_cleaner', label: 'Commercial Cleaner' },
    { value: 'cleaning_operative', label: 'Cleaning Operative' },
    { value: 'school_cleaner', label: 'School Cleaner' },
    { value: 'window_cleaner', label: 'Window Cleaner' },
    { value: 'mobile_cleaner', label: 'Mobile Cleaner' },
    { value: 'caretaker', label: 'Caretaker' },
    { value: 'room_attendant', label: 'Room Attendant' },
    { value: 'housekeeper', label: 'Housekeeper' },
    { value: 'laundry_assistant', label: 'Laundry Assistant' },
    { value: 'kitchen_porter', label: 'Kitchen Porter' },
    { value: 'hospital_porter', label: 'Hospital Porter' },
    { value: 'environmental_services_assistant', label: 'Environmental Services Assistant' },
    { value: 'facilities_assistant', label: 'Facilities Assistant' },
    { value: 'cleaning_team_leader', label: 'Cleaning Team Leader' },
    { value: 'cleaning_supervisor', label: 'Cleaning Supervisor' },
    { value: 'housekeeping_supervisor', label: 'Housekeeping Supervisor' },
    { value: 'head_housekeeper', label: 'Head Housekeeper' },
    { value: 'facilities_coordinator', label: 'Facilities Coordinator' },
    { value: 'facilities_supervisor', label: 'Facilities Supervisor' },
    { value: 'estates_officer', label: 'Estates Officer' },
    { value: 'hygiene_operative', label: 'Hygiene Operative' },
    { value: 'facilities_manager', label: 'Facilities Manager' },
    { value: 'soft_services_manager', label: 'Soft Services Manager' },
    { value: 'estates_manager', label: 'Estates Manager' },
    { value: 'other_cleaning', label: 'Other', allowFreeText: true },
  ],
}

/** Industry-specific archetype when spec id is shared across industries */
export const INDUSTRY_SPEC_ARCHETYPE_OVERRIDES: Record<string, ProfessionArchetype> = {
  'hr_recruitment:hr_administrator': 'hr_recruitment',
}

export const NEW_SPECIALISATION_ARCHETYPE: Record<string, ProfessionArchetype> = {
  // Manufacturing & Engineering
  production_operative: 'manufacturing_engineering',
  manufacturing_technician: 'manufacturing_engineering',
  mechanical_engineer: 'manufacturing_engineering',
  electrical_engineer: 'manufacturing_engineering',
  maintenance_engineer: 'manufacturing_engineering',
  process_engineer: 'manufacturing_engineering',
  quality_engineer: 'manufacturing_engineering',
  cnc_machinist: 'manufacturing_engineering',
  design_engineer: 'manufacturing_engineering',
  production_supervisor: 'manufacturing_engineering',
  engineering_manager: 'manufacturing_engineering',
  // Customer Service
  customer_service_advisor: 'customer_service',
  customer_support_representative: 'customer_service',
  contact_centre_advisor: 'customer_service',
  call_centre_agent: 'customer_service',
  customer_experience_specialist: 'customer_service',
  complaints_handler: 'customer_service',
  customer_service_team_leader: 'customer_service',
  customer_service_manager: 'customer_service',
  // Marketing
  marketing_assistant: 'marketing_digital',
  marketing_executive: 'marketing_digital',
  digital_marketing_executive: 'marketing_digital',
  seo_specialist: 'marketing_digital',
  ppc_specialist: 'marketing_digital',
  social_media_manager: 'marketing_digital',
  content_marketing_executive: 'marketing_digital',
  email_marketing_specialist: 'marketing_digital',
  marketing_manager: 'marketing_digital',
  brand_manager: 'marketing_digital',
  // Education
  teaching_assistant: 'education_teaching',
  sen_teaching_assistant: 'education_teaching',
  early_years_practitioner: 'education_teaching',
  primary_teacher: 'education_teaching',
  secondary_teacher: 'education_teaching',
  lecturer: 'education_teaching',
  tutor: 'education_teaching',
  cover_supervisor: 'education_teaching',
  head_teacher: 'education_teaching',
  // HR
  hr_assistant: 'hr_recruitment',
  hr_advisor: 'hr_recruitment',
  hr_business_partner: 'hr_recruitment',
  hr_manager: 'hr_recruitment',
  hr_recruitment_consultant: 'hr_recruitment',
  internal_recruiter: 'hr_recruitment',
  talent_acquisition_specialist: 'hr_recruitment',
  learning_development_officer: 'hr_recruitment',
  // Cleaning & Facilities
  cleaner: 'cleaning_facilities',
  domestic_cleaner: 'cleaning_facilities',
  commercial_cleaner: 'cleaning_facilities',
  cleaning_operative: 'cleaning_facilities',
  school_cleaner: 'cleaning_facilities',
  window_cleaner: 'cleaning_facilities',
  mobile_cleaner: 'cleaning_facilities',
  caretaker: 'cleaning_facilities',
  room_attendant: 'cleaning_facilities',
  housekeeper: 'cleaning_facilities',
  laundry_assistant: 'cleaning_facilities',
  kitchen_porter: 'cleaning_facilities',
  hospital_porter: 'cleaning_facilities',
  environmental_services_assistant: 'cleaning_facilities',
  facilities_assistant: 'cleaning_facilities',
  cleaning_team_leader: 'cleaning_facilities',
  cleaning_supervisor: 'cleaning_facilities',
  housekeeping_supervisor: 'cleaning_facilities',
  head_housekeeper: 'cleaning_facilities',
  facilities_coordinator: 'cleaning_facilities',
  facilities_supervisor: 'cleaning_facilities',
  estates_officer: 'cleaning_facilities',
  hygiene_operative: 'cleaning_facilities',
  facilities_manager: 'cleaning_facilities',
  soft_services_manager: 'cleaning_facilities',
  estates_manager: 'cleaning_facilities',
}

export const NEW_INDUSTRY_CAREER_LADDERS: Record<(typeof NEW_EXPERIENCE_INDUSTRY_IDS)[number], string[]> = {
  manufacturing_engineering: [
    'Production Operative',
    'Skilled Technician',
    'Senior Technician',
    'Team Leader',
    'Production Supervisor',
    'Engineering Manager',
  ],
  customer_service: [
    'Customer Service Advisor',
    'Senior Advisor',
    'Team Leader',
    'Customer Service Supervisor',
    'Customer Service Manager',
    'Head of Customer Operations',
  ],
  marketing_digital: [
    'Marketing Assistant',
    'Marketing Executive',
    'Senior Marketing Executive',
    'Marketing Manager',
    'Senior Marketing Manager',
    'Marketing Director',
  ],
  education_teaching: [
    'Teaching Assistant',
    'Qualified Teacher',
    'Experienced Teacher',
    'Curriculum Lead',
    'Assistant Headteacher',
    'Headteacher',
  ],
  hr_recruitment: [
    'HR Administrator',
    'HR Advisor',
    'HR Business Partner',
    'Senior HR Business Partner',
    'HR Manager',
    'HR Director',
  ],
  cleaning_facilities: [
    'Cleaner',
    'Senior Cleaner',
    'Cleaning Supervisor',
    'Facilities Coordinator',
    'Facilities Manager',
    'Head of Facilities',
  ],
}

export const NEW_INDUSTRY_CAREER_HUB: Record<(typeof NEW_EXPERIENCE_INDUSTRY_IDS)[number], string> = {
  manufacturing_engineering: 'construction-trades',
  customer_service: 'office-admin',
  marketing_digital: 'digital-ai-beginner',
  education_teaching: 'teaching-support',
  hr_recruitment: 'office-admin',
  cleaning_facilities: 'security-facilities',
}

export const NEW_SPECIALISATION_CAREER_LADDERS: Record<string, string[]> = {
  production_operative: ['Production Operative', 'Manufacturing Technician', 'Senior Operative', 'Team Leader', 'Production Supervisor', 'Production Manager'],
  manufacturing_technician: ['Manufacturing Technician', 'Senior Technician', 'Maintenance Technician', 'Team Leader', 'Production Supervisor', 'Engineering Manager'],
  mechanical_engineer: ['Graduate Mechanical Engineer', 'Mechanical Engineer', 'Senior Mechanical Engineer', 'Lead Mechanical Engineer', 'Engineering Manager', 'Head of Engineering'],
  electrical_engineer: ['Electrical Engineer', 'Senior Electrical Engineer', 'Lead Electrical Engineer', 'Principal Engineer', 'Engineering Manager', 'Head of Engineering'],
  maintenance_engineer: ['Maintenance Engineer', 'Senior Maintenance Engineer', 'Reliability Engineer', 'Maintenance Team Leader', 'Maintenance Manager', 'Engineering Manager'],
  process_engineer: ['Process Engineer', 'Senior Process Engineer', 'Lead Process Engineer', 'Process Improvement Manager', 'Engineering Manager', 'Operations Director'],
  quality_engineer: ['Quality Engineer', 'Senior Quality Engineer', 'Quality Assurance Manager', 'Quality Manager', 'Head of Quality', 'Operations Director'],
  cnc_machinist: ['CNC Machinist', 'Senior CNC Machinist', 'CNC Programmer', 'CNC Team Leader', 'Production Supervisor', 'Manufacturing Manager'],
  design_engineer: ['Design Engineer', 'Senior Design Engineer', 'Lead Design Engineer', 'Principal Design Engineer', 'Engineering Manager', 'Head of Design'],
  production_supervisor: ['Production Supervisor', 'Senior Production Supervisor', 'Shift Manager', 'Production Manager', 'Operations Manager', 'Plant Manager'],
  engineering_manager: ['Engineering Manager', 'Senior Engineering Manager', 'Head of Engineering', 'Operations Director', 'Manufacturing Director', 'Plant Director'],

  customer_service_advisor: ['Customer Service Advisor', 'Senior Customer Service Advisor', 'Team Leader', 'Customer Service Supervisor', 'Customer Service Manager', 'Head of Customer Service'],
  customer_support_representative: ['Customer Support Representative', 'Senior Support Agent', 'Team Leader', 'Support Supervisor', 'Customer Service Manager', 'Head of Support'],
  contact_centre_advisor: ['Contact Centre Advisor', 'Senior Contact Centre Advisor', 'Team Leader', 'Contact Centre Supervisor', 'Contact Centre Manager', 'Head of Contact Centre'],
  call_centre_agent: ['Call Centre Agent', 'Senior Call Centre Agent', 'Team Leader', 'Call Centre Supervisor', 'Call Centre Manager', 'Head of Contact Centre'],
  customer_experience_specialist: ['Customer Experience Specialist', 'Senior CX Specialist', 'CX Team Lead', 'CX Manager', 'Head of Customer Experience', 'Director of Customer Experience'],
  complaints_handler: ['Complaints Handler', 'Senior Complaints Handler', 'Complaints Team Leader', 'Complaints Manager', 'Head of Complaints', 'Director of Customer Resolution'],
  customer_service_team_leader: ['Team Leader', 'Customer Service Supervisor', 'Customer Service Manager', 'Senior Customer Service Manager', 'Head of Customer Service', 'Director of Customer Operations'],
  customer_service_manager: ['Customer Service Manager', 'Senior Customer Service Manager', 'Head of Customer Service', 'Director of Customer Operations', 'VP Customer Experience', 'Chief Customer Officer'],

  marketing_assistant: ['Marketing Assistant', 'Marketing Executive', 'Senior Marketing Executive', 'Marketing Manager', 'Senior Marketing Manager', 'Marketing Director'],
  marketing_executive: ['Marketing Executive', 'Senior Marketing Executive', 'Marketing Manager', 'Senior Marketing Manager', 'Head of Marketing', 'Marketing Director'],
  digital_marketing_executive: ['Digital Marketing Executive', 'Senior Digital Marketing Executive', 'Digital Marketing Manager', 'Head of Digital', 'Marketing Director', 'Chief Marketing Officer'],
  seo_specialist: ['SEO Executive', 'SEO Specialist', 'Senior SEO Specialist', 'SEO Manager', 'Head of Organic Search', 'Director of Digital Marketing'],
  ppc_specialist: ['PPC Executive', 'PPC Specialist', 'Senior PPC Specialist', 'Paid Media Manager', 'Head of Performance Marketing', 'Director of Digital Marketing'],
  social_media_manager: ['Social Media Executive', 'Social Media Manager', 'Senior Social Media Manager', 'Head of Social', 'Brand Manager', 'Marketing Director'],
  content_marketing_executive: ['Content Marketing Executive', 'Senior Content Executive', 'Content Marketing Manager', 'Head of Content', 'Brand Manager', 'Marketing Director'],
  email_marketing_specialist: ['Email Marketing Executive', 'Email Marketing Specialist', 'CRM Manager', 'Head of CRM', 'Marketing Manager', 'Marketing Director'],
  marketing_manager: ['Marketing Manager', 'Senior Marketing Manager', 'Head of Marketing', 'Marketing Director', 'Commercial Director', 'Chief Marketing Officer'],
  brand_manager: ['Brand Executive', 'Brand Manager', 'Senior Brand Manager', 'Head of Brand', 'Marketing Director', 'Chief Marketing Officer'],

  teaching_assistant: ['Teaching Assistant', 'Senior Teaching Assistant', 'Higher Level Teaching Assistant', 'Cover Supervisor', 'Assistant Headteacher', 'Deputy Headteacher'],
  sen_teaching_assistant: ['SEN Teaching Assistant', 'Senior SEN TA', 'SEN Coordinator', 'Inclusion Lead', 'Assistant Headteacher', 'Deputy Headteacher'],
  early_years_practitioner: ['Early Years Practitioner', 'Senior Early Years Practitioner', 'Room Leader', 'Nursery Deputy Manager', 'Nursery Manager', 'Area Manager'],
  primary_teacher: ['Primary Teacher', 'Experienced Primary Teacher', 'Key Stage Lead', 'Assistant Headteacher', 'Deputy Headteacher', 'Headteacher'],
  secondary_teacher: ['Secondary Teacher', 'Experienced Teacher', 'Curriculum Lead', 'Head of Department', 'Assistant Headteacher', 'Headteacher'],
  lecturer: ['Lecturer', 'Senior Lecturer', 'Principal Lecturer', 'Course Leader', 'Head of Department', 'Dean'],
  tutor: ['Private Tutor', 'Experienced Tutor', 'Subject Specialist Tutor', 'Tutor Centre Lead', 'Education Centre Manager', 'Head of Tuition'],
  cover_supervisor: ['Cover Supervisor', 'Senior Cover Supervisor', 'Behaviour Support Lead', 'Assistant Headteacher', 'Deputy Headteacher', 'Headteacher'],
  head_teacher: ['Deputy Headteacher', 'Headteacher', 'Executive Headteacher', 'CEO of Multi-Academy Trust', 'Regional Education Director', 'National Education Leader'],

  hr_administrator: ['HR Administrator', 'Senior HR Administrator', 'HR Advisor', 'HR Business Partner', 'HR Manager', 'HR Director'],
  hr_assistant: ['HR Assistant', 'HR Administrator', 'HR Advisor', 'HR Business Partner', 'HR Manager', 'HR Director'],
  hr_advisor: ['HR Advisor', 'Senior HR Advisor', 'HR Business Partner', 'Senior HR Business Partner', 'HR Manager', 'HR Director'],
  hr_business_partner: ['HR Business Partner', 'Senior HR Business Partner', 'HR Manager', 'Head of HR', 'HR Director', 'Chief People Officer'],
  hr_manager: ['HR Manager', 'Senior HR Manager', 'Head of HR', 'HR Director', 'Chief People Officer', 'VP People'],
  hr_recruitment_consultant: ['Recruitment Consultant', 'Senior Recruitment Consultant', 'Team Leader', 'Branch Manager', 'Regional Manager', 'Director'],
  internal_recruiter: ['Internal Recruiter', 'Senior Internal Recruiter', 'Talent Acquisition Specialist', 'Talent Acquisition Manager', 'Head of Talent', 'Director of Talent'],
  talent_acquisition_specialist: ['Talent Acquisition Specialist', 'Senior Talent Acquisition Specialist', 'Talent Acquisition Manager', 'Head of Talent', 'Director of Talent', 'Chief People Officer'],
  learning_development_officer: ['L&D Officer', 'Senior L&D Officer', 'L&D Manager', 'Head of Learning & Development', 'Director of L&D', 'Chief Learning Officer'],

  cleaner: ['Cleaner', 'Senior Cleaner', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  domestic_cleaner: ['Domestic Cleaner', 'Senior Domestic Cleaner', 'Housekeeper', 'Head Housekeeper', 'Facilities Coordinator', 'Facilities Manager'],
  commercial_cleaner: ['Commercial Cleaner', 'Senior Cleaner', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  cleaning_operative: ['Cleaning Operative', 'Senior Cleaning Operative', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  school_cleaner: ['School Cleaner', 'Senior Cleaner', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  window_cleaner: ['Window Cleaner', 'Senior Window Cleaner', 'Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  mobile_cleaner: ['Mobile Cleaner', 'Senior Cleaner', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager'],
  caretaker: ['Caretaker', 'Senior Caretaker', 'Site Supervisor', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities'],
  room_attendant: ['Room Attendant', 'Senior Room Attendant', 'Housekeeper', 'Head Housekeeper', 'Facilities Coordinator', 'Facilities Manager'],
  housekeeper: ['Housekeeper', 'Senior Housekeeper', 'Head Housekeeper', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities'],
  laundry_assistant: ['Laundry Assistant', 'Senior Laundry Assistant', 'Laundry Supervisor', 'Housekeeping Supervisor', 'Facilities Manager', 'Head of Facilities'],
  kitchen_porter: ['Kitchen Porter', 'Senior Kitchen Porter', 'Head Porter', 'Kitchen Supervisor', 'Facilities Manager', 'Head of Facilities'],
  hospital_porter: ['Hospital Porter', 'Senior Porter', 'Porter Team Leader', 'Portering Supervisor', 'Facilities Manager', 'Head of Facilities'],
  environmental_services_assistant: ['Environmental Services Assistant', 'Cleaning Operative', 'Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Manager', 'Head of Facilities'],
  facilities_assistant: ['Facilities Assistant', 'Facilities Coordinator', 'Facilities Supervisor', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  cleaning_team_leader: ['Cleaning Team Leader', 'Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  cleaning_supervisor: ['Cleaning Supervisor', 'Senior Cleaning Supervisor', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  housekeeping_supervisor: ['Housekeeping Supervisor', 'Head Housekeeper', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  head_housekeeper: ['Head Housekeeper', 'Executive Housekeeper', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  facilities_coordinator: ['Facilities Coordinator', 'Facilities Supervisor', 'Facilities Manager', 'Senior Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  facilities_supervisor: ['Facilities Supervisor', 'Facilities Coordinator', 'Facilities Manager', 'Senior Facilities Manager', 'Head of Facilities', 'Director of Facilities'],
  estates_officer: ['Estates Officer', 'Senior Estates Officer', 'Facilities Coordinator', 'Facilities Manager', 'Estates Manager', 'Head of Estates'],
  hygiene_operative: ['Hygiene Operative', 'Senior Hygiene Operative', 'Hygiene Supervisor', 'Cleaning Supervisor', 'Facilities Manager', 'Head of Facilities'],
  facilities_manager: ['Facilities Manager', 'Senior Facilities Manager', 'Head of Facilities', 'Director of Facilities', 'VP Facilities', 'Chief Operating Officer'],
  soft_services_manager: ['Soft Services Manager', 'Senior Soft Services Manager', 'Facilities Manager', 'Head of Facilities', 'Director of Facilities', 'Chief Operating Officer'],
  estates_manager: ['Estates Officer', 'Estates Manager', 'Senior Estates Manager', 'Head of Estates', 'Director of Estates', 'Chief Operating Officer'],
}

const yes = (k: string) => (a: Record<string, string>) => a[k] === 'yes'

export const NEW_ARCHETYPE_FACTS: Record<string, UkFact[]> = {
  manufacturing_engineering: [
    { id: 'iosh', title: 'IOSH Working Safely', description: 'UK manufacturing employers expect health & safety awareness on every shop floor.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('iosh_working_safely') },
    { id: 'manual_handling', title: 'Manual Handling Training', description: 'Required for production and warehouse-adjacent manufacturing roles.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('manual_handling') },
    { id: 'lean', title: 'Lean / Continuous Improvement', description: '5S, Kaizen, or Six Sigma experience valued by UK manufacturers.', kind: 'skill', priority: 'recommended', satisfiedWhen: yes('lean_experience') },
    { id: 'engineering_qual', title: 'Engineering Qualification (HNC/HND/Degree)', description: 'Engineer roles expect recognised UK engineering qualifications or equivalent.', kind: 'certification', priority: 'mandatory', appliesWhen: (a) => /engineer|design|process|quality/.test(a.experience_specialisation ?? '') },
    { id: 'cnc', title: 'CNC Programming / Operation', description: 'CNC machinists must demonstrate machine setup, tooling, and programming competency.', kind: 'skill', priority: 'mandatory', appliesWhen: (a) => (a.experience_specialisation ?? '').includes('cnc_machinist') },
  ],
  customer_service: [
    { id: 'crm_cs', title: 'CRM / Contact Centre Systems', description: 'UK employers expect experience with Zendesk, Salesforce Service Cloud, or similar.', kind: 'skill', priority: 'mandatory', satisfiedWhen: (a) => Boolean(a.contact_centre_systems?.trim()) },
    { id: 'complaints', title: 'Complaints & FOS Awareness', description: 'Financial services and utilities roles require FCA complaints handling knowledge.', kind: 'skill', priority: 'recommended', appliesWhen: (a) => (a.experience_specialisation ?? '').includes('complaints') },
    { id: 'typing', title: 'Live Chat & Multi-Channel Support', description: 'Email, phone, and chat handling at target SLAs.', kind: 'skill', priority: 'mandatory' },
    { id: 'dbs_cs', title: 'Enhanced DBS Check', description: 'Required for customer service in finance, healthcare, and education sectors.', kind: 'compliance', priority: 'recommended', satisfiedWhen: yes('dbs_clear') },
  ],
  marketing_digital: [
    { id: 'portfolio_mkt', title: 'Campaign Portfolio / Case Studies', description: 'UK marketing hires on demonstrated campaign results — not job title alone.', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('marketing_portfolio') },
    { id: 'google_ads', title: 'Google Ads / Analytics', description: 'PPC and digital roles require hands-on Google Ads and GA4 evidence.', kind: 'certification', priority: 'mandatory', appliesWhen: (a) => /ppc|digital|seo|marketing/.test(a.experience_specialisation ?? ''), satisfiedWhen: yes('google_ads_cert') },
    { id: 'cim', title: 'CIM Qualification', description: 'Chartered Institute of Marketing — standard UK marketing professional route.', kind: 'certification', priority: 'recommended', satisfiedWhen: (a) => (a.professional_certifications ?? '').includes('cim') },
    { id: 'cms', title: 'CMS & Marketing Automation', description: 'WordPress, HubSpot, or Mailchimp experience expected for content and email roles.', kind: 'skill', priority: 'recommended', satisfiedWhen: (a) => Boolean(a.marketing_tools?.trim()) },
  ],
  education_teaching: [
    { id: 'dbs_edu', title: 'Enhanced DBS Check', description: 'Mandatory for all UK education roles working with children or vulnerable adults.', kind: 'compliance', priority: 'mandatory', satisfiedWhen: yes('dbs_clear') },
    { id: 'safeguarding', title: 'Safeguarding Training', description: 'Keeping Children Safe in Education — expected before starting in schools.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('safeguarding_training') },
    { id: 'qts', title: 'QTS (Qualified Teacher Status)', description: 'Required for qualified teacher roles in maintained schools in England.', kind: 'registration', priority: 'mandatory', appliesWhen: (a) => /primary_teacher|secondary_teacher|head_teacher/.test(a.experience_specialisation ?? ''), satisfiedWhen: yes('qts_held') },
    { id: 'trn', title: 'Teacher Reference Number (TRN)', description: 'Department for Education registration for teaching roles.', kind: 'registration', priority: 'mandatory', appliesWhen: (a) => /teacher|lecturer|cover_supervisor/.test(a.experience_specialisation ?? ''), satisfiedWhen: yes('trn_held') },
    { id: 'eyfs', title: 'Early Years Qualification (Level 3+)', description: 'EYFS statutory framework — Level 3 childcare qualification for early years roles.', kind: 'certification', priority: 'mandatory', appliesWhen: (a) => (a.experience_specialisation ?? '').includes('early_years'), satisfiedWhen: yes('eyfs_qualification') },
  ],
  hr_recruitment: [
    { id: 'cipd', title: 'CIPD Qualification', description: 'Chartered Institute of Personnel and Development — UK HR professional standard.', kind: 'certification', priority: 'mandatory', satisfiedWhen: (a) => (a.professional_certifications ?? '').includes('cipd') || (a.hr_professional_certifications ?? '').includes('cipd') },
    { id: 'hris', title: 'HRIS Systems Experience', description: 'Workday, SAP SuccessFactors, or CIPHR experience expected for HR roles.', kind: 'skill', priority: 'mandatory', satisfiedWhen: (a) => Boolean(a.hris_systems?.trim()) },
    { id: 'rtw', title: 'Right to Work Checks', description: 'UK employers require HR staff to conduct compliant right-to-work verification.', kind: 'compliance', priority: 'mandatory', satisfiedWhen: yes('rtw_checks') },
    { id: 'rec', title: 'REC / APSCo Membership', description: 'Recruitment consultants benefit from REC membership and compliance training.', kind: 'registration', priority: 'recommended', appliesWhen: (a) => /recruitment|recruiter|talent/.test(a.experience_specialisation ?? '') },
  ],
  cleaning_facilities: [
    { id: 'dbs_clean', title: 'Enhanced DBS Check', description: 'Often required for school, hospital, and care site cleaning contracts.', kind: 'compliance', priority: 'recommended', satisfiedWhen: yes('dbs_clear') },
    { id: 'coshh', title: 'COSHH Training', description: 'Control of Substances Hazardous to Health — mandatory for commercial cleaning.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('coshh_training') },
    { id: 'manual_handling_clean', title: 'Manual Handling', description: 'Required for cleaning operatives moving equipment and waste.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('manual_handling') },
    { id: 'bics', title: 'BICSc Cleaning Qualification', description: 'British Institute of Cleaning Science — UK industry standard for commercial cleaning.', kind: 'certification', priority: 'recommended', satisfiedWhen: yes('bics_qualification') },
    { id: 'iwfm', title: 'IWFM / Facilities Management', description: 'Institute of Workplace and Facilities Management — expected for facilities manager roles.', kind: 'certification', priority: 'mandatory', appliesWhen: (a) => /facilities_manager|facilities_coordinator/.test(a.experience_specialisation ?? ''), satisfiedWhen: yes('iwfm_qualification') },
  ],
}

export const NEW_ARCHETYPE_CAREER_LADDERS: Record<string, string[]> = {
  manufacturing_engineering: ['Production Operative', 'Skilled Technician', 'Senior Technician', 'Team Leader', 'Production Supervisor', 'Engineering Manager'],
  customer_service: ['Customer Service Advisor', 'Senior Advisor', 'Team Leader', 'Supervisor', 'Manager', 'Head of Customer Operations'],
  marketing_digital: ['Marketing Assistant', 'Marketing Executive', 'Senior Executive', 'Marketing Manager', 'Head of Marketing', 'Marketing Director'],
  education_teaching: ['Teaching Assistant', 'Qualified Teacher', 'Experienced Teacher', 'Curriculum Lead', 'Deputy Headteacher', 'Headteacher'],
  hr_recruitment: ['HR Administrator', 'HR Advisor', 'HR Business Partner', 'Senior HRBP', 'HR Manager', 'HR Director'],
  cleaning_facilities: ['Cleaner', 'Senior Cleaner', 'Supervisor', 'Facilities Coordinator', 'Facilities Manager', 'Head of Facilities'],
}

export const NEW_ARCHETYPE_EMPLOYER_EXPECTATIONS: Record<string, string[]> = {
  manufacturing_engineering: ['IOSH or equivalent health & safety', 'Production KPIs on CV (OEE, downtime, output)', 'Lean / continuous improvement examples'],
  customer_service: ['CRM system proficiency', 'CSAT / NPS / AHT metrics on CV', 'Multi-channel support experience'],
  marketing_digital: ['Campaign ROI and conversion metrics', 'Google Analytics / Ads certification', 'Portfolio of live campaigns'],
  education_teaching: ['Enhanced DBS on file', 'Safeguarding training current', 'QTS or relevant teaching qualification'],
  hr_recruitment: ['CIPD progress or membership', 'HRIS system experience', 'Employee relations case examples'],
  cleaning_facilities: ['COSHH and manual handling certificates', 'BICSc or equivalent cleaning qualification', 'Contract cleaning experience with KPIs'],
}

export const NEW_EXPERIENCE_BLUEPRINTS: Record<string, ExperienceSpecialisationBlueprint> = {
  production_operative: {
    match: 'production_operative',
    careerHubPathId: 'construction-trades',
    goals: { skilled: 'Production Operative', senior: 'Senior Operative', supervisor: 'Team Leader', manager: 'Production Supervisor' },
    requirements: [
      req('iosh', 'IOSH Working Safely', 'Health & safety induction standard for UK manufacturing floors.'),
      req('manual_handling', 'Manual Handling Certificate', 'Required for lifting and moving materials on production lines.'),
      cert('lean', 'Lean Manufacturing Awareness', '5S and continuous improvement valued by UK manufacturers.'),
    ],
    jobs: [
      { title: 'Production Operative', keyword: 'production operative', seniority: 'mid', salary: '£22k–£28k' },
      { title: 'Manufacturing Operative', keyword: 'manufacturing operative', seniority: 'mid', salary: '£22k–£28k' },
    ],
    skillsExpected: ['Production line operation', 'Quality checks', 'Health & safety compliance', 'Team communication'],
    fastestRoute: 'IOSH Working Safely → manual handling → production operative application',
    courses: [{ id: 'iosh', title: 'IOSH Working Safely', whyReasons: ['Expected on every UK factory floor.'], duration: '1 day', costLabel: 'Paid', pathId: 'construction-trades' }],
  },
  mechanical_engineer: {
    match: 'mechanical_engineer',
    careerHubPathId: 'construction-trades',
    goals: { skilled: 'Mechanical Engineer', senior: 'Senior Mechanical Engineer', supervisor: 'Lead Engineer', manager: 'Engineering Manager' },
    requirements: [
      req('eng_degree', 'Engineering Qualification (HNC/HND/Degree)', 'UK engineer roles require recognised engineering qualifications.'),
      cert('chartered', 'CEng / IMechE Membership', 'Chartered status differentiates senior mechanical engineers.'),
      cert('cad', 'CAD Proficiency (SolidWorks/AutoCAD)', 'Design and drafting competency expected at interview.'),
    ],
    jobs: [
      { title: 'Mechanical Engineer', keyword: 'mechanical engineer', seniority: 'mid', salary: '£32k–£45k' },
      { title: 'Senior Mechanical Engineer', keyword: 'senior mechanical engineer', seniority: 'senior', salary: '£40k–£55k' },
    ],
    skillsExpected: ['CAD design', 'FMEA / root cause analysis', 'Project engineering', 'BS/ISO standards'],
    fastestRoute: 'Engineering qualification → CAD portfolio → mechanical engineer applications',
  },
  cnc_machinist: {
    match: 'cnc_machinist',
    requirements: [
      req('cnc', 'CNC Setting & Operating', 'Machine setup, tooling, and offset adjustment competency.'),
      cert('programming', 'CNC Programming (G-code)', 'Unlocks higher-paid programmer machinist roles.'),
    ],
    jobs: [{ title: 'CNC Machinist', keyword: 'CNC machinist', seniority: 'mid', salary: '£26k–£36k' }],
    skillsExpected: ['CNC setting', 'Tooling', 'Quality inspection', 'Engineering drawings'],
    fastestRoute: 'CNC operative experience → programming course → CNC machinist roles',
  },
  customer_service_advisor: {
    match: 'customer_service_advisor',
    careerHubPathId: 'office-admin',
    goals: { skilled: 'Customer Service Advisor', senior: 'Senior Advisor', supervisor: 'Team Leader', manager: 'Customer Service Manager' },
    requirements: [
      req('crm', 'CRM / Ticketing System Experience', 'Zendesk, Salesforce Service Cloud, or similar.'),
      cert('complaints', 'Complaints Handling Training', 'FCA-regulated sectors require formal complaints procedures.'),
    ],
    jobs: [
      { title: 'Customer Service Advisor', keyword: 'customer service advisor', seniority: 'mid', salary: '£22k–£28k' },
      { title: 'Customer Support Advisor', keyword: 'customer support advisor', seniority: 'mid', salary: '£23k–£30k' },
    ],
    skillsExpected: ['Phone and email support', 'CRM systems', 'De-escalation', 'SLA adherence'],
    fastestRoute: 'CRM training → customer service advisor applications → team leader progression',
  },
  call_centre_agent: {
    match: 'call_centre_agent',
    requirements: [
      req('contact_centre', 'Contact Centre Systems', 'Avaya, Genesys, or cloud dialler experience.'),
      cert('typing', 'Live Chat & Multi-Channel', 'Chat, email, and phone at target AHT/CSAT.'),
    ],
    jobs: [{ title: 'Call Centre Agent', keyword: 'call centre agent', seniority: 'mid', salary: '£21k–£26k' }],
    skillsExpected: ['Inbound/outbound calls', 'Script adherence', 'Data capture', 'Customer empathy'],
    fastestRoute: 'Contact centre application → performance targets → team leader route',
  },
  digital_marketing_executive: {
    match: 'digital_marketing_executive',
    careerHubPathId: 'digital-ai-beginner',
    portfolioRequired: true,
    goals: { skilled: 'Digital Marketing Executive', senior: 'Senior Digital Executive', supervisor: 'Digital Marketing Manager', manager: 'Head of Digital' },
    requirements: [
      req('portfolio', 'Campaign Portfolio', 'Case studies with ROI, CTR, and conversion metrics.'),
      req('google', 'Google Ads & GA4', 'Hands-on paid search and analytics competency.'),
      cert('cim', 'CIM Digital Diploma', 'UK marketing professional qualification route.'),
    ],
    jobs: [
      { title: 'Digital Marketing Executive', keyword: 'digital marketing executive', seniority: 'mid', salary: '£26k–£36k' },
      { title: 'Digital Marketing Specialist', keyword: 'digital marketing specialist', seniority: 'mid', salary: '£28k–£38k' },
    ],
    skillsExpected: ['Google Ads', 'GA4', 'SEO basics', 'Content calendars', 'A/B testing'],
    fastestRoute: 'Google certifications → portfolio case studies → digital marketing applications',
  },
  seo_specialist: {
    match: 'seo_specialist',
    portfolioRequired: true,
    requirements: [
      req('seo_tools', 'SEO Tools Proficiency', 'Ahrefs, SEMrush, or Screaming Frog experience.'),
      cert('technical_seo', 'Technical SEO Skills', 'Site audits, Core Web Vitals, and schema markup.'),
    ],
    jobs: [{ title: 'SEO Specialist', keyword: 'SEO specialist', seniority: 'mid', salary: '£28k–£40k' }],
    skillsExpected: ['On-page SEO', 'Technical audits', 'Keyword research', 'Content strategy'],
  },
  primary_teacher: {
    match: 'primary_teacher',
    regulated: true,
    careerHubPathId: 'teaching-support',
    goals: { skilled: 'Primary Teacher', senior: 'Experienced Teacher', supervisor: 'Key Stage Lead', manager: 'Deputy Headteacher' },
    requirements: [
      req('qts', 'QTS (Qualified Teacher Status)', 'Required for qualified teacher roles in maintained schools.', { href: 'https://www.gov.uk/guidance/qualified-teacher-status-qts' }),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for all school-based roles.'),
      req('safeguarding', 'Safeguarding Training', 'Keeping Children Safe in Education compliance.'),
    ],
    jobs: [
      { title: 'Primary Teacher', keyword: 'primary teacher', seniority: 'mid', salary: '£30k–£42k' },
      { title: 'Primary School Teacher', keyword: 'primary school teacher', seniority: 'mid', salary: '£30k–£42k' },
    ],
    skillsExpected: ['Lesson planning', 'Behaviour management', 'Phonics / curriculum knowledge', 'Parent communication'],
    fastestRoute: 'QTS → DBS → safeguarding → primary teacher applications',
  },
  teaching_assistant: {
    match: 'teaching_assistant',
    regulated: true,
    careerHubPathId: 'teaching-support',
    requirements: [
      req('dbs', 'Enhanced DBS Check', 'Mandatory for all classroom support roles.'),
      req('safeguarding', 'Safeguarding Training', 'Required before working with pupils.'),
      cert('hlta', 'HLTA Qualification', 'Higher Level Teaching Assistant — progression route.'),
    ],
    jobs: [{ title: 'Teaching Assistant', keyword: 'teaching assistant', seniority: 'mid', salary: '£20k–£26k' }],
    skillsExpected: ['Classroom support', '1:1 pupil support', 'Behaviour management', 'Literacy & numeracy support'],
    fastestRoute: 'DBS → safeguarding → TA applications → HLTA progression',
  },
  hr_advisor: {
    match: 'hr_advisor',
    careerHubPathId: 'office-admin',
    goals: { skilled: 'HR Advisor', senior: 'Senior HR Advisor', supervisor: 'HR Business Partner', manager: 'HR Manager' },
    requirements: [
      req('cipd', 'CIPD Qualification', 'Level 3+ CIPD expected for HR advisor roles in the UK.'),
      req('hris', 'HRIS Experience', 'Workday, CIPHR, or SAP SuccessFactors.'),
      cert('employment_law', 'UK Employment Law Knowledge', 'ACAS code, tribunals, and statutory rights.'),
    ],
    jobs: [
      { title: 'HR Advisor', keyword: 'HR advisor', seniority: 'mid', salary: '£28k–£38k' },
      { title: 'HR Officer', keyword: 'HR officer', seniority: 'mid', salary: '£26k–£34k' },
    ],
    skillsExpected: ['Employee relations', 'HR policies', 'Recruitment support', 'HRIS administration'],
    fastestRoute: 'CIPD Level 3 → HRIS training → HR advisor applications',
  },
  hr_recruitment_consultant: {
    match: 'hr_recruitment_consultant',
    requirements: [
      req('recruitment_exp', '360 Recruitment Experience', 'Full-cycle recruitment: sourcing, screening, offer management.'),
      cert('rec', 'REC Compliance Training', 'REC membership and compliance for agency recruiters.'),
      cert('crm_rec', 'CRM / ATS Proficiency', 'Bullhorn, Vincere, or similar recruitment systems.'),
    ],
    jobs: [{ title: 'Recruitment Consultant', keyword: 'recruitment consultant', seniority: 'mid', salary: '£22k–£35k + commission' }],
    skillsExpected: ['Business development', 'Candidate sourcing', 'Client management', 'Negotiation'],
    fastestRoute: 'REC compliance → CRM training → recruitment consultant desk',
  },
  commercial_cleaner: {
    match: 'commercial_cleaner',
    careerHubPathId: 'security-facilities',
    requirements: [
      req('coshh', 'COSHH Training', 'Mandatory for commercial cleaning with chemicals.'),
      req('manual_handling', 'Manual Handling Certificate', 'Required for waste and equipment handling.'),
      cert('bics', 'BICSc Cleaning Certificate', 'UK industry standard for contract cleaning.'),
    ],
    jobs: [
      { title: 'Commercial Cleaner', keyword: 'commercial cleaner', seniority: 'mid', salary: '£20k–£24k' },
      { title: 'Cleaning Operative', keyword: 'cleaning operative', seniority: 'mid', salary: '£20k–£24k' },
    ],
    skillsExpected: ['COSHH compliance', 'Colour-coded cleaning', 'Time management', 'Quality inspection'],
    fastestRoute: 'COSHH → manual handling → BICSc → commercial cleaning contracts',
  },
  facilities_manager: {
    match: 'facilities_manager',
    careerHubPathId: 'security-facilities',
    goals: { skilled: 'Facilities Coordinator', senior: 'Facilities Manager', supervisor: 'Senior Facilities Manager', manager: 'Head of Facilities' },
    requirements: [
      req('iwfm', 'IWFM Qualification', 'Institute of Workplace and Facilities Management — UK FM standard.', { href: 'https://www.iwfm.org.uk/' }),
      cert('health_safety', 'NEBOSH / IOSH', 'Health & safety competency for facilities management.'),
      cert('budget', 'Budget & Contractor Management', 'PPM schedules, CAFM systems, and supplier management.'),
    ],
    jobs: [
      { title: 'Facilities Manager', keyword: 'facilities manager', seniority: 'senior', salary: '£32k–£48k' },
      { title: 'Facilities Coordinator', keyword: 'facilities coordinator', seniority: 'mid', salary: '£24k–£32k' },
    ],
    skillsExpected: ['Hard and soft FM', 'CAFM systems', 'Health & safety', 'Contractor management'],
    fastestRoute: 'IWFM Level 3 → facilities coordinator → facilities manager progression',
  },
}

export const NEW_PATTERN_BLUEPRINTS: Array<{ pattern: RegExp; blueprint: Partial<ExperienceSpecialisationBlueprint> }> = [
  {
    pattern: /production|manufacturing|machinist|process_engineer|quality_engineer|maintenance_engineer|design_engineer|engineering_manager/i,
    blueprint: {
      careerHubPathId: 'construction-trades',
      requirements: [
        req('iosh', 'IOSH Working Safely', 'Health & safety standard for UK manufacturing environments.'),
        cert('manual_handling', 'Manual Handling', 'Required for production and maintenance roles.'),
      ],
      skillsExpected: ['Health & safety', 'Production KPIs', 'Quality standards', 'Team communication'],
    },
  },
  {
    pattern: /customer_service|call_centre|contact_centre|complaints|customer_experience|customer_support/i,
    blueprint: {
      careerHubPathId: 'office-admin',
      requirements: [req('crm', 'CRM / Contact Centre Systems', 'Zendesk, Salesforce, or Avaya experience expected.')],
      skillsExpected: ['Customer communication', 'CRM systems', 'SLA management', 'Problem resolution'],
    },
  },
  {
    pattern: /marketing|seo|ppc|social_media|brand_manager|content_marketing|email_marketing|digital_marketing/i,
    blueprint: {
      careerHubPathId: 'digital-ai-beginner',
      portfolioRequired: true,
      requirements: [req('portfolio', 'Campaign Portfolio', 'UK marketing hires on demonstrated campaign results.')],
      skillsExpected: ['Campaign analytics', 'Content creation', 'Channel strategy', 'ROI reporting'],
    },
  },
  {
    pattern: /teaching|teacher|lecturer|tutor|early_years|cover_supervisor|sen_teaching/i,
    blueprint: {
      regulated: true,
      careerHubPathId: 'teaching-support',
      requirements: [
        req('dbs', 'Enhanced DBS Check', 'Mandatory for all UK education roles.'),
        req('safeguarding', 'Safeguarding Training', 'Keeping Children Safe in Education compliance.'),
      ],
      skillsExpected: ['Safeguarding', 'Lesson delivery', 'Behaviour management', 'Curriculum knowledge'],
    },
  },
  {
    pattern: /hr_|recruitment|recruiter|talent_acquisition|learning_development/i,
    blueprint: {
      careerHubPathId: 'office-admin',
      requirements: [
        cert('cipd', 'CIPD Qualification', 'UK HR professional standard.'),
        cert('hris', 'HRIS Systems', 'Workday, CIPHR, or similar.'),
      ],
      skillsExpected: ['Employment law awareness', 'HRIS administration', 'Stakeholder management', 'Confidentiality'],
    },
  },
  {
    pattern: /cleaner|cleaning|housekeeper|housekeeping|facilities|environmental_services|caretaker|porter|laundry|hygiene|estates|soft_services|room_attendant/i,
    blueprint: {
      careerHubPathId: 'security-facilities',
      requirements: [
        req('coshh', 'COSHH Training', 'Mandatory for commercial cleaning roles.'),
        req('manual_handling', 'Manual Handling', 'Required for waste and equipment handling.'),
      ],
      skillsExpected: ['COSHH compliance', 'Manual handling', 'Quality standards', 'Reliability'],
    },
  },
]

export const NEW_SPEC_SKILLS: Record<string, string[]> = {
  production_operative: ['Production line operation', 'Quality inspection', '5S / housekeeping', 'Health & safety'],
  mechanical_engineer: ['SolidWorks / AutoCAD', 'Root cause analysis', 'Project engineering', 'GD&T'],
  customer_service_advisor: ['Zendesk / Salesforce', 'Complaint resolution', 'CSAT improvement', 'Multi-channel support'],
  digital_marketing_executive: ['Google Ads', 'GA4', 'SEO', 'Content marketing', 'A/B testing'],
  primary_teacher: ['Lesson planning', 'Phonics', 'Behaviour management', 'Assessment for learning'],
  hr_advisor: ['Employee relations', 'CIPD knowledge', 'HRIS', 'Recruitment support'],
  commercial_cleaner: ['COSHH', 'Colour-coded cleaning', 'Contract KPIs', 'Manual handling'],
  facilities_manager: ['IWFM', 'CAFM systems', 'PPM scheduling', 'Contractor management'],
}

export type NewSectorArchetype =
  | 'manufacturing_engineering'
  | 'customer_service'
  | 'marketing_digital'
  | 'education_teaching'
  | 'hr_recruitment'
  | 'cleaning_facilities'

export const NEW_ARCHETYPE_UK_EXPECTATIONS: Record<
  NewSectorArchetype,
  {
    daily: (label: string) => string[]
    technical?: (label: string) => string[]
    customerFacing?: (label: string) => string[]
    systems?: (label: string) => string[]
  }
> = {
  manufacturing_engineering: {
    daily: (l) => [`Production duties as a ${l}`, 'Quality checks and line reporting', 'Health & safety compliance on shift'],
    technical: () => ['Lean / 5S awareness', 'Engineering drawings / tolerances', 'Root cause analysis'],
    systems: () => ['MES / ERP systems', 'CMMS maintenance systems', 'SPC quality data'],
  },
  customer_service: {
    daily: (l) => [`Inbound and outbound customer contact as a ${l}`, 'Ticket resolution within SLA', 'Accurate CRM logging'],
    customerFacing: () => ['De-escalation', 'Empathetic communication', 'Complaint handling'],
    systems: () => ['Zendesk', 'Salesforce Service Cloud', 'Avaya / Genesys contact centre'],
  },
  marketing_digital: {
    daily: (l) => [`Campaign execution as a ${l}`, 'Channel performance reporting', 'Content and asset production'],
    technical: () => ['Google Ads & GA4', 'SEO audits', 'Marketing automation'],
    systems: () => ['HubSpot', 'Mailchimp', 'WordPress / CMS'],
  },
  education_teaching: {
    daily: (l) => [`Classroom delivery as a ${l}`, 'Lesson planning and assessment', 'Safeguarding and pastoral care'],
    customerFacing: () => ['Parent communication', 'Pupil behaviour management', 'SEN support where applicable'],
    systems: () => ['SIMS / Arbor MIS', 'Google Classroom', 'CPD tracking'],
  },
  hr_recruitment: {
    daily: (l) => [`HR or recruitment duties as a ${l}`, 'Policy and case management', 'Stakeholder and employee queries'],
    technical: () => ['UK employment law basics', 'HR case notes', 'Recruitment KPIs'],
    systems: () => ['Workday', 'CIPHR', 'Bullhorn / ATS'],
  },
  cleaning_facilities: {
    daily: (l) => [`Cleaning or facilities tasks as a ${l}`, 'Site inspections and quality checks', 'COSHH-compliant chemical use'],
    technical: () => ['Colour-coded cleaning', 'PPM schedules', 'Waste management'],
    systems: () => ['CAFM systems', 'Contract KPI reporting', 'Helpdesk ticketing'],
  },
}

export const NEW_FACT_QUESTION_DEFS: Array<{
  id: string
  text: string
  options: Array<{ value: string; label: string }>
  allowMultiple?: boolean
  archetypes?: NewSectorArchetype[]
  specIds?: string[]
  factIds: string[]
  priority: number
}> = [
  { id: 'iosh_working_safely', text: 'Do you hold IOSH Working Safely or equivalent health & safety training?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['manufacturing_engineering'], factIds: ['iosh'], priority: 1 },
  { id: 'manual_handling', text: 'Do you hold a manual handling certificate?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['manufacturing_engineering', 'cleaning_facilities'], factIds: ['manual_handling', 'manual_handling_clean'], priority: 2 },
  { id: 'lean_experience', text: 'Do you have lean manufacturing or continuous improvement experience (5S, Kaizen, Six Sigma)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['manufacturing_engineering'], factIds: ['lean'], priority: 4 },
  {
    id: 'contact_centre_systems',
    text: 'Which contact centre or CRM systems have you used?',
    options: [
      { value: 'zendesk', label: 'Zendesk' },
      { value: 'salesforce', label: 'Salesforce Service Cloud' },
      { value: 'genesys', label: 'Genesys / Avaya' },
      { value: 'freshdesk', label: 'Freshdesk' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['customer_service'],
    factIds: ['crm_cs'],
    priority: 1,
    allowMultiple: true,
  },
  { id: 'marketing_portfolio', text: 'Do you have campaign examples, design work, analytics, or a marketing portfolio?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['marketing_digital'], factIds: ['portfolio_mkt'], priority: 1 },
  { id: 'google_ads_cert', text: 'Do you hold Google Ads or Google Analytics certification?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['marketing_digital'], factIds: ['google_ads'], priority: 2 },
  {
    id: 'marketing_tools',
    text: 'Which marketing tools have you used?',
    options: [
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'mailchimp', label: 'Mailchimp' },
      { value: 'wordpress', label: 'WordPress / CMS' },
      { value: 'semrush', label: 'SEMrush / Ahrefs' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['marketing_digital'],
    factIds: ['cms'],
    priority: 3,
    allowMultiple: true,
  },
  { id: 'safeguarding_training', text: 'Have you completed safeguarding training (Keeping Children Safe in Education)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['education_teaching'], factIds: ['safeguarding'], priority: 1 },
  { id: 'qts_held', text: 'Do you hold QTS (Qualified Teacher Status)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], specIds: ['primary_teacher', 'secondary_teacher', 'head_teacher'], factIds: ['qts'], priority: 1 },
  { id: 'trn_held', text: 'Do you have a Teacher Reference Number (TRN)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['education_teaching'], factIds: ['trn'], priority: 2 },
  { id: 'eyfs_qualification', text: 'Do you hold a Level 3 Early Years qualification?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], specIds: ['early_years_practitioner'], factIds: ['eyfs'], priority: 1 },
  {
    id: 'hr_professional_certifications',
    text: 'Which professional memberships or certifications do you hold or are working towards?',
    options: [
      { value: 'cipd', label: 'CIPD' },
      { value: 'cim', label: 'CIM' },
      { value: 'iwfm', label: 'IWFM' },
      { value: 'rec', label: 'REC' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['hr_recruitment', 'marketing_digital'],
    factIds: ['cipd', 'cim', 'rec'],
    priority: 1,
    allowMultiple: true,
  },
  {
    id: 'hris_systems',
    text: 'Which HRIS systems have you used?',
    options: [
      { value: 'workday', label: 'Workday' },
      { value: 'ciphr', label: 'CIPHR' },
      { value: 'sap', label: 'SAP SuccessFactors' },
      { value: 'bamboohr', label: 'BambooHR' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['hr_recruitment'],
    factIds: ['hris'],
    priority: 2,
    allowMultiple: true,
  },
  { id: 'rtw_checks', text: 'Have you conducted UK right-to-work checks?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['hr_recruitment'], factIds: ['rtw'], priority: 3 },
  { id: 'coshh_training', text: 'Do you hold COSHH training for cleaning chemicals?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['cleaning_facilities'], factIds: ['coshh'], priority: 1 },
  { id: 'bics_qualification', text: 'Do you hold a BICSc cleaning qualification?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], archetypes: ['cleaning_facilities'], factIds: ['bics'], priority: 3 },
  { id: 'iwfm_qualification', text: 'Do you hold an IWFM facilities management qualification?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], specIds: ['facilities_manager', 'facilities_coordinator'], factIds: ['iwfm'], priority: 2 },
]

export const NEW_SHARED_INDUSTRY_QUESTIONS: Record<string, Array<{ id: string; text: string; options: Array<{ value: string; label: string }> }>> = {
  education_teaching: [{ id: 'dbs_clear', text: 'Do you have an enhanced DBS check?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
  cleaning_facilities: [{ id: 'dbs_clear', text: 'Do you have an enhanced DBS check?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
}

export const NEW_SPEC_FOLLOW_UP_QUESTIONS: Record<string, Array<{ id: string; text: string; options: Array<{ value: string; label: string }> }>> = {
  cnc_machinist: [{ id: 'cnc_programming', text: 'Can you set, operate, and program CNC machines?', options: [{ value: 'operate', label: 'Operate only' }, { value: 'set', label: 'Set & operate' }, { value: 'program', label: 'Program & set' }, { value: 'no', label: 'Not yet' }] }],
  complaints_handler: [{ id: 'fca_complaints', text: 'Have you handled FCA-regulated complaints (financial services)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
  ppc_specialist: [{ id: 'google_ads_cert', text: 'Do you hold Google Ads certification?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
  sen_teaching_assistant: [{ id: 'sen_experience', text: 'Do you have SEN or inclusion support experience?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
  talent_acquisition_specialist: [{ id: 'ats_experience', text: 'Have you used an ATS for full-cycle recruitment?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }],
}
