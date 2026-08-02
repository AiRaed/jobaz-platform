/**
 * Global career track lock — field-only vs field-with-backup vs any-work-ok.
 */

import { inferBridgeField } from './bridgeRoleIntelligence'
import { getSpecialisationValue } from './fieldSpecialisation'
import {
  inferCareerTrackFamily,
  isStudyAlignedProgression,
  studyFieldTrackFamily,
  type CareerTrackFamily,
} from './careerTrackAlignment'
import { getFieldAlignment } from './fieldAlignment'
import { getFirstJobCareerPreference } from './firstJobEducationPath'
import { getUserGoal, isStartNewCareerGoal } from './userGoal'
import type { CareerBrainQuestion, CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export type FieldIncomeStrategy = 'field_only' | 'field_with_backup' | 'any_work_ok'

const UNRELATED_QUICK_INCOME =
  /warehouse|forklift|picker|packer|cleaner|delivery|courier|hgv|kitchen porter|sia|cscs|care assistant|retail assistant|barista|waiter|waitress|hospitality|security officer|production operative|food delivery|van driver|shop assistant|café|cafe assistant/i

const UNRELATED_LICENCES =
  /sia licence|forklift licence|forklift licence \(flt\)|hgv training|cpc qualification|cscs construction|care assistant cert|food safety certificate/i

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const FIELD_INCOME_STRATEGY_QUESTION = q(
  'cb_field_income_strategy',
  'Do you want to focus only on this field, or are you also open to temporary work outside it for quick income?',
  [
    { value: 'field_only', label: 'Only this field' },
    { value: 'field_with_backup', label: 'This field first, but temporary work is okay' },
    { value: 'any_work_ok', label: 'Any work is fine for now' },
  ]
)

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

/** User has clearly chosen a professional field, degree area, or industry direction. */
export function hasSelectedCareerField(state: CareerBrainState, profile?: CareerProfile): boolean {
  const a = answers(state)

  if (String(a.cb_grow_field ?? '').trim()) return true
  if (String(a.cb_self_service ?? '').trim()) return true
  if (String(a.cb_business_type ?? '').trim()) return true

  const fjPref = getFirstJobCareerPreference(state)
  const align = getFieldAlignment(state)
  if (String(a.cb_first_job_study_field ?? '').trim() && (align === 'yes' || align === 'both' || fjPref === 'yes_only' || fjPref === 'prefer_field')) {
    return true
  }

  const gradStudy = String(a.cb_graduate_study_field ?? a.cb_study_field ?? '').trim()
  if (gradStudy) {
    const g = String(a.cb_graduate_field_intent ?? a.cb_field_intent ?? '')
    if (g.includes('same_field') || g.includes('related_field')) return true
  }

  if (String(a.cb_student_study_field ?? '').trim()) {
    const s = String(a.cb_student_work_intent ?? '')
    if (s.includes('related_studies') || s.includes('open_both')) return true
  }

  const changeDir = String(a.cb_change_direction ?? '')
  if (isStartNewCareerGoal(getUserGoal(state)) && changeDir && changeDir !== 'unsure') return true

  if (profile?.studyField?.trim() && profile.wantsSameField === true) return true
  if (profile?.workExperienceField?.trim() && getUserGoal(state) === 'grow_career') return true

  return false
}

function inferStrategyFromLegacy(state: CareerBrainState): FieldIncomeStrategy | null {
  const explicit = String(answers(state).cb_field_income_strategy ?? '')
  if (explicit === 'field_only' || explicit === 'field_with_backup' || explicit === 'any_work_ok') {
    return explicit as FieldIncomeStrategy
  }

  const alignment = getFieldAlignment(state)
  if (alignment === 'yes') return 'field_only'
  if (alignment === 'both') return 'field_with_backup'
  if (alignment === 'no') return 'any_work_ok'

  const fj = getFirstJobCareerPreference(state)
  if (fj === 'yes_only') return 'field_only'
  if (fj === 'prefer_field') return 'field_with_backup'
  if (fj === 'open_any' || fj === 'no_longer') return 'any_work_ok'

  return null
}

export function getFieldIncomeStrategy(state: CareerBrainState): FieldIncomeStrategy | null {
  return inferStrategyFromLegacy(state)
}

export function needsFieldIncomeStrategyQuestion(state: CareerBrainState, profile?: CareerProfile): boolean {
  if (!hasSelectedCareerField(state, profile)) return false
  if (hasAnswer(state, 'cb_field_income_strategy')) return false
  if (inferStrategyFromLegacy(state) !== null) return false
  return true
}

export function isCareerTrackLocked(state: CareerBrainState, profile?: CareerProfile): boolean {
  const strategy = getFieldIncomeStrategy(state)
  if (!strategy || strategy === 'any_work_ok') return false
  return hasSelectedCareerField(state, profile)
}

export function isFieldOnlyLock(state: CareerBrainState, profile?: CareerProfile): boolean {
  return isCareerTrackLocked(state, profile) && getFieldIncomeStrategy(state) === 'field_only'
}

export function allowsBackupIncome(state: CareerBrainState, profile?: CareerProfile): boolean {
  return getFieldIncomeStrategy(state) === 'field_with_backup' && hasSelectedCareerField(state, profile)
}

export function lockedTrackFamily(profile: CareerProfile, state?: CareerBrainState): CareerTrackFamily | null {
  const spec = getSpecialisationValue(state ?? { answers: {} })
  if (spec === 'software') return 'it'
  if (spec && ['mechanical', 'civil', 'electrical', 'industrial', 'chemical'].includes(spec)) {
    return 'it'
  }

  const fromStudy = studyFieldTrackFamily(profile, state)
  if (fromStudy) return fromStudy

  const field = inferBridgeField(profile.studyField, profile.targetField ?? profile.workExperienceField)
  const map: Partial<Record<typeof field, CareerTrackFamily>> = {
    law: 'legal',
    computer_science: 'it',
    animation: 'creative',
    media: 'creative',
    marketing: 'creative',
    medicine: 'care',
    nursing: 'care',
    healthcare: 'care',
    social_care: 'care',
    finance: 'office_admin',
    business: 'office_admin',
    education: 'customer_service',
    engineering: 'it',
    construction: 'driving_logistics',
    hospitality: 'customer_service',
  }
  return map[field] ?? null
}

function matchesLockedFamily(title: string, family: CareerTrackFamily): boolean {
  const t = title.toLowerCase()
  switch (family) {
    case 'legal':
      return /legal|paralegal|law|casework|solicitor|legal admin|legal reception/i.test(t)
    case 'it':
      return /it support|helpdesk|technical|software|developer|qa|digital|computing|data analyst|cyber|engineering|technician|cad|manufacturing|quality inspector/i.test(t)
    case 'creative':
      return /animator|motion|video|creative|content|design|production|social media|graphic/i.test(t)
    case 'care':
      return /healthcare|care|nhs|clinical|medical|pharmacy|support worker|nursing/i.test(t)
    case 'office_admin':
      return /admin|reception|data entry|office|clerical|bookkeep|finance admin|business support|coordinator|accounts|payable|finance/i.test(t)
    case 'driving_logistics':
      return /warehouse|logistics|delivery|driver|courier|forklift|transport|picker|packer/i.test(t)
    case 'customer_service':
      return /retail|customer|barista|waiter|hospitality|sales|host|café|cafe/i.test(t)
    case 'security':
      return /security|sia|cctv|door supervisor/i.test(t)
    default:
      return false
  }
}

export function isRoleAlignedWithLockedField(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  const strategy = getFieldIncomeStrategy(state ?? { answers: {} })
  if (!strategy || strategy === 'any_work_ok') return true
  if (!isCareerTrackLocked(state ?? { answers: {} }, profile)) return true

  const t = title.toLowerCase()
  const family = lockedTrackFamily(profile, state)
  if (!family) return true

  if (track === 'backup_income') {
    return strategy === 'field_with_backup'
  }

  if (isStudyAlignedProgression(title, profile)) return true
  if (matchesLockedFamily(title, family)) return true

  if (UNRELATED_QUICK_INCOME.test(t) || UNRELATED_LICENCES.test(t)) {
    return false
  }

  if (strategy === 'field_only') {
    if (track === 'build_next' || track === 'long_term') {
      return isStudyAlignedProgression(title, profile) || matchesLockedFamily(title, family)
    }
    return matchesLockedFamily(title, family) || isStudyAlignedProgression(title, profile)
  }

  if (strategy === 'field_with_backup' && track !== 'work_now') {
    return isStudyAlignedProgression(title, profile) || matchesLockedFamily(title, family)
  }

  return true
}

export function applyCareerTrackLockToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  const strategy = getFieldIncomeStrategy(state)
  if (!strategy || !hasSelectedCareerField(state, profile)) return profile

  let constraints = [...profile.constraints]

  if (strategy === 'field_only') {
    const goal = getUserGoal(state)
    const lockConstraints = ['career-track-locked', 'field-only-mode']
    if (profile.studyField?.trim() && !isStartNewCareerGoal(goal)) {
      lockConstraints.push('bridge-role-mode', 'field-first-education')
    }
    constraints = [...new Set([...constraints, ...lockConstraints])]
    return {
      ...profile,
      wantsSameField: true,
      wantsCareerChange: isStartNewCareerGoal(goal) ? true : false,
      constraints,
    }
  }

  if (strategy === 'field_with_backup') {
    constraints = [
      ...new Set([
        ...constraints,
        'career-track-locked',
        'dual-path-mode',
        'hybrid-path-mode',
        'education-income-balance',
      ]),
    ]
    return {
      ...profile,
      wantsSameField: true,
      constraints,
    }
  }

  constraints = [...new Set([...constraints, 'flexible-employment-mode', 'any-job-ok'])]
  return { ...profile, constraints }
}

