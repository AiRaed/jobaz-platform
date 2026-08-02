/**
 * Shared multi-select assessment rules for all Career Brain pathways.
 * Answers are stored as comma-separated IDs unless noted otherwise.
 */

import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import { getAllCertificationLabels } from '@/lib/career-engine/education-path/certificationOptionGroups'

export const MULTI_SELECT_DELIMITER = ','
export const MULTI_SELECT_HELPER = 'Select all that apply.'

/** Questions that must remain single-choice */
export const SINGLE_SELECT_ONLY_IDS = new Set([
  'industry',
  'education_field',
  'years_experience',
  'experience_years',
  'grow_years',
  'experience_country',
  'qualification_origin',
  'qualification_level',
  'english_level',
  'uk_work_experience',
  'open_to_certifications',
  'open_to_courses',
  'preferred_location',
  'phv_or_taxi',
  'employment_model',
  'kitchen_level',
  'customer_service_years',
  'role_seniority',
  'grow_goal',
  'change_reason',
  'target_field',
  'current_field',
  'grow_field',
  'side_profile',
  'side_hours',
  'side_schedule',
  'side_income_goal',
  'biz_idea',
  'biz_experience',
  'biz_capital',
  'biz_time',
  'biz_risk',
  'study_willing',
  'grow_study',
  'adr_required',
  'gas_safe',
  'nmc_registered',
  'gdc_registered',
  'uk_regulator_registered',
  'github_portfolio',
  'commercial_experience',
  'portfolio_projects',
  'professional_portfolio',
  'marketing_portfolio',
  'forklift_licence',
  'driver_cpc',
  'uk_driving_licence',
  'council_licence',
  'own_vehicle',
  'ecs_card',
  'edition_18',
  'nvq_level3',
  'niceic_registered',
  'cscs_card',
  'trade_qualification',
  'site_experience',
  'care_certificate',
  'direct_care',
  'food_hygiene',
  'personal_licence',
  'dbs_clear',
  'istqb',
  'overseas_nursing',
  'overseas_dental_qual',
  'overseas_qualification',
  'overseas_electrical',
  'overseas_accounting',
  'nhs_experience',
  'private_practice',
  'performer_number',
  'conflict_management',
  'control_room_exp',
  'picker_packer_exp',
  'wms_systems',
  'crm_experience',
  'ms_office',
])

/** Question IDs that support multiple selections */
export const MULTI_SELECT_QUESTION_IDS = new Set([
  'experience_specialisation',
  'education_specialisation',
  'professional_certifications',
  'accounting_software',
  'cloud_platforms',
  'primary_languages',
  'programming_languages',
  'tools_used',
  'testing_type',
  'dev_focus',
  'data_stack',
  'hgv_category',
  'forklift_type',
  'sia_licence_type',
  'sia_licences_held',
  'security_licences',
  'construction_cards',
  'electrical_qualifications',
  'healthcare_certifications',
  'hospitality_systems',
  'crm_systems',
  'erp_systems',
  'office_software',
  'sales_platforms',
  'compliance_frameworks',
  'tech_certifications',
  'cad_software',
  'design_software',
  'languages_spoken',
  'driving_licence_categories',
  'warehouse_equipment',
  'technical_skills',
  'specialist_areas',
  'side_skills',
  'grow_certifications',
  'b2b_b2c',
  'contact_centre_systems',
  'marketing_tools',
  'hris_systems',
  'hr_professional_certifications',
  'interest_area',
  'work_environment',
])

export const PROFESSIONAL_CERTIFICATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'acca', label: 'ACCA' },
  { value: 'cima', label: 'CIMA' },
  { value: 'icaew', label: 'ICAEW' },
  { value: 'aca', label: 'ACA' },
  { value: 'aat', label: 'AAT' },
  { value: 'cipd', label: 'CIPD' },
  { value: 'iosh', label: 'IOSH' },
  { value: 'nebosh', label: 'NEBOSH' },
  { value: 'prince2', label: 'PRINCE2' },
  { value: 'itil', label: 'ITIL' },
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
  { value: 'gcp', label: 'Google Cloud' },
  { value: 'cisco', label: 'CISCO' },
  { value: 'comptia', label: 'CompTIA' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'google', label: 'Google' },
  { value: 'istqb', label: 'ISTQB' },
  { value: 'cta', label: 'CTA / ATT (Tax)' },
  { value: 'cima_cgma', label: 'CIMA CGMA' },
  { value: 'cfa', label: 'CFA' },
  { value: 'cipfa', label: 'CIPFA' },
  { value: 'other', label: 'Other professional certification' },
]

