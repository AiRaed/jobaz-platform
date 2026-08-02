import type { EducationFieldId } from './types'

export type CertificationOptionType =
  | 'professional_membership'
  | 'qualification'
  | 'certificate'
  | 'software_skill'
  | 'licence'
  | 'course_type'

export type CertificationOptionDef = {
  key: string
  label: string
  educationFields: EducationFieldId[]
  /** snake_case specialisation ids from educationSpecialisations */
  specialisations?: string[]
  routes?: string[]
  goals?: string[]
  optionType: CertificationOptionType
  priority: number
  /** Boost when qualification is from outside UK and user is open to UK training */
  ukBridge?: boolean
  /** When true, option is hidden unless specialisation matches (e.g. electrical-only certs). */
  requiresSpecMatch?: boolean
  notes?: string
}

export const CERTIFICATION_QUESTION_TEXT =
  'Do you already hold, or are you interested in, any UK-related certificates, memberships or tools for this field?'

export const UNIVERSAL_CERTIFICATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'none_yet', label: 'None yet' },
  { value: 'not_sure', label: 'Not sure' },
  { value: 'other', label: 'Other professional certification' },
]

const ENG = ['engineering'] as EducationFieldId[]
const ENG_ELEC = [
  'electrical_engineering',
  'electronic_engineering',
  'electrician',
  'building_services',
] as string[]
const ENG_CIVIL = ['civil_engineering', 'architecture', 'quantity_surveying', 'bim'] as string[]
const ENG_MECH = ['mechanical_engineering', 'industrial_engineering', 'mechatronics', 'automotive_engineering'] as string[]
const IT = ['it'] as EducationFieldId[]
const IT_SPECS = [
  'it_support',
  'computer_science',
  'software_engineering',
  'networking',
  'cyber_security',
  'cloud_computing',
  'data_science',
  'web_development',
  'devops',
  'database_administration',
] as string[]
const FIN = ['business_finance'] as EducationFieldId[]
const FIN_SPECS = ['accounting', 'finance', 'banking', 'economics', 'insurance', 'procurement'] as string[]
const HEALTH = ['healthcare', 'social_care'] as EducationFieldId[]
const EDU = ['education'] as EducationFieldId[]
const LAW = ['law'] as EducationFieldId[]
const SCI = ['science'] as EducationFieldId[]
const CREATIVE = ['creative_arts'] as EducationFieldId[]
const MEDIA = ['media_communications'] as EducationFieldId[]
const CONSTRUCTION = ['construction'] as EducationFieldId[]
const HOSP = ['hospitality'] as EducationFieldId[]
const LOGISTICS = ['logistics_transport'] as EducationFieldId[]
const PROPERTY = ['property_real_estate'] as EducationFieldId[]
const PUBLIC = ['public_sector', 'manufacturing'] as EducationFieldId[]

function o(
  key: string,
  label: string,
  educationFields: EducationFieldId[],
  optionType: CertificationOptionType,
  priority: number,
  extra?: Partial<CertificationOptionDef>
): CertificationOptionDef {
  return {
    key,
    label,
    educationFields,
    optionType,
    priority,
    goals: ['work_in_education'],
    ...extra,
  }
}

