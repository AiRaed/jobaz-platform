/**
 * Final result polish — duplication, ranked confidence, consistency checks.
 */

import {
  inferCareerTrackFamily,
  type CareerTrackFamily,
} from './careerTrackAlignment'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import {
  normalizeProgressionTitle,
  titlesOverlapProgression,
} from './careerProgressionValidation'
import { rolePreferenceScore } from './globalPreferenceEngine'
import { getExperienceTier } from './entryClassification'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerPathRole,
  CareerProfile,
  NotRecommendedPath,
  PathConfidenceScore,
} from './types'

export function normalizeRoleLabel(title: string): string {
  return normalizeProgressionTitle(title)
}

export function rolesOverlap(a: string, b: string): boolean {
  return titlesOverlapProgression(a, b)
}

function entryAlternatives(title: string, family: CareerTrackFamily): string[] {
  const t = normalizeProgressionTitle(title)
  const byFamily: Partial<Record<CareerTrackFamily, Record<string, string[]>>> = {
    office_admin: {
      'office administrator': ['Admin Assistant', 'Data Entry Clerk'],
      'office admin': ['Admin Assistant', 'Data Entry Clerk'],
      'business administrator': ['Admin Assistant', 'Business Support Officer'],
      'operations coordinator': ['Admin Assistant', 'Office Admin Assistant'],
      'business support manager': ['Admin Assistant', 'Data Entry Clerk'],
    },
    driving_logistics: {
      'logistics coordinator': ['Warehouse Operative', 'Dispatch Assistant'],
      'transport planner': ['Delivery Driver', 'Transport Administrator'],
      'fleet supervisor': ['Warehouse Operative', 'Delivery Driver'],
    },
    customer_service: {
      'store manager': ['Retail Assistant', 'Customer Service Advisor'],
      'area manager': ['Senior Retail Assistant', 'Customer Service Advisor'],
    },
    legal: {
      paralegal: ['Legal Receptionist', 'Legal Admin Assistant'],
      'legal administrator': ['Legal Receptionist', 'Casework Assistant'],
    },
    it: {
      'it support specialist': ['IT Support Assistant', 'Helpdesk Assistant'],
      'systems administrator': ['Junior IT Support', 'Technical Support Assistant'],
    },
  }
  const map = byFamily[family] ?? {}
  for (const [key, alts] of Object.entries(map)) {
    if (t.includes(key) || key.includes(t)) return alts
  }
  if (/administrator|manager|coordinator|supervisor|specialist/i.test(t)) {
    if (family === 'office_admin') return ['Admin Assistant', 'Data Entry Clerk']
    if (family === 'customer_service') return ['Retail Assistant', 'Customer Service Advisor']
    if (family === 'driving_logistics') return ['Warehouse Operative', 'Delivery Driver']
  }
  return []
}

function isSeniorWorkNowTitle(title: string): boolean {
  const t = title.toLowerCase()
  if (
    /assistant|junior|trainee|entry|graduate|technician|r&d|project assistant|clerk|operative|porter|picker|packer|part-time/i.test(
      t
    )
  ) {
    return false
  }
  return /administrator|manager|coordinator|supervisor|specialist|planner|analyst|developer|paralegal/i.test(
    t
  )
}

/** Work Now = entry roles; Long-Term = progression — never the same title. */
export function ensureEntryLevelWorkNow(
  workNow: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (getSpecialisationRecommendations(state, profile)?.filter((r) => r.track === 'work_now').length) {
    return workNow
  }

  const family = inferCareerTrackFamily(workNow, profile, state)
  const used = new Set(workNow.map((w) => normalizeProgressionTitle(w.title)))

  return workNow.map((w) => {
    const overlapsLong = longTerm.some((l) => titlesOverlapProgression(w.title, l.title))
    const tooSenior = isSeniorWorkNowTitle(w.title)
    if (!overlapsLong && !tooSenior) return w

    for (const alt of entryAlternatives(w.title, family)) {
      const norm = normalizeProgressionTitle(alt)
      if (used.has(norm)) continue
      if (longTerm.some((l) => titlesOverlapProgression(alt, l.title))) continue
      used.add(norm)
      return {
        ...w,
        title: alt,
        why: `Work Now — realistic entry step on your path (progression toward ${w.title} comes later).`,
      }
    }
    return w
  })
}

