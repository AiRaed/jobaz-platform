/**
 * Global preference weighting — physical, customer-facing, office, English, UK experience.
 * Applies to ALL career paths before final output.
 */

import { rec } from './resultBuilder'
import {
  applyEnglishConfidenceRules,
  buildEnglishConfidenceReasoning,
  englishConfidenceRoleScore,
  getEnglishConfidenceRules,
  normalizeEnglishConfidenceLevel,
} from './englishConfidenceRules'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import {
  buildNextConflictsWithTrack,
  inferCareerTrackFamily,
  isStudyAlignedProgression,
  longTermMatchesTrack,
} from './careerTrackAlignment'
import { isCareerTrackLocked, isFieldOnlyLock, isRoleAlignedWithLockedField } from './careerTrackLock'
import { getSpecialisationRecommendations, specialisationRoleKeywords } from './fieldSpecialisation'
import { wantsDualPathMode } from './dualPathMode'
import { resolveWorkStyle } from './workStylePreferences'

const PHYSICAL_PATTERN =
  /warehouse|forklift|picker|packer|kitchen porter|cleaner|delivery|driver|courier|construction|site labour|cscs|loader|operative|hgv|manufacturing|production operative/i

const OFFICE_LOW_ENGLISH_OK =
  /data entry|dispatch|scheduling|transport admin|warehouse admin|digital support|back.?office|production assistant/i

const OFFICE_PATTERN =
  /admin|reception|data entry|office|clerical|dispatch|scheduling|transport admin|coordinator|paralegal|bookkeep|finance admin|digital support|remote support|helpdesk|it support/i

const CUSTOMER_HEAVY =
  /retail assistant|barista|waiter|waitress|hospitality|sales assistant|receptionist|customer service|call centre|host\b|front of house/i

const COMMUNICATION_HEAVY =
  /reception|customer service|sales|call centre|legal assistant|paralegal|teacher|nurse|account manager|consultant|coordinator.*customer/i

const SENIOR_PROFESSIONAL =
  /senior|manager|director|lead |head of|consultant|specialist|analyst|developer|engineer|solicitor|accountant/i

function hasLittleUkExperience(profile: CareerProfile): boolean {
  if ((profile.yearsOfExperience ?? 0) === 0) return true
  if (profile.experienceCountry === 'non-UK') return true
  return false
}

function isBasicEnglish(profile: CareerProfile): boolean {
  return profile.englishLevel === 'basic'
}

function isWeakEnglish(profile: CareerProfile): boolean {
  return (
    profile.englishLevel === 'basic' ||
    profile.englishLevel === 'intermediate' ||
    profile.englishLevel === 'functional'
  )
}

/** Weighted fit score — higher = better match to stated preferences. */
export function rolePreferenceScore(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): number {
  const t = title.toLowerCase()
  let score = 50
  const style = resolveWorkStyle(profile, state)
  const specKw = specialisationRoleKeywords(state)

  if (specKw?.test(t)) {
    score += 40
  }

  if (profile.constraints.includes('non-physical')) {
    if (PHYSICAL_PATTERN.test(t) && !(specKw?.test(t))) score -= 45
    if (OFFICE_PATTERN.test(t)) score += 25
    if (/transport admin|dispatch|scheduling coordinator|data entry/i.test(t)) score += 20
  }

  if (profile.constraints.includes('physical-work') || style === 'physical') {
    if (PHYSICAL_PATTERN.test(t)) score += 22
    if (OFFICE_PATTERN.test(t) && !/transport|dispatch|logistics coordinator/i.test(t)) score -= 15
  }

  if (profile.constraints.includes('no-customer-facing')) {
    if (CUSTOMER_HEAVY.test(t)) score -= 40
    if (/warehouse|data entry|back.?office|production|technical support|helpdesk/i.test(t)) score += 18
  }

  if (style === 'people' || String(state?.answers?.cb_entry_work_preference) === 'customer_facing') {
    if (CUSTOMER_HEAVY.test(t)) score += 20
  }

  if (normalizeEnglishConfidenceLevel(profile.englishLevel)) {
    score += englishConfidenceRoleScore(title, track, profile)
  } else if (isBasicEnglish(profile)) {
    if (COMMUNICATION_HEAVY.test(t) && track === 'work_now') score -= 35
    if (OFFICE_LOW_ENGLISH_OK.test(t) || PHYSICAL_PATTERN.test(t)) score += 15
  } else if (isWeakEnglish(profile) && COMMUNICATION_HEAVY.test(t) && track === 'work_now') {
    score -= 12
  }

  if (hasLittleUkExperience(profile) && track === 'work_now') {
    if (SENIOR_PROFESSIONAL.test(t) && !(specKw?.test(t))) score -= 30
    if (/assistant|operative|support|entry|junior|trainee|part-time|porter|picker|technician/i.test(t)) {
      score += 15
    }
  }

  if (track === 'work_now' && /forklift licence|hgv training|sia licence|cscs/i.test(t)) score -= 20

  return score
}

