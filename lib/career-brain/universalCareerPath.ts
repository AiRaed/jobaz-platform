/**
 * Universal career path rules — commitment lock, Work Now never empty,
 * jobs vs courses separation, field-aligned training, path consistency.
 */

import {
  getBridgeFieldDevelopmentRoles,
  getBridgeFieldLongTermRoles,
  getBridgeFieldWorkNowRoles,
  resolveCommittedBridgeField,
} from './bridgeRoleIntelligence'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import {
  applyCareerTrackLockRules,
  hasSelectedCareerField,
  isCareerTrackLocked,
  isFieldOnlyLock,
  isRoleAlignedWithLockedField,
} from './careerTrackLock'
import {
  isCareerDestinationRole,
  isFirstProgressionRole,
  isTrainingOrLicence,
  titlesOverlapProgression,
} from './careerProgressionValidation'
import { rec } from './resultBuilder'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

/** User committed to a specific field — main columns stay inside that career family. */
export function hasCareerCommitmentLock(state: CareerBrainState, profile?: CareerProfile): boolean {
  return isCareerTrackLocked(state, profile)
}

function isEmploymentEntryRole(title: string): boolean {
  const t = title.toLowerCase()
  if (isTrainingOrLicence(title)) return false
  if (/hnc|btec|diploma|degree|pathway|short course|certif|licen[cs]e|training/i.test(t)) return false
  if (/pathway$|career pathway/i.test(t) && !/assistant|trainee|intern/i.test(t)) return false
  return (
    /assistant|junior|trainee|clerk|operative|receptionist|editor|support worker|technician|admin|accounts|bookkeep|intern\b|part-time|porter|coordinator \(entry\)|\(entry\)/i.test(
      t
    ) && !/certif|licen[cs]e|course|training|fundamentals|short course/i.test(t)
  )
}

/** Rule 3 — courses/certificates never belong in Work Now. */
export function separateJobsFromCourses(recs: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const backup = recs.filter((r) => r.track === 'backup_income')
  const longTerm = recs.filter((r) => r.track === 'long_term')
  let workNow = recs.filter((r) => r.track === 'work_now')
  let buildNext = recs.filter((r) => r.track === 'build_next')

  const movedToBuild: CareerBrainRecommendation[] = []
  workNow = workNow.filter((r) => {
    if (isTrainingOrLicence(r.title) && !isEmploymentEntryRole(r.title)) {
      movedToBuild.push({
        ...r,
        track: 'build_next',
        why: r.why.startsWith('Build Next') ? r.why : `Build Next — ${r.why.replace(/^Work Now — /i, '')}`,
      })
      return false
    }
    return true
  })

  const movedToWork: CareerBrainRecommendation[] = []
  buildNext = buildNext.filter((r) => {
    if (isEmploymentEntryRole(r.title) && !isFirstProgressionRole(r.title)) {
      movedToWork.push({
        ...r,
        track: 'work_now',
        why: r.why.startsWith('Work Now') ? r.why : `Work Now — realistic entry role in your chosen field`,
      })
      return false
    }
    return true
  })

  const dedupe = (items: CareerBrainRecommendation[]) => {
    const out: CareerBrainRecommendation[] = []
    for (const item of items) {
      if (out.some((o) => titlesOverlapProgression(o.title, item.title))) continue
      out.push(item)
    }
    return out
  }

  return dedupe([
    ...workNow,
    ...movedToWork,
    ...backup,
    ...dedupe([...buildNext, ...movedToBuild]),
    ...longTerm.filter((r) => isCareerDestinationRole(r.title) || r.track === 'long_term'),
  ])
}

/** Rule 2 — always at least one realistic Work Now role. */
export function ensureWorkNowNeverEmpty(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const s = state ?? { answers: {} }
  let workNow = recs.filter((r) => r.track === 'work_now')
  if (workNow.length > 0) return recs

  const rest = recs.filter((r) => r.track !== 'work_now')
  const field = resolveCommittedBridgeField(profile, s)
  const injections = getBridgeFieldWorkNowRoles(field, 3, s, profile).map((r) => ({
    ...r,
    why: `Work Now — closest realistic entry role in your chosen ${field.replace(/_/g, ' ')} path`,
  }))

  if (hasCareerCommitmentLock(s, profile) && injections.length) {
    return [...injections, ...rest]
  }

  const generic = [
    rec('Retail Assistant', 'Work Now — widely available entry role while you build UK work history', 'work_now', 'retail_customer_service'),
  ]
  return [...generic, ...rest]
}

