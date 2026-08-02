import type { EducationFieldId } from './types'
import {
  CERTIFICATION_OPTION_GROUPS,
  CERTIFICATION_QUESTION_TEXT,
  UNIVERSAL_CERTIFICATION_OPTIONS,
  type CertificationOptionDef,
} from './certificationOptionGroups'

export type CertificationMatchInput = {
  goal?: string
  educationField: EducationFieldId
  specialisation: string
  qualificationCountry?: string
  willingToTakeCourses?: string
  selectedRoutes?: string[]
  maxOptions?: number
}

export type CertificationMatchResult = {
  options: Array<{ value: string; label: string }>
  groups?: Array<{ label: string; options: Array<{ value: string; label: string }> }>
  questionText: string
  helperText?: string
}

const GROUP_LABELS: Record<string, string> = {
  professional_membership: 'Professional membership',
  qualification: 'UK qualifications',
  certificate: 'UK certificates',
  software_skill: 'Software & tools',
  licence: 'Licences & cards',
  course_type: 'Training & courses',
}

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function fieldMatches(option: CertificationOptionDef, field: EducationFieldId): boolean {
  return option.educationFields.includes(field)
}

function specialisationMatches(option: CertificationOptionDef, specialisation: string): boolean {
  if (!option.specialisations?.length) return true
  const spec = norm(specialisation)
  return option.specialisations.some((tag) => {
    const t = norm(tag)
    return spec === t || spec.includes(t) || t.includes(spec)
  })
}

function routeMatches(option: CertificationOptionDef, routes: string[]): boolean {
  if (!option.routes?.length || !routes.length) return false
  const routeSet = new Set(routes.map(norm))
  return option.routes.some((r) => routeSet.has(norm(r)))
}

function goalMatches(option: CertificationOptionDef, goal: string): boolean {
  if (!option.goals?.length) return true
  return option.goals.includes(goal)
}

function scoreOption(
  option: CertificationOptionDef,
  input: CertificationMatchInput
): number {
  const { educationField, specialisation, goal = 'work_in_education', willingToTakeCourses } = input

  if (!fieldMatches(option, educationField)) {
    return -5
  }

  let score = option.priority

  if (fieldMatches(option, educationField)) score += 5

  if (option.specialisations?.length) {
    if (specialisationMatches(option, specialisation)) score += 5
    else if (option.requiresSpecMatch) return -100
    else score -= 1
  } else {
    score += 2
  }

  if (routeMatches(option, input.selectedRoutes ?? [])) score += 3
  if (goalMatches(option, goal)) score += 2

  const outsideUk = (input.qualificationCountry ?? '').toLowerCase() === 'outside_uk'
  const openToCourses = willingToTakeCourses === 'yes'
  if (outsideUk && openToCourses && option.ukBridge) score += 2

  if (!openToCourses && option.optionType === 'course_type') score -= 3

  return score
}

function groupOptions(
  scored: Array<{ option: CertificationOptionDef; score: number }>
): CertificationMatchResult['groups'] {
  const byType = new Map<string, Array<{ value: string; label: string }>>()

  for (const { option } of scored) {
    const label = GROUP_LABELS[option.optionType] ?? 'Other'
    const list = byType.get(label) ?? []
    list.push({ value: option.key, label: option.label })
    byType.set(label, list)
  }

  return [...byType.entries()].map(([label, options]) => ({ label, options }))
}

export function getRelevantCertificationOptions(input: CertificationMatchInput): CertificationMatchResult {
  const maxOptions = input.maxOptions ?? 11

  const scored = CERTIFICATION_OPTION_GROUPS.map((option) => ({
    option,
    score: scoreOption(option, input),
  }))
    .filter(({ score }) => score >= 8)
    .sort((a, b) => b.score - a.score || b.option.priority - a.option.priority)

  const seen = new Set<string>()
  const selected: Array<{ value: string; label: string }> = []

  for (const { option } of scored) {
    if (seen.has(option.key)) continue
    seen.add(option.key)
    selected.push({ value: option.key, label: option.label })
    if (selected.length >= maxOptions) break
  }

  const options = [...selected, ...UNIVERSAL_CERTIFICATION_OPTIONS]

  const openToCourses = input.willingToTakeCourses === 'yes'
  const helperText = openToCourses
    ? 'Select anything you already hold or would consider completing in the UK.'
    : 'Select anything you already hold — you can still explore UK options later in your plan.'

  return {
    options,
    groups: groupOptions(
      scored.filter(({ option }) => selected.some((s) => s.value === option.key))
    ),
    questionText: CERTIFICATION_QUESTION_TEXT,
    helperText,
  }
}

export { CERTIFICATION_QUESTION_TEXT }