export function applyCareerTrackLockRules(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const s = state ?? { answers: {} }
  const strategy = getFieldIncomeStrategy(s)
  if (!strategy || strategy === 'any_work_ok' || !isCareerTrackLocked(s, profile)) {
    return recs
  }

  if (strategy === 'field_with_backup' && recs.some((r) => r.track === 'backup_income')) {
    return recs.filter((r) => {
      if (r.track === 'work_now' || r.track === 'backup_income') return true
      return isRoleAlignedWithLockedField(r.title, r.track, profile, s)
    })
  }

  const family = lockedTrackFamily(profile, state)
  const workNow = recs.filter((r) => r.track === 'work_now')
  const inferredFamily = family ?? inferCareerTrackFamily(workNow, profile, state)

  const relabelBackup = (r: CareerBrainRecommendation): CareerBrainRecommendation => ({
    ...r,
    track: 'backup_income',
    why: `Backup income option — ${r.why.replace(/^Work Now — /i, '').replace(/^Backup income — /i, '')}`,
  })

  const aligned: CareerBrainRecommendation[] = []
  const backup: CareerBrainRecommendation[] = []

  for (const r of recs) {
    if (r.track === 'backup_income') {
      if (strategy === 'field_with_backup') backup.push(r)
      continue
    }

    const ok = isRoleAlignedWithLockedField(r.title, r.track, profile, s)
    if (ok) {
      aligned.push(r)
      continue
    }

    if (strategy === 'field_with_backup' && r.track === 'work_now') {
      backup.push(relabelBackup(r))
      continue
    }

    if (strategy === 'field_only') {
      continue
    }

    aligned.push(r)
  }

  const filterBuildLong = (items: CareerBrainRecommendation[]) =>
    items.filter((r) => {
      if (r.track !== 'build_next' && r.track !== 'long_term') return true
      if (UNRELATED_LICENCES.test(r.title) && !matchesLockedFamily(r.title, inferredFamily)) {
        return false
      }
      return isRoleAlignedWithLockedField(r.title, r.track, profile, s)
    })

  const cleaned = filterBuildLong(aligned)

  const dedupedBackup = backup.filter(
    (r, i, arr) => arr.findIndex((x) => x.title.toLowerCase() === r.title.toLowerCase()) === i
  )

  return [
    ...cleaned.filter((r) => r.track === 'work_now'),
    ...dedupedBackup.slice(0, 2),
    ...cleaned.filter((r) => r.track === 'build_next'),
    ...cleaned.filter((r) => r.track === 'long_term'),
  ]
}

export function buildCareerTrackLockReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  const s = state ?? { answers: {} }
  const strategy = getFieldIncomeStrategy(s)
  if (!strategy || !isCareerTrackLocked(s, profile)) return []

  const field = profile.studyField ?? profile.workExperienceField ?? profile.targetField ?? 'your field'
  if (strategy === 'field_only') {
    return [
      `Career track locked to ${field} — Work Now, Build Next, and Long-Term stay inside this field only.`,
    ]
  }
  if (strategy === 'field_with_backup') {
    return [
      `Career track prioritises ${field} — temporary backup income roles are shown separately and are not your main path.`,
    ]
  }
  return []
}