function filterCommittedColumns(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] {
  if (!hasCareerCommitmentLock(state, profile)) return recs

  const field = resolveCommittedBridgeField(profile, state)
  let workNow = recs.filter((r) => r.track === 'work_now')
  let buildNext = recs.filter((r) => r.track === 'build_next')
  let longTerm = recs.filter((r) => r.track === 'long_term')
  const backup = recs.filter((r) => r.track === 'backup_income')

  const specPack = getSpecialisationRecommendations(state, profile)

  workNow = workNow.filter((r) => isRoleAlignedWithLockedField(r.title, 'work_now', profile, state))
  if (specPack?.length) {
    const specWork = specPack.filter((r) => r.track === 'work_now')
    if (specWork.length) workNow = specWork
  }
  buildNext = buildNext.filter((r) => {
    if (isTrainingOrLicence(r.title) || isFirstProgressionRole(r.title)) {
      return isRoleAlignedWithLockedField(r.title, 'build_next', profile, state)
    }
    return false
  })
  longTerm = longTerm.filter(
    (r) => isCareerDestinationRole(r.title) && isRoleAlignedWithLockedField(r.title, 'long_term', profile, state)
  )

  if (specPack?.length) {
    const specBuild = specPack.filter((r) => r.track === 'build_next')
    const specLong = specPack.filter((r) => r.track === 'long_term')
    if (specBuild.length) buildNext = specBuild
    if (specLong.length) longTerm = specLong
  }

  if (buildNext.length < 2) {
    const extras = getBridgeFieldDevelopmentRoles(field, 4, state, profile).filter(
      (r) =>
        !buildNext.some((b) => titlesOverlapProgression(b.title, r.title)) &&
        isRoleAlignedWithLockedField(r.title, 'build_next', profile, state)
    )
    buildNext = [...buildNext, ...extras].slice(0, 6)
  }

  if (longTerm.length < 2) {
    const extras = getBridgeFieldLongTermRoles(field, 3, state, profile).filter(
      (r) =>
        !longTerm.some((l) => titlesOverlapProgression(l.title, r.title)) &&
        isRoleAlignedWithLockedField(r.title, 'long_term', profile, state)
    )
    longTerm = [...longTerm, ...extras].slice(0, 5)
  }

  return [...workNow, ...backup, ...buildNext, ...longTerm]
}

/** Apply all universal career path rules after track lock and before ladder enforcement. */
export function applyUniversalCareerPathRules(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const s = state ?? { answers: {} }
  let next = applyCareerTrackLockRules(recs, profile, s)
  next = separateJobsFromCourses(next)

  if (hasCareerCommitmentLock(s, profile)) {
    next = filterCommittedColumns(next, profile, s)
  }

  next = ensureWorkNowNeverEmpty(next, profile, s)
  return next
}

export function buildUniversalCareerPathReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const s = state ?? { answers: {} }
  if (!hasSelectedCareerField(s, profile)) return []

  const field = profile.studyField ?? profile.workExperienceField ?? profile.targetField ?? 'your chosen field'
  const lines: string[] = [
    'Universal path rules — Work Now holds paid entry roles only; Build Next holds field-aligned training; Long-Term holds career destinations.',
  ]

  if (isFieldOnlyLock(s, profile)) {
    lines.push(
      `Career commitment lock — you chose to stay in ${field}; unrelated sectors, licences, and fast-hire fallbacks are excluded from your main path.`
    )
  } else if (hasCareerCommitmentLock(s, profile)) {
    lines.push(
      `Your main path stays inside ${field}; any temporary income outside your field appears only under backup options if you allowed it.`
    )
  }

  return lines
}
