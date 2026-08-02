/**
 * Dual education + experience path balance — weighted pools, validation, rebalance.
 */

import {
  buildEducationPathRoles,
  buildExperiencePathRoles,
  buildPathwayProfile,
  mergeWeightedDualPaths,
} from './pathwayRecommendations'
import {
  getCareerDirectionPriority,
  getExperienceFieldText,
  getStudyFieldText,
  type CareerDirectionPriority,
} from './educationExperienceSplit'
import { getExperienceTier } from './entryClassification'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerProfile,
  PathOrigin,
} from './types'

export type RecommendationFieldSource = 'experience' | 'education' | 'mixed' | 'fallback'

export type DualPathWeights = {
  experience: number
  education: number
}

export type DualPathCandidatePools = {
  experiencePathCandidates: CareerBrainRecommendation[]
  educationPathCandidates: CareerBrainRecommendation[]
}

const LEGAL = /\b(legal|paralegal|casework|solicitor)\b/i
const HOSPITALITY = /\b(hospitality|hotel|barista|kitchen|housekeeping|front of house)\b/i
const RETAIL = /\b(retail|store|shop|supermarket|customer service)\b/i
const MARKETING = /\b(marketing|social media|communications|content)\b/i
const EDUCATION = /\b(teaching|learning support|education|school|pupil)\b/i
const ENGINEERING = /\b(engineer|engineering|cad|manufacturing|project coordinator)\b/i

export function getDualPathWeights(priority: CareerDirectionPriority | null): DualPathWeights {
  switch (priority) {
    case 'experience_field':
      return { experience: 0.7, education: 0.3 }
    case 'education_field':
      return { experience: 0.3, education: 0.7 }
    case 'both':
    case 'not_sure':
      return { experience: 0.5, education: 0.5 }
    case 'fast_employment':
      return { experience: 0.65, education: 0.35 }
    default:
      return { experience: 0.5, education: 0.5 }
  }
}

export function shouldApplyDualPathWeighting(
  state: CareerBrainState,
  profile: CareerProfile
): boolean {
  if (getExperienceTier(state) !== 'have_experience') return false
  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  if (!study.trim() || !exp.trim()) return false
  return getCareerDirectionPriority(state) !== null
}

function toFieldSource(origin?: PathOrigin): RecommendationFieldSource {
  if (origin === 'education') return 'education'
  if (origin === 'experience') return 'experience'
  if (origin === 'blended') return 'mixed'
  return 'fallback'
}

function pathwayToRecs(
  roles: Array<{ title: string; why: string; track: CareerBrainRecommendation['track']; origin?: PathOrigin }>,
  domain: CareerProfile['domain'],
  defaultOrigin: PathOrigin
): CareerBrainRecommendation[] {
  return roles.map((r) => ({
    title: r.title,
    why: r.why,
    track: r.track,
    field_tag: domain,
    domain,
    source: 'fallback' as const,
    pathOrigin: r.origin ?? defaultOrigin,
    fieldSource: toFieldSource(r.origin ?? defaultOrigin),
  }))
}

export function buildDualPathCandidatePools(
  profile: CareerProfile,
  state: CareerBrainState
): DualPathCandidatePools {
  const pp = buildPathwayProfile(state.answers ?? {})
  const eduBucket = buildEducationPathRoles(pp)
  const expBucket = buildExperiencePathRoles(pp)

  return {
    educationPathCandidates: pathwayToRecs(
      [...eduBucket.workNow, ...eduBucket.buildNext, ...eduBucket.longTerm],
      profile.domain,
      'education'
    ),
    experiencePathCandidates: pathwayToRecs(
      [...expBucket.workNow, ...expBucket.buildNext, ...expBucket.longTerm],
      profile.domain,
      'experience'
    ),
  }
}

