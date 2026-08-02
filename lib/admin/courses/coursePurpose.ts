/** Canonical course purpose labels — used by admin, cards, and Career Assistant. */
export const COURSE_PURPOSE_OPTIONS = [
  'Job-entry / Licence',
  'Career starter',
  'CV booster',
  'CPD add-on',
  'Career growth',
  'Advanced qualification',
  'Renewal / Top-up',
] as const

export type CoursePurpose = (typeof COURSE_PURPOSE_OPTIONS)[number]

const PURPOSE_LOOKUP = new Map(
  COURSE_PURPOSE_OPTIONS.map((purpose) => [purpose.toLowerCase(), purpose])
)

export function normalizeCoursePurpose(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return ''
  return PURPOSE_LOOKUP.get(trimmed.toLowerCase()) ?? trimmed
}

export function isKnownCoursePurpose(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return false
  return (
    PURPOSE_LOOKUP.has(trimmed.toLowerCase()) ||
    COURSE_PURPOSE_OPTIONS.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())
  )
}

/** Career Assistant intent buckets (future use). */
export type CoursePurposeIntent =
  | 'urgent_job_entry'
  | 'cv_improvement'
  | 'career_growth'
  | 'advanced_progression'
  | 'licence_renewal'

export function coursePurposeIntent(purpose: string | null | undefined): CoursePurposeIntent | null {
  const normalized = normalizeCoursePurpose(purpose)
  if (!normalized) return null
  if (normalized === 'Job-entry / Licence' || normalized === 'Career starter') return 'urgent_job_entry'
  if (normalized === 'CV booster' || normalized === 'CPD add-on') return 'cv_improvement'
  if (normalized === 'Career growth') return 'career_growth'
  if (normalized === 'Advanced qualification') return 'advanced_progression'
  if (normalized === 'Renewal / Top-up') return 'licence_renewal'
  return null
}
