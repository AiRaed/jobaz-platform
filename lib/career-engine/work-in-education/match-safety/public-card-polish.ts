/**
 * Public WIE role-card polish: dedupe copy, immediate demotion signals, future soft language.
 */

import { isHumanitiesSocialSciencesRoute } from './humanities-polish'
import type { SafetyMatchType } from './classify-role'

/** Soft future-route line — prefer over repeated warning blocks. */
export const FUTURE_ROUTE_SOFT_LINE =
  'Future route — useful after more experience, further study, or stronger evidence.'

/** Text that means a role must not stay Best Immediate. */
export const IMMEDIATE_BLOCKER_TEXT_RE =
  /\b(more relevant experience is typically needed|more relevant experience|\d+\+?\s*years?\s*(needed|required|typically|experience)|2\+?\s*years?|4\+?\s*years?|6\+?\s*years?|10\+?\s*years?|future option|future\/progression|academic progression|further study may be needed|seniority (is )?above|above your (current )?career stage|role stage is (substantially )?above|requires more relevant experience|not your first step)\b/i

/** HSS titles that may be Best Immediate when otherwise eligible. */
const HSS_IMMEDIATE_TITLE_RE =
  /\b(research\s+assistant|social\s+research\s+assistant|policy\s+support\s+officer|charity\s*(\/\s*ngo)?\s*project\s+assistant|charity\s+project\s+assistant|community\s+engagement\s+(assistant|officer)|project\s+coordinator|programme\s+assistant|program\s+assistant|ngo\s*\/?\s*charity\s+administrator|public\s+sector\s+(officer|research\s+assistant)|outreach\s+coordinator)\b/i

/** HSS titles that must not be Best Immediate without a clearly supporting senior stage + experience. */
const HSS_BLOCKED_IMMEDIATE_TITLE_RE =
  /\b(doctoral\s+researcher|lecturer|senior\s+|programme\s+lead|program\s+lead|research\s+lead|research\s*\/\s*programme\s+lead|professor|research\s+fellow|academic\s+researcher|(^|[^a-z])researcher(\s*\/\s*researcher)?($|[^a-z])|anthropology\s+researcher)\b/i

export function normalizePublicLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Deduplicate lines (case/whitespace insensitive), preserving order. */
export function dedupePublicLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of lines) {
    const t = (raw ?? '').replace(/\s+/g, ' ').trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

/**
 * Remove requirement lines that already appear in why (or near-duplicates).
 */
export function dedupeRequirementsAgainstWhy(why: string[], requirements: string[]): string[] {
  const whyKeys = new Set(why.map(normalizePublicLine))
  return dedupePublicLines(requirements).filter((r) => !whyKeys.has(normalizePublicLine(r)))
}

export function textBlocksBestImmediate(text: string): boolean {
  return IMMEDIATE_BLOCKER_TEXT_RE.test(text)
}

export function linesBlockBestImmediate(lines: string[]): boolean {
  return lines.some((l) => textBlocksBestImmediate(l))
}

export function isHssPreferredImmediateTitle(title: string): boolean {
  return HSS_IMMEDIATE_TITLE_RE.test(title)
}

export function isHssBlockedImmediateTitle(title: string): boolean {
  // Prefer allowlist: "Researcher" alone is blocked, but "Research Assistant" is allowed.
  if (HSS_IMMEDIATE_TITLE_RE.test(title)) return false
  return HSS_BLOCKED_IMMEDIATE_TITLE_RE.test(title)
}

export function shouldForceDemoteImmediateForTitle(
  title: string,
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null,
  yearsExperience = 0
): SafetyMatchType | null {
  if (!isHumanitiesSocialSciencesRoute(fieldName, specialismName, fieldSlug)) return null
  if (isHssBlockedImmediateTitle(title)) {
    if (/doctoral|lecturer|professor|research\s+fellow|academic/i.test(title)) {
      return 'future_career_option'
    }
    if (/senior|lead|researcher/i.test(title) && yearsExperience < 3) {
      return 'future_career_option'
    }
    return 'developing_match'
  }
  return null
}

/**
 * If classified as best immediate but copy/experience signals say otherwise, demote.
 */
export function demoteImmediateMatchType(input: {
  matchType: SafetyMatchType
  title: string
  whyLines?: string[]
  requirementLines?: string[]
  yearsExperience?: number
  minimumExperienceYears?: number
  hasExperienceBlocker?: boolean
  hasAcademicBlocker?: boolean
  fieldName?: string | null
  specialismName?: string | null
  fieldSlug?: string | null
}): SafetyMatchType {
  if (input.matchType !== 'best_immediate_route') return input.matchType

  const years = input.yearsExperience ?? 0
  const minYears = input.minimumExperienceYears ?? 0

  const titleDemote = shouldForceDemoteImmediateForTitle(
    input.title,
    input.fieldName,
    input.specialismName,
    input.fieldSlug,
    years
  )
  if (titleDemote) return titleDemote

  if (input.hasAcademicBlocker) return 'future_career_option'

  if (minYears >= 2 && years < minYears) {
    return minYears >= 4 ? 'future_career_option' : 'developing_match'
  }

  if (input.hasExperienceBlocker && years < 2) {
    return 'developing_match'
  }

  const allLines = [...(input.whyLines ?? []), ...(input.requirementLines ?? [])]
  if (linesBlockBestImmediate(allLines)) {
    if (allLines.some((l) => /academic progression|further study|doctoral|lecturer/i.test(l))) {
      return 'future_career_option'
    }
    if (allLines.some((l) => /\d+\+?\s*years?|seniority|above your|future option/i.test(l))) {
      return 'future_career_option'
    }
    return 'developing_match'
  }

  // HSS: only allow preferred practical titles as immediate when experience is thin
  if (
    isHumanitiesSocialSciencesRoute(input.fieldName, input.specialismName, input.fieldSlug) &&
    years < 2 &&
    !isHssPreferredImmediateTitle(input.title) &&
    !/\b(assistant|coordinator|officer|administrator|trainee|junior)\b/i.test(input.title)
  ) {
    return 'developing_match'
  }

  return 'best_immediate_route'
}

export function polishFutureRouteCopy(input: {
  why: string[]
  requirements: string[]
}): { why: string[]; requirements: string[] } {
  const why = dedupePublicLines(input.why).filter((l) => !textBlocksBestImmediate(l) || /suitable|matches|specialism|field/i.test(l))
  // Keep one clear future line; drop repeated scary experience/study warnings
  const cleanedWhy = why.filter(
    (l) =>
      !/more relevant experience|further study may be needed|future option|not your first step|qualification evidence/i.test(
        l
      )
  )
  return {
    why: dedupePublicLines([FUTURE_ROUTE_SOFT_LINE, ...cleanedWhy]).slice(0, 5),
    requirements: [],
  }
}

export function polishPublicRoleCopy(input: {
  matchType: SafetyMatchType | undefined
  why: string[]
  requirements: string[]
}): { why: string[]; requirements: string[] } {
  let why = dedupePublicLines(input.why)
  let requirements = dedupeRequirementsAgainstWhy(why, input.requirements)

  if (input.matchType === 'future_career_option' || input.matchType === 'not_recommended_now') {
    return polishFutureRouteCopy({ why, requirements })
  }

  // Collapse near-duplicate soft employer lines across sections
  const softEmployer = /some employers may ask|qualification evidence|portfolio or writing/i
  const softInWhy = why.some((l) => softEmployer.test(l))
  if (softInWhy) {
    requirements = requirements.filter((l) => !softEmployer.test(l))
  }

  return { why, requirements }
}