function inferFieldSourceFromTitle(
  title: string,
  study: string,
  exp: string
): RecommendationFieldSource {
  const t = title.toLowerCase()
  const studyL = study.toLowerCase()
  const expL = exp.toLowerCase()

  const eduHit =
    (studyL.includes('law') && LEGAL.test(t)) ||
    (studyL.includes('education') && EDUCATION.test(t)) ||
    (/(media|marketing|communication)/.test(studyL) && MARKETING.test(t)) ||
    ((studyL.includes('arts') || studyL.includes('design') || studyL.includes('animation')) &&
      /\b(design|creative|content|production assistant|motion)\b/i.test(t)) ||
    (studyL.includes('engineering') && ENGINEERING.test(t))

  const expHit =
    (/hospitality|bar|hotel|kitchen/.test(expL) && HOSPITALITY.test(t)) ||
    (/retail|shop|store/.test(expL) && RETAIL.test(t)) ||
    (/marketing/.test(expL) && MARKETING.test(t))

  if (eduHit && expHit) return 'mixed'
  if (eduHit) return 'education'
  if (expHit) return 'experience'
  return 'fallback'
}

function roleFieldSource(
  rec: CareerBrainRecommendation,
  study: string,
  exp: string
): RecommendationFieldSource {
  if (rec.fieldSource) return rec.fieldSource
  if (rec.pathOrigin === 'education') return 'education'
  if (rec.pathOrigin === 'experience') return 'experience'
  if (rec.pathOrigin === 'blended') return 'mixed'
  return inferFieldSourceFromTitle(rec.title, study, exp)
}

function hasExperienceRepresentation(
  recs: CareerBrainRecommendation[],
  study: string,
  exp: string
): boolean {
  return recs.some((r) => {
    const src = roleFieldSource(r, study, exp)
    return src === 'experience' || src === 'mixed'
  })
}

function hasEducationRepresentation(
  recs: CareerBrainRecommendation[],
  study: string,
  exp: string
): boolean {
  return recs.some((r) => {
    const src = roleFieldSource(r, study, exp)
    return src === 'education' || src === 'mixed'
  })
}

function dedupeRecs(recs: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const out: CareerBrainRecommendation[] = []
  for (const rec of recs) {
    const key = `${rec.track}:${rec.title.toLowerCase()}`
    if (out.some((o) => `${o.track}:${o.title.toLowerCase()}` === key)) continue
    out.push(rec)
  }
  return out
}

function pickFromPool(
  pool: CareerBrainRecommendation[],
  track: CareerBrainRecommendation['track'],
  limit: number,
  exclude: Set<string>
): CareerBrainRecommendation[] {
  const out: CareerBrainRecommendation[] = []
  for (const rec of pool) {
    if (rec.track !== track) continue
    const key = rec.title.toLowerCase()
    if (exclude.has(key)) continue
    out.push(rec)
    exclude.add(key)
    if (out.length >= limit) break
  }
  return out
}

function trimDualPathOutput(recs: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const backup = recs.filter((r) => r.track === 'backup_income')
  const workNow = recs.filter((r) => r.track === 'work_now').slice(0, 3)
  const buildNext = recs.filter((r) => r.track === 'build_next').slice(0, 2)
  const longTerm = recs.filter((r) => r.track === 'long_term').slice(0, 2)
  return [...workNow, ...buildNext, ...longTerm, ...backup]
}

function longTermHasDualRepresentation(
  longTerm: CareerBrainRecommendation[],
  study: string,
  exp: string
): boolean {
  const hasExp = hasExperienceRepresentation(longTerm, study, exp)
  const hasEdu = hasEducationRepresentation(longTerm, study, exp)
  const hasHybrid = longTerm.some((r) => roleFieldSource(r, study, exp) === 'mixed')
  return (hasExp && hasEdu) || hasHybrid
}

