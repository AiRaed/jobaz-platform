/**
 * Compare active Career Plan with saved CV content.
 * Does not mutate CV or plan data.
 */

import { isMeaningfulCv, isPlaceholderText, type MeaningfulCvLike } from './isMeaningfulCv'
import { normalizeText } from '../cv-score'

export type PlanCvMatchKind = 'no_cv' | 'empty_cv' | 'mismatch' | 'partial_match' | 'good_match'

export type ActivePlanSignals = {
  routeTitle?: string | null
  pathId?: string | null
  currentTarget?: string | null
  nextUpgrade?: string | null
  targetRole?: string | null
  focusKeywords?: string[] | null
} | null

export type PlanCvMatchResult = {
  hasSavedCv: boolean
  cvHasMeaningfulContent: boolean
  planCvMatch: PlanCvMatchKind
  matchScore: number
  message: string
  matchedKeywords: string[]
  planKeywords: string[]
}

/** Default focus keywords for Security extra income / steward routes. */
export const SECURITY_PLAN_KEYWORDS = [
  'security',
  'event',
  'steward',
  'door supervisor',
  'sia',
  'customer service',
  'availability',
  'flexible',
  'right to work',
  'reliability',
  'crowd',
  'venue',
  'hospitality',
  'matchday',
]

const TRANSFERABLE = [
  'customer service',
  'communication',
  'teamwork',
  'reliable',
  'reliability',
  'flexible',
  'availability',
  'right to work',
  'hospitality',
]

function certBlob(cv: MeaningfulCvLike): string {
  if (!cv?.certifications?.length) return ''
  return cv.certifications
    .map((c) => {
      if (typeof c === 'string') return c
      return `${c.title || ''} ${c.name || ''}`
    })
    .join(' ')
    .toLowerCase()
}

function buildCvBlob(cv: MeaningfulCvLike): string {
  if (!cv) return ''
  const skills = Array.isArray(cv.skills)
    ? cv.skills.join(' ')
    : typeof cv.skills === 'string'
      ? cv.skills
      : ''
  const experience = (cv.experience || [])
    .map((e) =>
      [e.jobTitle, e.company, e.description, ...(e.bullets || [])].filter(Boolean).join(' ')
    )
    .join(' ')
  const education = (cv.education || [])
    .map((e) => [e.degree, e.school, e.field].filter(Boolean).join(' '))
    .join(' ')

  return [
    normalizeText(cv.summary),
    skills,
    experience,
    education,
    certBlob(cv),
    normalizeText(cv.fullName || cv.personalInfo?.fullName),
  ]
    .join(' ')
    .toLowerCase()
}

export function resolvePlanKeywords(plan: ActivePlanSignals): string[] {
  if (!plan) return []
  const fromPlan = (plan.focusKeywords || [])
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 3)

  const blob = `${plan.routeTitle || ''} ${plan.pathId || ''} ${plan.currentTarget || ''} ${
    plan.nextUpgrade || ''
  } ${plan.targetRole || ''}`.toLowerCase()

  const isSecurity =
    /security|sia|steward|door supervisor|matchday|event staff|extra.?income/.test(blob) ||
    /security|sia|steward/.test(fromPlan.join(' '))

  const base = isSecurity ? [...SECURITY_PLAN_KEYWORDS] : []

  const roleBits = [plan.currentTarget, plan.nextUpgrade, plan.targetRole, plan.routeTitle]
    .filter(Boolean)
    .flatMap((t) =>
      String(t)
        .toLowerCase()
        .split(/[\s,/|-]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 4)
    )

  const merged = [...new Set([...fromPlan, ...base, ...roleBits])]
  return merged.slice(0, 16)
}

function countHits(blob: string, keywords: string[]): string[] {
  const matched: string[] = []
  for (const kw of keywords) {
    const k = kw.toLowerCase().trim()
    if (k.length < 3) continue
    if (blob.includes(k)) matched.push(kw)
  }
  return matched
}

function messageFor(
  kind: PlanCvMatchKind,
  planTitle: string
): string {
  const title = planTitle || 'your current plan'
  switch (kind) {
    case 'no_cv':
      return 'No CV yet. Build a CV for this plan.'
    case 'empty_cv':
      return 'CV started but incomplete. Add real sections before you apply.'
    case 'mismatch':
      return `You have a saved CV, but it is not yet tailored for your ${title} plan.`
    case 'partial_match':
      return `Saved CV found. Needs tailoring for ${title}.`
    case 'good_match':
      return `Good match for your current plan: ${title}.`
  }
}