export const CERT_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'qualified', label: 'Qualified' },
  { value: 'part_qualified', label: 'Part-qualified' },
  { value: 'studying', label: 'Currently studying' },
  { value: 'planning', label: 'Planning to start' },
]

const CERT_LABELS: Record<string, string> = {
  ...Object.fromEntries(PROFESSIONAL_CERTIFICATION_OPTIONS.map((o) => [o.value, o.label])),
  ...getAllCertificationLabels(),
}

const CERT_STATUS_SKIP_IDS = new Set(['other', 'none_yet', 'not_sure'])

export function isMultiSelectQuestion(questionId: string): boolean {
  if (SINGLE_SELECT_ONLY_IDS.has(questionId)) return false
  if (MULTI_SELECT_QUESTION_IDS.has(questionId)) return true
  if (questionId.startsWith('cert_status_')) return false
  return false
}

export function parseMultiSelectValue(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(MULTI_SELECT_DELIMITER)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function joinMultiSelectValue(values: string[]): string {
  return [...new Set(values.filter(Boolean))].join(MULTI_SELECT_DELIMITER)
}

export function certStatusQuestionId(certId: string): string {
  return `cert_status_${certId}`
}

export function isCertStatusQuestionId(questionId: string): boolean {
  return questionId.startsWith('cert_status_')
}

export function parseCertificationStatuses(answers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(answers)) {
    if (!isCertStatusQuestionId(key) || !value) continue
    out[key.replace('cert_status_', '')] = value
  }
  return out
}

export function hasQualifiedProfessionalCert(
  answers: Record<string, string>,
  certIds?: string[]
): boolean {
  const statuses = parseCertificationStatuses(answers)
  const selected = parseMultiSelectValue(answers.professional_certifications)
  const pool = certIds?.length ? selected.filter((id) => certIds.includes(id)) : selected
  return pool.some((id) => statuses[id] === 'qualified' || statuses[id] === 'part_qualified')
}

export function inferAccountingBody(answers: Record<string, string>): string | undefined {
  if (answers.accounting_body && answers.accounting_body !== 'none') {
    return answers.accounting_body
  }
  const financeBodies = ['acca', 'cima', 'icaew', 'aat', 'aca']
  const selected = parseMultiSelectValue(answers.professional_certifications)
  const match = selected.find((id) => financeBodies.includes(id))
  return match
}

export function buildCertificationStatusQuestions(
  answers: Record<string, string>
): CareerEngineQuestion[] {
  const certs = parseMultiSelectValue(answers.professional_certifications).filter(
    (c) => !CERT_STATUS_SKIP_IDS.has(c)
  )
  if (certs.length === 0) return []

  return certs
    .filter((certId) => !answers[certStatusQuestionId(certId)])
    .map((certId) => ({
      id: certStatusQuestionId(certId),
      text: `What is your status for ${CERT_LABELS[certId] ?? certId.replace(/_/g, ' ')}?`,
      options: CERT_STATUS_OPTIONS,
      allowMultiple: false,
    }))
}

export function applyCertificationInference(answers: Record<string, string>): Record<string, string> {
  const out = { ...answers }
  const body = inferAccountingBody(out)
  if (body && (!out.accounting_body || out.accounting_body === 'none')) {
    out.accounting_body = body
  }

  if (parseMultiSelectValue(out.cloud_platforms).length > 0 && !out.cloud_experience) {
    out.cloud_experience = 'yes'
  }

  const accountingSoftware = parseMultiSelectValue(out.accounting_software)
  if (accountingSoftware.length > 0 && !out.sage_xero) {
    out.sage_xero = accountingSoftware.some((s) => ['sage', 'xero', 'quickbooks'].includes(s)) ? 'yes' : 'no'
  }

  if (parseMultiSelectValue(out.crm_systems).length > 0 && !out.crm_experience) {
    out.crm_experience = 'yes'
  }

  if (parseMultiSelectValue(out.office_software).length > 0 && !out.ms_office) {
    out.ms_office = 'yes'
  }

  if (parseMultiSelectValue(out.tools_used).length > 0 && !out.testing_type) {
    out.testing_type = 'automation'
  }

  return out
}
