/**
 * Contamination / route-ownership rules for Work in My Education courses.
 * Practical job-entry licences stay on other goal paths unless the education
 * field clearly justifies them.
 */

import type { CareerGoalPath } from './types'

export type ContaminationKind =
  | 'sia_security'
  | 'forklift'
  | 'taxi_phv'
  | 'warehouse_basic'
  | 'food_hygiene'
  | 'hospitality_basic'
  | 'generic_job_entry'

export type ContaminationRule = {
  kind: ContaminationKind
  re: RegExp
  primary_goal_paths: CareerGoalPath[]
  /** Education field / specialism / route labels that may allow WIE use */
  allowedFieldRe: RegExp
  label: string
}

export const CONTAMINATION_RULES: ContaminationRule[] = [
  {
    kind: 'sia_security',
    re: /\b(sia|door\s*supervisor|security\s*guard|close\s*protection|cctv\s*operator)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(security|facilities|public\s*safety|event\s*security|protective)\b/i,
    label: 'SIA / security licence',
  },
  {
    kind: 'forklift',
    re: /\b(forklift|counterbalance|reach\s*truck|flt\b|lift\s*truck)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(logistics|warehouse|supply\s*chain|transport|materials\s*handling)\b/i,
    label: 'Forklift / plant licence',
  },
  {
    kind: 'taxi_phv',
    re: /\b(taxi|phv|private\s*hire|uber\s*driver|hackney)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(transport|driving|logistics|mobility)\b/i,
    label: 'Taxi / PHV licence',
  },
  {
    kind: 'warehouse_basic',
    re: /\b(warehouse\s*(operative|assistant|basic)|order\s*picker|picker\s*packer|amazon\s*warehouse)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(logistics|warehouse|supply\s*chain|operations)\b/i,
    label: 'Generic warehouse job-entry',
  },
  {
    kind: 'food_hygiene',
    re: /\b(food\s*(hygiene|safety|level\s*[12])|level\s*2\s*food)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(hospitality|food|nutrition|catering|culinary|chef|kitchen)\b/i,
    label: 'Food hygiene (non-hospitality)',
  },
  {
    kind: 'hospitality_basic',
    re: /\b(barista\s*(basics|course)|waiter\s*training|hospitality\s*basics)\b/i,
    primary_goal_paths: ['start_new_career', 'extra_income', 'work_in_experience'],
    allowedFieldRe: /\b(hospitality|tourism|events|food|catering)\b/i,
    label: 'Generic hospitality basics',
  },
]

/** Context string from user education field/specialism/routes for allow checks. */
export function fieldContextBlob(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function matchContamination(
  title: string,
  fieldContext: string
): { rule: ContaminationRule; allowedForField: boolean } | null {
  for (const rule of CONTAMINATION_RULES) {
    if (!rule.re.test(title)) continue
    const allowedForField = rule.allowedFieldRe.test(fieldContext)
    return { rule, allowedForField }
  }
  return null
}

/** CSCS is WIE-safe only for construction / built environment / site pathways. */
export function cscsAllowed(fieldContext: string, stageBlob: string): boolean {
  const site =
    /\b(construction|built\s*environment|civil|quantity\s*survey|architecture|site|surveying)\b/i.test(
      fieldContext
    ) || /\b(site|construction|technician|apprentice)\b/i.test(stageBlob)
  return site
}

export function isCscsTitle(title: string): boolean {
  return /\bcscs\b/i.test(title)
}

/** 18th Edition / ECS — electrical pathways only. */
export function electricalLicenceAllowed(fieldContext: string): boolean {
  return /\b(electrical|electrician|electronic|building\s*services|mechatronic)\b/i.test(
    fieldContext
  )
}

export function isElectricalLicenceTitle(title: string): boolean {
  return /\b(18th\s*edition|wiring\s*regulations|\becs\b|pat\s*testing|2391)\b/i.test(title)
}