/**
 * Compare active plan signals with a saved CV payload.
 */
export function comparePlanToCv(
  cv: MeaningfulCvLike,
  plan: ActivePlanSignals,
  options?: { hasSavedCvRow?: boolean }
): PlanCvMatchResult {
  const hasSavedCv = options?.hasSavedCvRow ?? Boolean(cv)
  const planTitle = plan?.routeTitle || plan?.currentTarget || 'your current plan'
  const planKeywords = resolvePlanKeywords(plan)

  if (!hasSavedCv || !cv) {
    return {
      hasSavedCv: false,
      cvHasMeaningfulContent: false,
      planCvMatch: 'no_cv',
      matchScore: 0,
      message: messageFor('no_cv', planTitle),
      matchedKeywords: [],
      planKeywords,
    }
  }

  const meaningful = isMeaningfulCv(cv)
  if (!meaningful) {
    // Double-check classic placeholders
    const name = normalizeText(cv.fullName || cv.personalInfo?.fullName)
    const email = normalizeText(cv.email || cv.personalInfo?.email)
    const mostlyPlaceholder =
      isPlaceholderText(name) &&
      (isPlaceholderText(email) || /example\.com/i.test(email))

    return {
      hasSavedCv: true,
      cvHasMeaningfulContent: false,
      planCvMatch: 'empty_cv',
      matchScore: mostlyPlaceholder ? 5 : 10,
      message: messageFor('empty_cv', planTitle),
      matchedKeywords: [],
      planKeywords,
    }
  }

  if (!plan || planKeywords.length === 0) {
    return {
      hasSavedCv: true,
      cvHasMeaningfulContent: true,
      planCvMatch: 'partial_match',
      matchScore: 40,
      message: 'Saved CV found. Create a career plan to tailor it for a specific route.',
      matchedKeywords: [],
      planKeywords: [],
    }
  }

  const blob = buildCvBlob(cv)
  const matched = countHits(blob, planKeywords)
  const transferableHits = countHits(blob, TRANSFERABLE)
  const ratio = matched.length / Math.max(1, planKeywords.length)
  const hasRouteCert = /sia|door supervisor|security licence|security license/.test(blob)

  const summaryAndWork = [
    normalizeText(cv.summary),
    Array.isArray(cv.skills) ? cv.skills.join(' ') : normalizeText(cv.skills),
    (cv.experience || [])
      .map((e) => [e.jobTitle, e.company, e.description, ...(e.bullets || [])].join(' '))
      .join(' '),
  ]
    .join(' ')
    .toLowerCase()

  const routeInCoreContent =
    countHits(summaryAndWork, planKeywords).length >= 2 ||
    /security|steward|matchday|door supervisor|crowd|sia|event staff|venue steward/.test(
      summaryAndWork
    )

  const hasStrongRouteSignal =
    (matched.some((m) =>
      /security|steward|sia|door supervisor|matchday|crowd|venue/.test(m.toLowerCase())
    ) &&
      routeInCoreContent) ||
    (hasRouteCert && routeInCoreContent)

  let kind: PlanCvMatchKind
  let matchScore: number

  if (
    routeInCoreContent &&
    (ratio >= 0.35 || (hasStrongRouteSignal && matched.length >= 4))
  ) {
    kind = 'good_match'
    matchScore = Math.min(95, Math.round(55 + ratio * 40 + (hasRouteCert ? 8 : 0)))
  } else if (
    hasRouteCert ||
    matched.length >= 1 ||
    (transferableHits.length >= 2 && matched.length >= 0)
  ) {
    // Licence / a few keywords / transferable skills without a route-focused summary
    kind = matched.length === 0 && transferableHits.length < 2 && !hasRouteCert
      ? 'mismatch'
      : 'partial_match'
    if (kind === 'partial_match') {
      matchScore = Math.min(
        55,
        Math.round(
          28 +
            matched.length * 5 +
            transferableHits.length * 3 +
            (hasRouteCert ? 8 : 0) +
            (routeInCoreContent ? 6 : 0)
        )
      )
    } else {
      matchScore = Math.min(35, 12 + transferableHits.length * 3)
    }
  } else {
    kind = 'mismatch'
    matchScore = Math.min(35, 12 + transferableHits.length * 3)
  }

  return {
    hasSavedCv: true,
    cvHasMeaningfulContent: true,
    planCvMatch: kind,
    matchScore,
    message: messageFor(kind, planTitle),
    matchedKeywords: matched,
    planKeywords,
  }
}