export function removeLongTermWorkNowDuplicates(
  workNow: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[]
): CareerBrainRecommendation[] {
  return longTerm.filter(
    (l) => !workNow.some((w) => titlesOverlapProgression(w.title, l.title))
  )
}

export function collectRecommendedTitles(recs: CareerBrainRecommendation[]): string[] {
  return recs.filter((r) => r.track !== 'backup_income').map((r) => r.title)
}

export function rankPathConfidenceScores(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState,
  baseScores?: PathConfidenceScore[]
): PathConfidenceScore[] {
  const workNow = recs.filter((r) => r.track === 'work_now')
  const baseMap = new Map(baseScores?.map((s) => [s.title.toLowerCase(), s]) ?? [])

  const scored = workNow
    .map((r, index) => {
      const pref = rolePreferenceScore(r.title, 'work_now', profile, state)
      const existing = baseMap.get(r.title.toLowerCase())
      const blended = existing
        ? Math.round(existing.score * 0.45 + pref * 0.55)
        : Math.round(62 + pref * 0.35)
      return {
        title: r.title,
        track: r.track as PathConfidenceScore['track'],
        score: blended - index * 3,
        reason: existing?.reason ?? 'Profile fit',
      }
    })
    .sort((a, b) => b.score - a.score)

  const used = new Set<number>()
  let previous = 100
  return scored.map((item) => {
    let score = Math.max(35, Math.min(92, item.score))
    if (score >= previous) score = previous - 2
    while (used.has(score) && score > 36) score -= 1
    used.add(score)
    previous = score
    return { ...item, score }
  })
}

export function clampEmployabilityScore(
  score: number,
  profile: CareerProfile,
  state?: CareerBrainState
): number {
  const years = profile.yearsOfExperience ?? 0
  const tier = state ? getExperienceTier(state) : null
  const eng = profile.englishLevel ?? ''
  const hasLicence =
    (state?.answers?.cb_uk_driving_licence === 'yes') || profile.licences.length > 0
  const hasDegree =
    profile.educationLevel === 'degree' ||
    profile.educationLevel === 'postgrad' ||
    ['bachelors', 'masters', 'phd'].includes(String(state?.answers?.cb_first_job_education_level ?? ''))
  const ukExp =
    profile.experienceCountry === 'UK' ||
    state?.answers?.cb_experience_country === 'mostly_uk'
  const study = String(state?.answers?.cb_first_job_study_field ?? profile.studyField ?? '').toLowerCase()
  const exp = String(
    state?.answers?.cb_work_experience_field ?? profile.workExperienceField ?? ''
  ).toLowerCase()
  const lawMismatch =
    study.includes('law') &&
    !/legal|law|casework|paralegal/.test(exp) &&
    /hospitality|bar|hotel|kitchen|waiter|barista|retail/.test(exp)

  let min = 32
  let max = 52

  if (lawMismatch && !ukExp) {
    min = 58
    max = 74
  } else if (lawMismatch) {
    min = 62
    max = 76
  } else if (years >= 3 && ukExp) {
    min = 68
    max = 88
  } else if (years >= 1 && ukExp) {
    min = 58
    max = 82
  } else if (hasDegree && ukExp && (eng === 'fluent' || eng === 'good' || eng === 'comfortable')) {
    min = 55
    max = 78
  } else if (hasDegree && !ukExp && (eng === 'fluent' || eng === 'good' || eng === 'comfortable')) {
    min = 48
    max = 68
  } else if (eng === 'fluent' || eng === 'good' || eng === 'comfortable') {
    min = hasLicence ? 48 : 45
    max = hasLicence ? 68 : 62
  } else if (eng === 'basic') {
    min = 32
    max = 48
  } else if (tier === 'have_experience' && ukExp) {
    min = 52
    max = 72
  } else {
    min = 38
    max = 58
  }

  return Math.max(min, Math.min(max, Math.round(score)))
}

