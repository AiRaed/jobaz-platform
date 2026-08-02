/**
 * Deduplicate roadmap steps — same requirement must not appear twice under different ids/titles.
 */

import type { CourseEntry, CvImprovement, EssentialAction } from './planTypes'

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const ENIC_IDS = new Set(['enic', 'enic_fin', 'enic_elec', 'qual_recognition', 'uk_enic', 'uk_enic_statement'])

const TITLE_DEDUP_RULES: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /enic|qualification recognition|overseas qualification assessment|uk enic/i, key: 'uk_qualification_recognition' },
  { pattern: /experience mapping|experience &. qualification mapping/i, key: 'experience_mapping' },
  { pattern: /^improve english$/i, key: 'improve_english' },
  { pattern: /uk work experience/i, key: 'uk_work_experience' },
  { pattern: /uk driving licence|required uk licence/i, key: 'uk_driving_licence' },
  { pattern: /apply for uk roles/i, key: 'apply_uk_roles' },
  { pattern: /professional (body|membership)|chartered route|\b(IET|IMechE|ICE|IStructE)\b.*membership/i, key: 'professional_membership' },
  { pattern: /sage|xero|quickbooks|accounting software/i, key: 'accounting_software' },
  { pattern: /enhanced dbs/i, key: 'enhanced_dbs' },
  { pattern: /driver cpc/i, key: 'driver_cpc' },
  { pattern: /cscs card/i, key: 'cscs_card' },
  { pattern: /ecs card/i, key: 'ecs_card' },
  { pattern: /sia licence|sia door supervisor/i, key: 'sia_licence' },
]

export function essentialActionDedupKey(action: Pick<EssentialAction, 'id' | 'title'>): string {
  if (ENIC_IDS.has(action.id)) return 'uk_qualification_recognition'
  if (action.id === 'experience_mapping') return 'experience_mapping'
  if (action.id === 'improve_english') return 'improve_english'
  if (action.id === 'uk_experience') return 'uk_work_experience'
  if (action.id === 'driving') return 'uk_driving_licence'
  if (action.id === 'apply_uk_roles') return 'apply_uk_roles'

  for (const rule of TITLE_DEDUP_RULES) {
    if (rule.pattern.test(action.title)) return rule.key
  }

  return `${action.id}:${normalizeText(action.title)}`
}

export function dedupeEssentialActions(actions: EssentialAction[]): EssentialAction[] {
  const seen = new Set<string>()
  const out: EssentialAction[] = []

  for (const action of actions) {
    const key = essentialActionDedupKey(action)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(action)
  }

  return out
}

export function hasEssentialActionKey(
  actions: EssentialAction[],
  key: string
): boolean {
  return actions.some((a) => essentialActionDedupKey(a) === key)
}

export function dedupeCvImprovements(items: CvImprovement[]): CvImprovement[] {
  const seen = new Set<string>()
  const out: CvImprovement[] = []

  for (const item of items) {
    const key =
      ENIC_IDS.has(item.id) || /enic/i.test(item.title)
        ? 'uk_qualification_recognition_cv'
        : `${item.id}:${normalizeText(item.title)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }

  return out
}

export function dedupeCourses(courses: CourseEntry[]): CourseEntry[] {
  const seen = new Set<string>()
  const out: CourseEntry[] = []

  for (const course of courses) {
    const key = `${course.id}:${normalizeText(course.title)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(course)
  }

  return out
}

export function dedupeStringList(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = normalizeText(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}