export function ensureDualPathLongTermBalance(
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] {
  const priority = getCareerDirectionPriority(state)
  if ((priority !== 'both' && priority !== 'not_sure') || !shouldApplyDualPathWeighting(state, profile)) {
    return longTerm.slice(0, 2)
  }

  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  if (longTermHasDualRepresentation(longTerm, study, exp)) {
    return dedupeRecs(longTerm).slice(0, 2)
  }

  const pools = buildDualPathCandidatePools(profile, state)
  const used = new Set(longTerm.map((r) => r.title.toLowerCase()))
  let out = [...longTerm]

  const addFromPool = (
    pool: CareerBrainRecommendation[],
    source: Exclude<RecommendationFieldSource, 'fallback'>
  ) => {
    const pick = pool.find(
      (r) =>
        r.track === 'long_term' &&
        !used.has(r.title.toLowerCase()) &&
        roleFieldSource(r, study, exp) === source
    )
    if (!pick) return
    out.push(pick)
    used.add(pick.title.toLowerCase())
  }

  if (!hasExperienceRepresentation(out, study, exp)) {
    addFromPool(pools.experiencePathCandidates, 'experience')
  }
  if (!hasEducationRepresentation(out, study, exp)) {
    addFromPool(pools.educationPathCandidates, 'education')
  }

  if (!longTermHasDualRepresentation(out, study, exp)) {
    addFromPool(pools.experiencePathCandidates, 'experience')
    addFromPool(pools.educationPathCandidates, 'education')
  }

  return dedupeRecs(out).slice(0, 2)
}

export function buildDualPathSummaryLine(
  profile: CareerProfile,
  state: CareerBrainState
): string {
  const study = getStudyFieldText(state, profile) || 'your education field'
  const exp = getExperienceFieldText(state, profile) || 'your work experience'
  const priority = getCareerDirectionPriority(state)
  if (priority === 'both' || priority === 'not_sure') {
    return `This path balances ${study} and ${exp} — Work Now, Build Next, and Long-Term include roles from both backgrounds.`
  }
  if (priority === 'education_field') {
    return `This path prioritises ${study} (about 70%) while keeping realistic options from ${exp} (about 30%).`
  }
  if (priority === 'experience_field') {
    return `This path prioritises ${exp} (about 70%) while keeping options connected to ${study} (about 30%).`
  }
  return `This path targets fast UK employment using ${exp}, with ${study} kept in view for later progression.`
}

export type DualPathValidationResult = {
  valid: boolean
  issues: string[]
}

export function validateDualPathRecommendations(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState,
  summary?: string
): DualPathValidationResult {
  const issues: string[] = []
  if (!shouldApplyDualPathWeighting(state, profile)) {
    return { valid: true, issues }
  }

  const priority = getCareerDirectionPriority(state)
  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  const workNow = recs.filter((r) => r.track === 'work_now')
  const buildNext = recs.filter((r) => r.track === 'build_next')
  const longTermOnly = recs.filter((r) => r.track === 'long_term')

  if (priority === 'both' || priority === 'not_sure') {
    if (!hasExperienceRepresentation(workNow, study, exp)) {
      issues.push('Work Now missing experience-field representation')
    }
    if (!hasEducationRepresentation(workNow, study, exp)) {
      issues.push('Work Now missing education-field representation')
    }
    if (!hasEducationRepresentation(buildNext, study, exp)) {
      issues.push('Build Next missing education-field representation')
    }
    if (!hasExperienceRepresentation(buildNext, study, exp)) {
      issues.push('Build Next missing experience-field representation')
    }
    if (!longTermHasDualRepresentation(longTermOnly, study, exp)) {
      issues.push('Long-Term must include experience and education destinations (or one hybrid role)')
    }
  }

  return { valid: issues.length === 0, issues }
}