export type FinalPolishResult = {
  recs: CareerBrainRecommendation[]
  pathConfidence: PathConfidenceScore[]
  employabilityScore: number
  notRecommended: NotRecommendedPath[]
  issues: string[]
  polished: boolean
}

export function validateFinalResultConsistency(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState | undefined,
  pathConfidence: PathConfidenceScore[],
  notRecommended: NotRecommendedPath[]
): string[] {
  const issues: string[] = []
  const workNow = recs.filter((r) => r.track === 'work_now')
  const buildNext = recs.filter((r) => r.track === 'build_next')
  const longTerm = recs.filter((r) => r.track === 'long_term')
  const recommended = collectRecommendedTitles(recs)

  for (const w of workNow) {
    for (const l of longTerm) {
      if (titlesOverlapProgression(w.title, l.title)) {
        issues.push(`"${l.title}" duplicates Work Now role "${w.title}"`)
      }
    }
  }

  const workScores = pathConfidence.filter((p) => p.track === 'work_now')
  for (let i = 1; i < workScores.length; i++) {
    if (workScores[i].score >= workScores[i - 1].score) {
      issues.push('Path confidence scores are not ranked by priority')
      break
    }
  }

  for (const n of notRecommended) {
    if (recommended.some((t) => rolesOverlap(t, n.title))) {
      issues.push(`Not recommended "${n.title}" contradicts a recommended role`)
    }
  }

  if (profile.englishLevel === 'fluent' && profile.constraints.includes('non-physical')) {
    if (notRecommended.some((n) => /office admin/i.test(n.title))) {
      issues.push('Office/admin should not be "not recommended" for fluent English + office preference')
    }
  }

  if (workNow.length && buildNext.length && longTerm.length) {
    const family = inferCareerTrackFamily(workNow, profile, state)
    if (family === 'office_admin') {
      const buildBlob = buildNext.map((b) => b.title).join(' ').toLowerCase()
      if (/forklift|hgv/i.test(buildBlob) && !/microsoft office|business administration|bookkeeping|excel/i.test(buildBlob)) {
        issues.push('Build Next does not bridge office Work Now to Long-Term')
      }
    }
  }

  return issues
}

export function applyFinalResultPolish(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState | undefined,
  employabilityScore: number,
  pathConfidence: PathConfidenceScore[],
  notRecommended: NotRecommendedPath[]
): FinalPolishResult {
  let next = [...recs]
  const workNow = next.filter((r) => r.track === 'work_now')
  let buildNext = next.filter((r) => r.track === 'build_next')
  let longTerm = next.filter((r) => r.track === 'long_term')
  const backup = next.filter((r) => r.track === 'backup_income')

  let polishedWork = ensureEntryLevelWorkNow(workNow, longTerm, profile, state)
  let polishedLong = removeLongTermWorkNowDuplicates(polishedWork, longTerm)
  polishedWork = ensureEntryLevelWorkNow(polishedWork, polishedLong, profile, state)
  polishedLong = removeLongTermWorkNowDuplicates(polishedWork, polishedLong)

  next = [...polishedWork, ...backup, ...buildNext, ...polishedLong]

  let rankedConfidence = rankPathConfidenceScores(next, profile, state, pathConfidence)
  let clampedScore = clampEmployabilityScore(employabilityScore, profile, state)
  let filteredNotRec = notRecommended

  let issues = validateFinalResultConsistency(next, profile, state, rankedConfidence, filteredNotRec)
  let polished = polishedWork !== workNow || polishedLong.length !== longTerm.length

  if (issues.length) {
    rankedConfidence = rankPathConfidenceScores(next, profile, state, rankedConfidence)
    polished = true
  }

  return {
    recs: next,
    pathConfidence: rankedConfidence,
    employabilityScore: clampedScore,
    notRecommended: filteredNotRec,
    issues,
    polished,
  }
}

export function workNowAsRecs(roles: CareerPathRole[]): CareerBrainRecommendation[] {
  return roles.map((r) => ({
    title: r.title,
    why: r.why,
    track: 'work_now' as const,
    field_tag: r.domain,
    domain: r.domain,
    source: r.source ?? ('fallback' as const),
  }))
}