/** Reusable certification / membership / tool catalogue — matched at runtime, not per-specialisation hardcoding. */
export const CERTIFICATION_OPTION_GROUPS: CertificationOptionDef[] = [
  // —— Engineering (general) ——
  o('iet', 'IET', ENG, 'professional_membership', 88),
  o('engineering_council', 'Engineering Council', ENG, 'professional_membership', 86),
  o('imeche', 'IMechE', ENG, 'professional_membership', 82, { specialisations: ENG_MECH, requiresSpecMatch: true }),
  o('ice', 'ICE', ENG, 'professional_membership', 82, { specialisations: ENG_CIVIL, requiresSpecMatch: true }),
  o('istructe', 'IStructE', ENG, 'professional_membership', 78, { specialisations: ENG_CIVIL, requiresSpecMatch: true }),
  o('ciht', 'CIHT', ENG, 'professional_membership', 76, { specialisations: [...ENG_CIVIL, 'civil_engineering'], requiresSpecMatch: true }),
  o('apm', 'APM', ENG, 'qualification', 80),
  o('prince2', 'PRINCE2', [...ENG, ...PUBLIC, ...FIN], 'qualification', 72),
  o('iosh', 'IOSH', [...ENG, ...CONSTRUCTION, ...PUBLIC, 'manufacturing'], 'certificate', 78),
  o('nebosh', 'NEBOSH', [...ENG, ...CONSTRUCTION, ...PUBLIC, 'manufacturing'], 'certificate', 76),
  o('cscs', 'CSCS', [...ENG, ...CONSTRUCTION], 'licence', 74),
  o('autocad', 'AutoCAD', [...ENG, ...CONSTRUCTION, ...CREATIVE], 'software_skill', 76),
  o('revit_bim', 'Revit / BIM', [...ENG, ...CONSTRUCTION], 'software_skill', 74, { specialisations: [...ENG_CIVIL, 'architecture'], requiresSpecMatch: true }),
  o('solidworks', 'SolidWorks', ENG, 'software_skill', 70, { specialisations: ENG_MECH, requiresSpecMatch: true }),

  // —— Electrical / Electronic ——
  o('ecs_card', 'ECS Card', ENG, 'licence', 90, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('18th_edition', '18th Edition Wiring Regulations', ENG, 'licence', 88, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('nvq3_electrical', 'NVQ Level 3 Electrical', ENG, 'qualification', 86, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('city_guilds_electrical', 'City & Guilds Electrical', ENG, 'qualification', 84, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('inspection_testing_2391', 'Inspection & Testing 2391', ENG, 'qualification', 82, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('niceic_napit', 'NICEIC / NAPIT', ENG, 'professional_membership', 80, { specialisations: ENG_ELEC, ukBridge: true, requiresSpecMatch: true }),
  o('pat_testing', 'PAT Testing', ENG, 'certificate', 68, { specialisations: [...ENG_ELEC, 'maintenance'], requiresSpecMatch: true }),

  // —— IT & Technology ——
  o('comptia_a_plus', 'CompTIA A+', IT, 'certificate', 88, { specialisations: IT_SPECS, ukBridge: true }),
  o('comptia_network_plus', 'CompTIA Network+', IT, 'certificate', 84, { specialisations: ['networking', 'it_support', 'cyber_security', 'software_engineering'] }),
  o('comptia_security_plus', 'CompTIA Security+', IT, 'certificate', 84, { specialisations: ['cyber_security', 'networking', 'it_support', 'software_engineering'] }),
  o('aws_cloud_practitioner', 'AWS Cloud Practitioner', IT, 'certificate', 82, { specialisations: ['cloud_computing', 'devops', 'data_science', 'software_engineering', 'web_development'] }),
  o('azure_fundamentals', 'Microsoft Azure Fundamentals', IT, 'certificate', 80, { specialisations: ['cloud_computing', 'it_support', 'software_engineering', 'devops'] }),
  o('gcp_digital_leader', 'Google Cloud Digital Leader', IT, 'certificate', 72, { specialisations: ['cloud_computing', 'data_science', 'software_engineering'] }),
  o('cisco_ccna', 'Cisco CCNA', IT, 'certificate', 82, { specialisations: ['networking', 'it_support', 'software_engineering'] }),
  o('istqb', 'ISTQB Foundation', IT, 'certificate', 80, { specialisations: ['software_engineering', 'computer_science'] }),
  o('power_bi', 'Power BI / Data Analysis', [...IT, ...FIN, ...PUBLIC], 'software_skill', 78),
  o('microsoft_certs', 'Microsoft', IT, 'certificate', 76),
  o('google_certs', 'Google', IT, 'certificate', 72),

  // —— Business & Finance ——
  o('aat', 'AAT', FIN, 'qualification', 88, { specialisations: FIN_SPECS, ukBridge: true }),
  o('acca', 'ACCA', FIN, 'professional_membership', 86, { specialisations: ['accounting', 'finance'] }),
  o('cima', 'CIMA', FIN, 'professional_membership', 84, { specialisations: ['accounting', 'finance', 'management_accounting'] }),
  o('icaew', 'ICAEW', FIN, 'professional_membership', 82, { specialisations: ['accounting', 'finance'] }),
  o('aca', 'ACA', FIN, 'professional_membership', 80, { specialisations: ['accounting'] }),
  o('bookkeeping', 'Bookkeeping', FIN, 'qualification', 78, { ukBridge: true }),
  o('sage', 'Sage', FIN, 'software_skill', 76),
  o('xero', 'Xero', FIN, 'software_skill', 74),
  o('quickbooks', 'QuickBooks', FIN, 'software_skill', 72),
  o('excel_finance', 'Excel for Finance', FIN, 'software_skill', 76),
  o('payroll', 'Payroll', FIN, 'certificate', 70),

  // —— Healthcare / Social Care ——
  o('care_certificate', 'Care Certificate', HEALTH, 'certificate', 88, { ukBridge: true }),
  o('level2_diploma_care', 'Level 2 Diploma in Care', HEALTH, 'qualification', 86, { ukBridge: true }),
  o('level3_health_social_care', 'Level 3 Health and Social Care', HEALTH, 'qualification', 84, { ukBridge: true }),
  o('safeguarding_adults', 'Safeguarding Adults', HEALTH, 'certificate', 80),
  o('medication_admin', 'Medication Administration', HEALTH, 'certificate', 78),
  o('moving_handling', 'Moving and Handling People', HEALTH, 'certificate', 76),
  o('dementia_awareness', 'Dementia Awareness', HEALTH, 'certificate', 74),
  o('mental_health_awareness', 'Mental Health Awareness', HEALTH, 'certificate', 74),
  o('first_aid_work', 'First Aid at Work', [...HEALTH, ...PUBLIC, ...HOSP, ...CONSTRUCTION], 'certificate', 72),

  // —— Education & Teaching ——
  o('ta_level2', 'Teaching Assistant Level 2', EDU, 'qualification', 86, { ukBridge: true }),
  o('ta_level3', 'Teaching Assistant Level 3', EDU, 'qualification', 84, { ukBridge: true }),
  o('safeguarding_children', 'Safeguarding Children', EDU, 'certificate', 82),
  o('sen_autism', 'SEN / Autism Awareness', EDU, 'certificate', 78),
  o('child_protection', 'Child Protection', EDU, 'certificate', 78),
  o('behaviour_management', 'Behaviour Management', EDU, 'certificate', 74),
  o('tefl', 'TEFL', EDU, 'qualification', 76, { ukBridge: true }),
  o('first_aid_schools', 'First Aid for Schools', EDU, 'certificate', 70),

  // —— Law / Compliance ——
  o('paralegal_studies', 'Paralegal Studies', LAW, 'qualification', 84, { ukBridge: true }),
  o('legal_secretary', 'Legal Secretary', LAW, 'certificate', 80),
  o('cilex', 'CILEX', LAW, 'professional_membership', 82),
  o('gdpr', 'GDPR / Data Protection', [...LAW, ...PUBLIC, ...FIN, ...IT], 'certificate', 76),
  o('compliance_basics', 'Compliance', LAW, 'certificate', 74),
  o('business_law', 'Business Law Basics', LAW, 'certificate', 72),

  // —— Science & Laboratory ——
  o('lab_technician_skills', 'Laboratory Technician Skills', SCI, 'certificate', 84, { ukBridge: true }),
  o('coshh', 'COSHH', SCI, 'certificate', 78),
  o('glp', 'Good Laboratory Practice', SCI, 'certificate', 78),
  o('iso_9001', 'Quality Assurance / ISO 9001', [...SCI, 'manufacturing'], 'certificate', 74),
  o('lab_health_safety', 'Health and Safety in Laboratory', SCI, 'certificate', 74),
  o('science_data_excel', 'Data Analysis / Excel', [...SCI, ...FIN], 'software_skill', 72),

  // —— Creative & Design ——
  o('photoshop', 'Adobe Photoshop', CREATIVE, 'software_skill', 84),
  o('illustrator', 'Adobe Illustrator', CREATIVE, 'software_skill', 82),
  o('premiere_pro', 'Adobe Premiere Pro', [...CREATIVE, ...MEDIA], 'software_skill', 80),
  o('after_effects', 'After Effects', CREATIVE, 'software_skill', 78),
  o('ux_ui', 'UX/UI Design', CREATIVE, 'certificate', 80),
  o('figma', 'Figma', CREATIVE, 'software_skill', 78),
  o('portfolio_building', 'Portfolio Building', CREATIVE, 'course_type', 76),
  o('digital_marketing_creatives', 'Digital Marketing for Creatives', [...CREATIVE, ...MEDIA], 'certificate', 72),

  // —— Media & Communications ——
  o('digital_marketing', 'Digital Marketing', MEDIA, 'certificate', 86),
  o('social_media_marketing', 'Social Media Marketing', MEDIA, 'certificate', 84),
  o('seo', 'SEO', MEDIA, 'certificate', 80),
  o('google_ads', 'Google Ads', MEDIA, 'certificate', 78),
  o('copywriting', 'Copywriting', MEDIA, 'certificate', 76),
  o('video_editing', 'Video Editing', MEDIA, 'software_skill', 76),
  o('pr_comms', 'PR / Communications', MEDIA, 'certificate', 74),

  // —— Construction & Trades ——
  o('cscs_card', 'CSCS Card', CONSTRUCTION, 'licence', 88, { ukBridge: true }),
  o('construction_health_safety', 'Health and Safety in Construction', CONSTRUCTION, 'certificate', 82),
  o('citb_test', 'CITB Test Preparation', CONSTRUCTION, 'certificate', 80, { ukBridge: true }),
  o('working_at_height', 'Working at Height', CONSTRUCTION, 'certificate', 78),
  o('asbestos_awareness', 'Asbestos Awareness', CONSTRUCTION, 'certificate', 76),
  o('manual_handling', 'Manual Handling', [...CONSTRUCTION, ...LOGISTICS, ...HOSP, ...HEALTH], 'certificate', 72),

  // —— Hospitality ——
  o('food_safety_l2', 'Food Safety Level 2', HOSP, 'certificate', 88, { ukBridge: true }),
  o('food_hygiene', 'Food Hygiene', HOSP, 'certificate', 86),
  o('allergy_awareness', 'Allergy Awareness', HOSP, 'certificate', 80),
  o('customer_service', 'Customer Service', [...HOSP, ...PUBLIC, ...MEDIA], 'certificate', 76),
  o('personal_licence', 'Personal Licence', HOSP, 'licence', 82),
  o('fire_marshal', 'Fire Marshal', HOSP, 'certificate', 74),

  // —— Logistics & Transport ——
  o('forklift_counterbalance', 'Forklift Counterbalance', LOGISTICS, 'licence', 86, { ukBridge: true }),
  o('reach_truck', 'Reach Truck', LOGISTICS, 'licence', 84),
  o('hgv_lgv', 'HGV / LGV Training', LOGISTICS, 'licence', 82, { ukBridge: true }),
  o('driver_cpc', 'Driver CPC', LOGISTICS, 'licence', 80),
  o('taxi_phv_safeguarding', 'Taxi / PHV Safeguarding', LOGISTICS, 'certificate', 76),
  o('adr_dangerous_goods', 'ADR Dangerous Goods', LOGISTICS, 'certificate', 74),
  o('warehouse_safety', 'Warehouse Safety', LOGISTICS, 'certificate', 72),

  // —— Property & Real Estate ——
  o('estate_agent_training', 'Estate Agent Training', PROPERTY, 'course_type', 84, { ukBridge: true }),
  o('property_management', 'Property Management', PROPERTY, 'certificate', 82),
  o('lettings_management', 'Lettings Management', PROPERTY, 'certificate', 80),
  o('sales_skills', 'Sales Skills', [...PROPERTY, ...MEDIA], 'certificate', 74),
  o('property_fire_safety', 'Health and Safety / Fire Safety', PROPERTY, 'certificate', 72),

  // —— Public Sector / Office ——
  o('microsoft_office', 'Microsoft Office', PUBLIC, 'software_skill', 80),
  o('administration', 'Administration', PUBLIC, 'certificate', 76),
  o('equality_diversity', 'Equality and Diversity', PUBLIC, 'certificate', 72),
  o('safeguarding_general', 'Safeguarding', [...PUBLIC, ...EDU, ...HEALTH], 'certificate', 74),
  o('health_safety_work', 'Health and Safety at Work', PUBLIC, 'certificate', 74),
  o('english_for_work', 'English for Work', PUBLIC, 'course_type', 70, { ukBridge: true }),

  // —— Healthcare registrations (professional) ——
  o('nmc', 'NMC (Nursing)', ['healthcare'], 'professional_membership', 90, { specialisations: ['registered_nurse', 'midwife'] }),
  o('gmc', 'GMC (Medicine)', ['healthcare'], 'professional_membership', 88, { specialisations: ['doctor_physician'] }),
  o('hcpc', 'HCPC', ['healthcare'], 'professional_membership', 84),
  o('gphc', 'GPhC (Pharmacy)', ['healthcare'], 'professional_membership', 82, { specialisations: ['pharmacist'] }),
]

export function getCertificationOptionLabel(key: string): string {
  const found = CERTIFICATION_OPTION_GROUPS.find((item) => item.key === key)
  if (found) return found.label
  const universal = UNIVERSAL_CERTIFICATION_OPTIONS.find((item) => item.value === key)
  return universal?.label ?? key.replace(/_/g, ' ')
}

export function getAllCertificationLabels(): Record<string, string> {
  const labels: Record<string, string> = {}
  for (const item of CERTIFICATION_OPTION_GROUPS) {
    labels[item.key] = item.label
  }
  for (const item of UNIVERSAL_CERTIFICATION_OPTIONS) {
    labels[item.value] = item.label
  }
  return labels
}