export function rebalanceDualPathRecommendations(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] {
  const priority = getCareerDirectionPriority(state)
  if (!priority || !shouldApplyDualPathWeighting(state, profile)) return recs

  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  const pools = buildDualPathCandidatePools(profile, state)
  const weights = getDualPathWeights(priority)
  const merged = mergeWeightedDualPaths(
    buildEducationPathRoles(buildPathwayProfile(state.answers ?? {})),
    buildExperiencePathRoles(buildPathwayProfile(state.answers ?? {})),
    priority,
    weights
  )

  const domain = profile.domain
  const fresh = dedupeRecs([
    ...pathwayToRecs(merged.workNow, domain, 'blended'),
    ...pathwayToRecs(merged.buildNext, domain, 'blended'),
    ...pathwayToRecs(merged.longTerm, domain, 'blended'),
  ])

  const backup = recs.filter((r) => r.track === 'backup_income')
  const used = new Set<string>()
  let workNow = recs.filter((r) => r.track === 'work_now')
  let buildNext = recs.filter((r) => r.track === 'build_next')
  let longTerm = recs.filter((r) => r.track === 'long_term')

  const validation = validateDualPathRecommendations(
    [...workNow, ...buildNext, ...longTerm],
    profile,
    state
  )

  if (validation.valid && priority !== 'both' && priority !== 'not_sure') {
    return trimDualPathOutput([...workNow, ...buildNext, ...longTerm, ...backup])
  }

  if (
    priority === 'both' ||
    priority === 'not_sure' ||
    !validation.valid
  ) {
    workNow = fresh.filter((r) => r.track === 'work_now')
    buildNext = fresh.filter((r) => r.track === 'build_next')
    longTerm = fresh.filter((r) => r.track === 'long_term')

    if (!hasExperienceRepresentation(workNow, study, exp)) {
      workNow = [
        ...pickFromPool(pools.experiencePathCandidates, 'work_now', 1, used),
        ...workNow,
      ]
    }
    if (!hasEducationRepresentation(workNow, study, exp)) {
      workNow = [
        ...pickFromPool(pools.educationPathCandidates, 'work_now', 1, used),
        ...workNow,
      ]
    }
    if (!hasEducationRepresentation([...buildNext, ...longTerm], study, exp)) {
      buildNext = [
        ...pickFromPool(pools.educationPathCandidates, 'build_next', 1, used),
        ...buildNext,
      ]
    }
    if (!hasExperienceRepresentation([...buildNext, ...longTerm], study, exp)) {
      buildNext = [
        ...pickFromPool(pools.experiencePathCandidates, 'build_next', 1, used),
        ...buildNext,
      ]
    }
    longTerm = ensureDualPathLongTermBalance(longTerm, profile, state)
  } else {
    const eduWeight = weights.education
    const workEduCount = eduWeight >= 0.5 ? 2 : 1
    const workExpCount = eduWeight >= 0.5 ? 1 : 2
    workNow = [
      ...pickFromPool(pools.experiencePathCandidates, 'work_now', workExpCount, used),
      ...pickFromPool(pools.educationPathCandidates, 'work_now', workEduCount, used),
    ]
    buildNext = [
      ...pickFromPool(pools.experiencePathCandidates, 'build_next', eduWeight >= 0.5 ? 1 : 2, used),
      ...pickFromPool(pools.educationPathCandidates, 'build_next', eduWeight >= 0.5 ? 2 : 1, used),
    ]
    longTerm = [
      ...pickFromPool(pools.experiencePathCandidates, 'long_term', eduWeight >= 0.5 ? 1 : 2, used),
      ...pickFromPool(pools.educationPathCandidates, 'long_term', eduWeight >= 0.5 ? 2 : 1, used),
    ]
  }

  return trimDualPathOutput(dedupeRecs([...workNow, ...buildNext, ...longTerm, ...backup]))
}

export function applyDualPathBalance(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] {
  if (!shouldApplyDualPathWeighting(state, profile)) return recs
  const balanced = rebalanceDualPathRecommendations(recs, profile, state)
  const validation = validateDualPathRecommendations(balanced, profile, state)
  if (!validation.valid) {
    return rebalanceDualPathRecommendations([], profile, state)
  }
  return balanced
}