function injectAlignedRoles(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const style = resolveWorkStyle(profile, state)
  const workNow = recs.filter((r) => r.track === 'work_now')
  const titles = new Set(workNow.map((r) => r.title.toLowerCase()))
  const extras: CareerBrainRecommendation[] = []
  let injected = 0
  const maxInject = 2

  const add = (title: string, why: string, domain: CareerProfile['domain']) => {
    if (injected >= maxInject) return
    const key = title.toLowerCase()
    if (titles.has(key)) return
    if (/warehouse/i.test(key) && [...titles].some((t) => /warehouse/i.test(t))) return
    extras.push(rec(title, why, 'work_now', domain))
    titles.add(key)
    injected++
  }

  const fieldCommitted =
    profile.constraints.includes('bridge-role-mode') ||
    profile.constraints.includes('field-only-mode') ||
    profile.constraints.includes('field-first-education') ||
    !!specialisationRoleKeywords(state)

  const engRules = getEnglishConfidenceRules(profile.englishLevel)

  if (!fieldCommitted && (profile.constraints.includes('non-physical') || style === 'office')) {
    if (!engRules || engRules.allowOffice) {
      add(
        'Data Entry Clerk',
        'Work Now — non-physical office task; fits your preference for less heavy work',
        'admin_business'
      )
      add(
        'Office Administrator',
        'Work Now — entry admin role aligned with non-physical preference',
        'admin_business'
      )
      if (!engRules || engRules.allowCustomerFacing) {
        add(
          'Receptionist',
          'Work Now — front desk with lighter physical demand than warehouse work',
          'admin_business'
        )
      }
    }
    add(
      'Transport Administrator',
      'Work Now — logistics office role without heavy warehouse lifting',
      'driving_logistics'
    )
    add(
      'Dispatch Assistant',
      'Work Now — scheduling and coordination; non-physical logistics entry',
      'driving_logistics'
    )
  }

  if (profile.constraints.includes('no-customer-facing')) {
    add(
      'Data Entry Clerk',
      'Work Now — back-office role with minimal customer contact',
      'admin_business'
    )
  }

  if (isBasicEnglish(profile) && ![...titles].some((t) => /kitchen porter|warehouse|cleaner|factory|labourer/i.test(t))) {
    add(
      'Kitchen Porter',
      'Work Now — lower spoken-English barrier while you build UK work history',
      'hospitality'
    )
  }

  return [...recs, ...extras]
}

