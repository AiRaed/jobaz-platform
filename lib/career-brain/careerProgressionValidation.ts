/**
 * Career ladder validation — strict WORK NOW → BUILD NEXT → LONG-TERM stages.
 * No recommendation may appear in more than one column.
 */

import {
  buildNextConflictsWithTrack,
  buildNextMatchesTrack,
  getTrackLadder,
  inferCareerTrackFamily,
  isStudyAlignedProgression,
  longTermMatchesTrack,
} from './careerTrackAlignment'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import {
  DOMAIN_PROGRESSION_LADDERS,
  inferProfessionalDomain,
  repairLongTermForFieldConsistency,
  userWantsFieldAlignedCareer,
  validateFieldCareerConsistencyIssues,
} from './fieldCareerConsistency'
import { ensureEntryLevelWorkNow, removeLongTermWorkNowDuplicates } from './resultPolish'
import { ensureDualPathLongTermBalance } from './dualPathBalance'
import { getCareerDirectionPriority } from './educationExperienceSplit'
import { wantsDualPathMode } from './dualPathMode'
import { prefersDirectEmployment } from './speedDevelopmentMode'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export function normalizeProgressionTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*\(part-time\)\s*/gi, ' ')
    .replace(/\s*\(uk\)\s*/gi, ' ')
    .replace(/\s*\(retail\/hospitality\)\s*/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titlesOverlapProgression(a: string, b: string): boolean {
  const na = normalizeProgressionTitle(a)
  const nb = normalizeProgressionTitle(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.length >= 6 && nb.length >= 6 && (na.includes(nb) || nb.includes(na))) return true
  return false
}

/** Training, licences, certificates — primary BUILD NEXT content. */
export function isTrainingOrLicence(title: string): boolean {
  const t = title.toLowerCase()
  if (isFirstProgressionRole(title)) return false
  return (
    /certif|licen[cs]e|licence|qualification|course|training|\bcard\b|cscs|\bsia\b|flt|comp tia|aat|nvq|hnc|btec|solidworks|cloud fundamentals|process safety|18th edition|first aid|food safety|excel|microsoft office|bookkeeping|crm|customer service cert|team leader training|data analysis|project coordination|fundamentals|preparation|basics|short course|interpreting certificate|digital skills|administration certificate|research skills|supervisor course|digital support \/ admin|hgv|cpc|cctv licence|logistics.*transport|transport course|google it support|networking skills|care certificate|moving & handling|nhs preparation|bookkeeping certificate|video editing short|motion graphics fundamentals|content production short|teaching assistant preparation|health & safety site|comptia|technical cert|graduate software|graduate process|graduate civil|portfolio development|cv workshop|skills workshop|workshop/i.test(
      t
    ) ||
    /^forklift licence|^sia security|^cscs construction|^care assistant certification/i.test(t)
  )
}

/** First progression role after initial experience — valid in BUILD NEXT only. */
export function isFirstProgressionRole(title: string): boolean {
  const t = title.toLowerCase()
  return (
    /senior (warehouse|retail|driver|care|healthcare)|team leader(?! training)|security team leader|shift supervisor|senior picker|senior operative|team leader \(warehouse\)|team leader \(retail\)/i.test(
      t
    ) || /^forklift operator$/i.test(t.trim())
  )
}

/** Valid BUILD NEXT: training, first progression, or bridge step after Work Now. */
export function isBuildNextEligible(title: string): boolean {
  if (isTrainingOrLicence(title)) return true
  if (isFirstProgressionRole(title)) return true
  return /junior|assistant|trainee|\(entry\)|admin \(entry\)|apprentice|associate|coordinator/i.test(
    title.toLowerCase()
  )
}

const ADVANCED_ROLE_PATTERN =
  /supervisor|manager|coordinator|planner|director|executive|specialist|administrator|analyst|engineer|developer|paralegal|solicitor|accountant|head of|regional|area manager|operations manager|fleet manager|store manager|pathway$/i

/** Long-Term Path = advanced destinations only — never training. */
export function isCareerDestinationRole(title: string): boolean {
  if (isTrainingOrLicence(title)) return false
  if (isFirstProgressionRole(title)) return false
  if (/^forklift licence|^hgv training|^sia licence|^cscs card|^care certificate|^legal administration training|^excel for business/i.test(title.toLowerCase())) {
    return false
  }
  return true
}

export function isAdvancedCareerDestination(title: string): boolean {
  return isCareerDestinationRole(title) && ADVANCED_ROLE_PATTERN.test(title)
}

function dedupeWithinTrack(items: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const out: CareerBrainRecommendation[] = []
  for (const item of items) {
    if (out.some((o) => titlesOverlapProgression(o.title, item.title))) continue
    out.push(item)
  }
  return out
}

export function findCrossColumnDuplicates(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[]
): string[] {
  const issues: string[] = []

  for (const w of workNow) {
    for (const b of buildNext) {
      if (titlesOverlapProgression(w.title, b.title)) {
        issues.push(`"${b.title}" (Build Next) duplicates "${w.title}" (Work Now)`)
      }
    }
    for (const l of longTerm) {
      if (titlesOverlapProgression(w.title, l.title) && !isAdvancedCareerDestination(l.title)) {
        issues.push(`"${l.title}" (Long-Term) duplicates "${w.title}" (Work Now)`)
      }
    }
  }

  for (const b of buildNext) {
    for (const l of longTerm) {
      if (titlesOverlapProgression(b.title, l.title)) {
        issues.push(`"${l.title}" (Long-Term) duplicates "${b.title}" (Build Next)`)
      }
    }
  }

  return issues
}

/** Detect when one destination dominates every Work Now / Build Next card. */
export function findExcessiveRoleRepetition(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[]
): string[] {
  const issues: string[] = []
  const upwardCards = [...workNow, ...buildNext]

  for (const lt of longTerm) {
    const norm = normalizeProgressionTitle(lt.title)
    if (upwardCards.length < 2) continue
    const cardsMentioning = upwardCards.filter((r) =>
      normalizeProgressionTitle(r.why).includes(norm)
    ).length
    if (cardsMentioning >= upwardCards.length) {
      issues.push(`"${lt.title}" appears in every card — vary the progression ladder`)
    }
  }

  const longNorms = longTerm.map((r) => normalizeProgressionTitle(r.title))
  const uniqueLong = new Set(longNorms)
  if (longTerm.length >= 3 && uniqueLong.size < Math.min(3, longTerm.length)) {
    issues.push('Long-Term Path needs more varied destination roles — not the same title repeated')
  }

  return issues
}

export type ProgressionValidationResult = {
  valid: boolean
  issues: string[]
}

export function validateCareerProgression(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile?: CareerProfile,
  state?: CareerBrainState
): ProgressionValidationResult {
  const issues: string[] = [
    ...findCrossColumnDuplicates(workNow, buildNext, longTerm),
    ...findExcessiveRoleRepetition(workNow, buildNext, longTerm),
  ]
  const workTitles = workNow.map((r) => r.title)

  if (workNow.length === 0) {
    issues.push('Work Now must include immediate income roles')
  }

  if (buildNext.length === 0) {
    issues.push('Build Next must include 3–12 month progression steps')
  }

  if (longTerm.length > 0 && buildNext.length === 0) {
    issues.push('Long-Term Path requires Build Next intermediate progression steps')
  }

  if (longTerm.length === 0) {
    issues.push('Long-Term Path is empty — need advanced career destinations')
  }

  if (longTerm.length > 0 && !longTerm.some((l) => isAdvancedCareerDestination(l.title))) {
    issues.push('Long-Term Path needs management, leadership, or specialist destination roles')
  }

  for (const item of longTerm) {
    if (!isCareerDestinationRole(item.title)) {
      issues.push(`Long-Term "${item.title}" is not an advanced career destination`)
    }
    if (isTrainingOrLicence(item.title)) {
      issues.push(`Long-Term must not contain training/licence: ${item.title}`)
    }
  }

  const hasTrainingOrProgression = buildNext.some((b) => isBuildNextEligible(b.title))
  if (buildNext.length > 0 && !hasTrainingOrProgression) {
    issues.push('Build Next should contain licences, training, or progression roles above Work Now')
  }

  for (const item of buildNext) {
    if (workTitles.some((w) => titlesOverlapProgression(w, item.title))) {
      issues.push(`Build Next "${item.title}" must be higher stage than Work Now`)
    }
  }

  for (const item of longTerm) {
    if (workTitles.some((w) => titlesOverlapProgression(w, item.title)) && !isAdvancedCareerDestination(item.title)) {
      issues.push(`Long-Term "${item.title}" is not higher than Work Now`)
    }
    if (buildNext.some((b) => titlesOverlapProgression(b.title, item.title))) {
      issues.push(`Long-Term "${item.title}" is not higher than Build Next`)
    }
  }

  if (workNow.length >= 1 && buildNext.length >= 1 && longTerm.length >= 2 && issues.length === 0) {
    /* clear 3–5 year progression path */
  } else if (issues.length === 0 && longTerm.length < 2) {
    issues.push('Need at least 2 Long-Term destinations for a clear progression path')
  }

  if (profile) {
    issues.push(...validateFieldCareerConsistencyIssues(workNow, buildNext, longTerm, profile, state))
  }

  return { valid: issues.length === 0, issues }
}

type FullLadder = {
  buildNext: string[]
  longTerm: string[]
}

function inferFullLadder(
  workNow: CareerBrainRecommendation[],
  _buildNext: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): FullLadder {
  const ladder = getTrackLadder(workNow, profile, state)
  return { buildNext: ladder.buildNext, longTerm: ladder.longTerm }
}

function filterBuildNextForTrack(
  buildNext: CareerBrainRecommendation[],
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const family = inferCareerTrackFamily(workNow, profile, state)
  return buildNext.filter((b) => {
    if (workNow.some((w) => titlesOverlapProgression(w.title, b.title))) return false
    if (wantsDualPathMode(profile, state) && isStudyAlignedProgression(b.title, profile)) return true
    if (buildNextConflictsWithTrack(b.title, family)) return false
    if (isTrainingOrLicence(b.title) || isFirstProgressionRole(b.title)) {
      return buildNextMatchesTrack(b.title, family) || !buildNextConflictsWithTrack(b.title, family)
    }
    return true
  })
}

function filterLongTermForTrack(
  longTerm: CareerBrainRecommendation[],
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (state && userWantsFieldAlignedCareer(state, profile)) {
    const domain = inferProfessionalDomain(profile, state)
    if (domain === 'science' || domain === 'engineering') {
      const ladder = DOMAIN_PROGRESSION_LADDERS[domain]
      const workBlob = workNow.map((w) => w.title).join(' ')
      if (ladder.workNowPattern.test(workBlob)) {
        const aligned = longTerm.filter((l) => ladder.longTermPattern.test(l.title))
        if (aligned.length >= 2) return aligned
      }
    }
  }

  const family = inferCareerTrackFamily(workNow, profile, state)
  if (wantsDualPathMode(profile, state)) {
    return longTerm.filter(
      (l) => isStudyAlignedProgression(l.title, profile) || longTermMatchesTrack(l.title, family)
    )
  }
  return longTerm.filter((l) => longTermMatchesTrack(l.title, family))
}

function domainForTitle(title: string, profile: CareerProfile): CareerProfile['domain'] {
  const t = title.toLowerCase()
  if (/legal|paralegal|solicitor/.test(t)) return 'admin_business'
  if (/it support|systems|cyber|software|developer|data analyst|helpdesk/.test(t)) return 'IT_digital'
  if (/logistics|transport|fleet|hgv|warehouse|forklift|delivery|operative|picker|packer/.test(t)) {
    return 'driving_logistics'
  }
  if (/security|cctv/.test(t)) return 'retail_customer_service'
  if (/care|healthcare|nursing/.test(t)) return 'care_support'
  if (/retail|store|customer service|hospitality|barista/.test(t)) return 'retail_customer_service'
  if (/animator|motion|creative|video|design|production/.test(t)) return 'animation_design'
  if (/business|admin|office|operations|manager|coordinator/.test(t)) return 'admin_business'
  return profile.domain
}

function toRec(
  title: string,
  track: CareerBrainRecommendation['track'],
  why: string,
  profile: CareerProfile
): CareerBrainRecommendation {
  const domain = domainForTitle(title, profile)
  return {
    title,
    why,
    track,
    field_tag: domain,
    domain,
    source: 'fallback',
  }
}

function sanitizeBuildNextAgainstWorkNow(
  buildNext: CareerBrainRecommendation[],
  workNow: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  let cleaned = buildNext.filter(
    (b) => !workNow.some((w) => titlesOverlapProgression(w.title, b.title))
  )
  if (profile.constraints.includes('pathway-deterministic-locked')) {
    return dedupeWithinTrack(cleaned)
  }
  cleaned = filterBuildNextForTrack(cleaned, workNow, profile, state)
  cleaned = dedupeWithinTrack(cleaned)

  const family = inferCareerTrackFamily(workNow, profile, state)
  const directEmployment = prefersDirectEmployment(profile, state)
  const alignedBuild = cleaned.filter(
    (b) =>
      buildNextMatchesTrack(b.title, family) ||
      (wantsDualPathMode(profile, state) && isStudyAlignedProgression(b.title, profile))
  )
  const hasContent =
    alignedBuild.length >= 2 &&
    (directEmployment
      ? alignedBuild.some((b) => isFirstProgressionRole(b.title) || !isTrainingOrLicence(b.title))
      : cleaned.some((b) => isTrainingOrLicence(b.title) || isFirstProgressionRole(b.title)))
  if (!hasContent) {
    const ladder = inferFullLadder(workNow, buildNext, profile, state)
    for (const title of ladder.buildNext) {
      if (directEmployment && isTrainingOrLicence(title)) continue
      if (workNow.some((w) => titlesOverlapProgression(w.title, title))) continue
      if (cleaned.some((c) => titlesOverlapProgression(c.title, title))) continue
      cleaned.push(
        toRec(
          title,
          'build_next',
          isTrainingOrLicence(title)
            ? 'Build Next — licence or certification to unlock better pay within 3–12 months'
            : 'Build Next — first progression role after reliable UK work experience',
          profile
        )
      )
    }
  }

  return dedupeWithinTrack(cleaned).slice(0, 6)
}

export function sanitizeLongTermPath(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const priority = getCareerDirectionPriority(state ?? { answers: {} })
  const isBoth = priority === 'both' || priority === 'not_sure'

  if (isBoth && state) {
    const viable = longTerm.filter((item) => {
      if (!isCareerDestinationRole(item.title)) return false
      if (
        workNow.some((w) => titlesOverlapProgression(w.title, item.title)) &&
        !isAdvancedCareerDestination(item.title)
      ) {
        return false
      }
      if (buildNext.some((b) => titlesOverlapProgression(b.title, item.title))) return false
      return true
    })
    const balanced = ensureDualPathLongTermBalance(viable, profile, state)
    if (balanced.length >= 2) {
      return balanced.slice(0, 2)
    }
  }

  let cleaned = longTerm.filter((item) => {
    if (!isCareerDestinationRole(item.title)) return false
    if (workNow.some((w) => titlesOverlapProgression(w.title, item.title))) return false
    if (buildNext.some((b) => titlesOverlapProgression(b.title, item.title))) return false
    return true
  })

  cleaned = filterLongTermForTrack(cleaned, workNow, profile, state)
  cleaned = dedupeWithinTrack(cleaned)

  if (cleaned.length >= 2 && cleaned.some((c) => isAdvancedCareerDestination(c.title))) {
    return repairLongTermForFieldConsistency(cleaned.slice(0, 5), workNow, buildNext, profile, state)
  }

  const ladder = inferFullLadder(workNow, buildNext, profile, state)
  const merged: CareerBrainRecommendation[] = []
  for (const title of ladder.longTerm) {
    if (workNow.some((w) => titlesOverlapProgression(w.title, title))) continue
    if (buildNext.some((b) => titlesOverlapProgression(b.title, title))) continue
    if (merged.some((m) => titlesOverlapProgression(m.title, title))) continue
    merged.push(
      toRec(
        title,
        'long_term',
        'Long-Term Path — advanced career destination after experience, training, and UK work history (3–5 year progression)',
        profile
      )
    )
  }

  const out = merged.length ? merged.slice(0, 5) : cleaned
  return repairLongTermForFieldConsistency(out, workNow, buildNext, profile, state)
}

function applyFullLadderRepair(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): {
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const specPack = getSpecialisationRecommendations(state, profile)
  if (specPack?.length) {
    return {
      buildNext: specPack.filter((r) => r.track === 'build_next'),
      longTerm: specPack.filter((r) => r.track === 'long_term'),
    }
  }

  const ladder = inferFullLadder(workNow, buildNext, profile, state)

  const repairedBuild: CareerBrainRecommendation[] = []
  const directEmployment = prefersDirectEmployment(profile, state)
  for (const title of ladder.buildNext) {
    if (directEmployment && isTrainingOrLicence(title)) continue
    if (workNow.some((w) => titlesOverlapProgression(w.title, title))) continue
    const existing = buildNext.find((b) => titlesOverlapProgression(b.title, title))
    if (existing) {
      repairedBuild.push(existing)
      continue
    }
    repairedBuild.push(
      toRec(
        title,
        'build_next',
        isTrainingOrLicence(title)
          ? 'Build Next — licence or certification to unlock better pay within 3–12 months'
          : 'Build Next — first progression role after reliable UK work experience',
        profile
      )
    )
  }

  const family = inferCareerTrackFamily(workNow, profile, state)
  const trainingFromInput = buildNext.filter(
    (b) =>
      isTrainingOrLicence(b.title) &&
      !directEmployment &&
      !workNow.some((w) => titlesOverlapProgression(w.title, b.title)) &&
      !repairedBuild.some((r) => titlesOverlapProgression(r.title, b.title)) &&
      !buildNextConflictsWithTrack(b.title, family) &&
      buildNextMatchesTrack(b.title, family)
  )

  const repairedLong = ladder.longTerm.map((title) =>
    toRec(
      title,
      'long_term',
      'Long-Term Path — advanced career destination after experience, training, and UK work history (3–5 year progression)',
      profile
    )
  )

  return {
    buildNext: dedupeWithinTrack([...repairedBuild, ...trainingFromInput]).slice(0, 6),
    longTerm: repairedLong,
  }
}

export function enforceCareerProgressionTracks(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
  validation: ProgressionValidationResult
  repaired: boolean
} {
  if (profile.constraints.includes('career-change-path')) {
    const validation = validateCareerProgression(workNow, buildNext, longTerm, profile, state)
    return {
      workNow: dedupeWithinTrack(workNow).slice(0, 3),
      buildNext: dedupeWithinTrack(buildNext).slice(0, 3),
      longTerm: dedupeWithinTrack(longTerm).slice(0, 3),
      validation,
      repaired: false,
    }
  }

  if (profile.constraints.includes('pathway-deterministic-locked')) {
    const { refineProgressionLadder, normalizeBuildNextRoles } =
      require('./progressionRefinement') as typeof import('./progressionRefinement')
    let w = dedupeWithinTrack(workNow)
    let b = sanitizeBuildNextAgainstWorkNow(buildNext, w, profile, state)
    let l = sanitizeLongTermPath(w, b, longTerm, profile, state)
    l = removeLongTermWorkNowDuplicates(w, l)
    const refined = refineProgressionLadder(w, b, l, profile, state)
    w = refined.workNow
    b = refined.buildNext
    l = refined.longTerm
    const validation = validateCareerProgression(w, b, l, profile, state)
    return { workNow: w, buildNext: b, longTerm: l, validation, repaired: true }
  }

  let w = dedupeWithinTrack(workNow)
  let b = sanitizeBuildNextAgainstWorkNow(buildNext, w, profile, state)
  let l = sanitizeLongTermPath(w, b, longTerm, profile, state)
  w = ensureEntryLevelWorkNow(w, l, profile, state)
  l = removeLongTermWorkNowDuplicates(w, l)
  b = sanitizeBuildNextAgainstWorkNow(b, w, profile, state)
  l = sanitizeLongTermPath(w, b, l, profile, state)

  let validation = validateCareerProgression(w, b, l, profile, state)
  let repaired = false

  if (!validation.valid) {
    const repairedTracks = applyFullLadderRepair(w, b, profile, state)
    b = repairedTracks.buildNext
    l = repairedTracks.longTerm
    b = sanitizeBuildNextAgainstWorkNow(b, w, profile, state)
    l = sanitizeLongTermPath(w, b, l, profile, state)
    validation = validateCareerProgression(w, b, l, profile, state)
    repaired = true
  }

  if (!validation.valid) {
    const fallback = applyFullLadderRepair(w, [], profile, state)
    b = sanitizeBuildNextAgainstWorkNow(fallback.buildNext, w, profile, state)
    l = fallback.longTerm
    validation = validateCareerProgression(w, b, l, profile, state)
    repaired = true
  }

  if (w.length === 0) {
    w = ensureEntryLevelWorkNow(w, l, profile, state)
  }
  if (b.length === 0 && w.length > 0) {
    const ladder = applyFullLadderRepair(w, b, profile, state)
    b = sanitizeBuildNextAgainstWorkNow(ladder.buildNext, w, profile, state)
    repaired = true
  }
  if (l.length === 0 && w.length > 0) {
    const ladder = applyFullLadderRepair(w, b, profile, state)
    l = sanitizeLongTermPath(w, b, ladder.longTerm, profile, state)
    repaired = true
  }

  const { normalizeBuildNextRoles } = require('./progressionRefinement') as typeof import('./progressionRefinement')
  b = normalizeBuildNextRoles(w, b, l, profile, state)
  validation = validateCareerProgression(w, b, l, profile, state)

  return {
    workNow: w,
    buildNext: b,
    longTerm: l,
    validation,
    repaired,
  }
}

/** @deprecated use isTrainingOrLicence */
export function isLikelyCourse(title: string): boolean {
  return isTrainingOrLicence(title)
}

/** @deprecated use isCareerDestinationRole */
export function isJobDestination(title: string): boolean {
  return isCareerDestinationRole(title)
}

export function normalizeTitle(title: string): string {
  return normalizeProgressionTitle(title)
}

export function titlesOverlap(a: string, b: string): boolean {
  return titlesOverlapProgression(a, b)
}

export function longTermDuplicatesTraining(
  longItem: CareerBrainRecommendation,
  buildNext: CareerBrainRecommendation[]
): boolean {
  if (isTrainingOrLicence(longItem.title)) return true
  return buildNext.some((b) => titlesOverlapProgression(longItem.title, b.title))
}