function filterByThreshold(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const byTrack = (track: CareerBrainRecommendation['track']) =>
    recs.filter((r) => r.track === track)

  const filterTrack = (track: CareerBrainRecommendation['track'], minKeep: number) => {
    const items = byTrack(track)
    if (track === 'backup_income') return items

    const specPack = getSpecialisationRecommendations(state, profile)
    if (track === 'work_now' && specPack?.filter((r) => r.track === 'work_now').length) {
      return items.slice(0, 4)
    }

    const workNowMin =
      track === 'work_now' && (isFieldOnlyLock(state ?? { answers: {} }, profile) || specialisationRoleKeywords(state))
        ? Math.max(minKeep, 3)
        : minKeep
    const scored = items
      .map((r) => ({ r, score: rolePreferenceScore(r.title, track, profile, state) }))
      .sort((a, b) => b.score - a.score)
    const kept = scored.filter((s, i) => s.score >= 20 || i < workNowMin).map((s) => s.r)
    return kept.length ? kept : scored.slice(0, workNowMin).map((s) => s.r)
  }

  return [
    ...filterTrack('work_now', 2),
    ...filterTrack('build_next', 2),
    ...filterTrack('long_term', 2),
    ...byTrack('backup_income'),
  ]
}

function filterTracksByPreferences(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const workNow = recs.filter((r) => r.track === 'work_now')
  if (!workNow.length) return recs

  const family = inferCareerTrackFamily(workNow, profile, state)

  return recs.filter((r) => {
    if (isCareerTrackLocked(state ?? { answers: {} }, profile)) {
      if (!isRoleAlignedWithLockedField(r.title, r.track, profile, state)) return false
    }
    if (r.track === 'work_now' || r.track === 'backup_income') return true
    if (wantsDualPathMode(profile, state) && isStudyAlignedProgression(r.title, profile)) return true
    if (r.track === 'build_next') {
      if (buildNextConflictsWithTrack(r.title, family)) return false
      if (/forklift|hgv|cpc|cscs construction/i.test(r.title) && family === 'office_admin') return false
    }
    if (r.track === 'long_term') {
      if (!longTermMatchesTrack(r.title, family)) return false
    }
    return true
  })
}

export function applyGlobalRecommendationRules(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (profile.constraints.includes('pathway-deterministic-locked')) {
    return applyEnglishConfidenceRules(recs, profile, state)
  }

  let next = injectAlignedRoles(recs, profile, state)
  next = applyEnglishConfidenceRules(next, profile, state)
  next = filterByThreshold(next, profile, state)
  next = filterTracksByPreferences(next, profile, state)

  const rankTrack = (track: CareerBrainRecommendation['track']) => {
    const items = next.filter((r) => r.track === track)
    const rest = next.filter((r) => r.track !== track)
    const sorted = [...items].sort(
      (a, b) =>
        rolePreferenceScore(b.title, track, profile, state) -
        rolePreferenceScore(a.title, track, profile, state)
    )
    return [...rest, ...sorted]
  }

  next = [
    ...rankTrack('work_now'),
    ...rankTrack('build_next'),
    ...rankTrack('long_term'),
    ...next.filter((r) => r.track === 'backup_income'),
  ]

  return next
}

export function buildGlobalPreferenceReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const lines: string[] = ['Global profile weighting applied — preferences, English, and UK experience shape recommendations.']
  if (profile.constraints.includes('non-physical')) {
    lines.push('Non-physical preference: reduced heavy warehouse/construction roles; boosted office, dispatch, and admin options.')
  }
  if (profile.constraints.includes('physical-work')) {
    lines.push('Physical work preference: boosted warehouse, logistics, delivery, and practical roles.')
  }
  if (profile.constraints.includes('no-customer-facing')) {
    lines.push('Not customer-facing: reduced retail/hospitality front-of-house; boosted back-office and operational roles.')
  }
  if (normalizeEnglishConfidenceLevel(profile.englishLevel)) {
    lines.push(...buildEnglishConfidenceReasoning(profile))
  } else if (isBasicEnglish(profile)) {
    lines.push('Basic English: prioritised lower-communication Work Now roles; English development plan included.')
  }
  if (hasLittleUkExperience(profile)) {
    lines.push('Limited UK work history: Work Now focuses on fast-hiring entry roles that build local references.')
  }
  const pref = String(state?.answers?.cb_entry_work_preference ?? '')
  if (pref === 'customer_facing') lines.push('Customer-facing preference applied to role ranking.')
  return lines
}
