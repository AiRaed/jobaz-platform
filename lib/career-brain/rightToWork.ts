/**
 * Adaptive UK work eligibility — asked after professional context, not first.
 */

import { isNewToUkContext } from './newToUkContext'
import { getRoutingGoal, getSelectedUserGoal, resolveLegacySituation, isStartNewCareerGoal } from './userGoal'

/** UK status / work eligibility is deferred for first job and unemployed pathways. */
export function isWorkEligibilitySkippedForRoute(state: CareerBrainState): boolean {
  const selected = getSelectedUserGoal(state)
  if (selected === 'new_to_uk') return true
  const goal = getRoutingGoal(state)
  return (
    goal === 'first_job' ||
    goal === 'unemployed' ||
    isStartNewCareerGoal(goal) ||
    goal === 'start_business' ||
    goal === 'self_employed' ||
    goal === 'small_business'
  )
}
import {
  applyWorkEligibilityFlagsToConstraints,
  ASYLUM_WORK_PERMISSION_QUESTION,
  buildWorkEligibilityGuidance,
  canContinueCareerAssessment,
  canGenerateCareerRecommendations,
  evaluateUkWorkEligibility,
  getAsylumWorkPermission,
  needsAsylumWorkPermissionQuestion,
  pickWorkEligibilityFollowUpQuestion,
  type UkWorkStatus,
} from './ukWorkEligibilityEngine'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'

export type { UkWorkStatus } from './ukWorkEligibilityEngine'

export type SimpleRtwAnswer = 'yes' | 'no' | 'not_sure'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const RTW_QUESTIONS = {
  workStatus: q('cb_uk_work_status', 'What best describes your UK status?', [
    { value: 'uk_citizen', label: 'UK Citizen' },
    { value: 'settled_status', label: 'Settled Status' },
    { value: 'pre_settled_status', label: 'Pre-Settled Status' },
    { value: 'skilled_worker_visa', label: 'Skilled Worker Visa' },
    { value: 'student_visa', label: 'Student Visa' },
    { value: 'graduate_visa', label: 'Graduate Visa' },
    { value: 'refugee_humanitarian', label: 'Refugee / Humanitarian Protection' },
    { value: 'asylum_seeker', label: 'Asylum Seeker' },
    { value: 'visitor_tourist', label: 'Visitor / Tourist Visa' },
    { value: 'other_not_sure', label: 'Other / Not Sure' },
  ]),
  asylumWorkPermission: ASYLUM_WORK_PERMISSION_QUESTION,
  simpleConfirm: q('cb_rtw_simple', 'Do you currently have the right to work in the UK?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'not_sure', label: 'Not sure' },
  ]),
  studentUniversity: q('cb_student_visa_university', 'Are you studying at a UK university?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No — college or other course' },
    { value: 'not_sure', label: 'Not sure' },
  ]),
  studentHours: q('cb_student_visa_hours', 'How many hours are you allowed to work during term time?', [
    { value: '20_hours', label: 'Up to 20 hours per week' },
    { value: 'limited', label: 'Limited / fewer than 20 hours' },
    { value: 'full_time_vacation', label: 'Full-time only in holidays' },
    { value: 'not_sure', label: 'Not sure — need to check' },
  ]),
}

const FULL_STATUS_SITUATIONS = new Set([
  'student_part_time',
  'unemployed_urgent',
  'exploring',
  'new_to_uk',
])

const SIMPLE_CONFIRM_SITUATIONS = new Set([
  'career_change',
  'experienced_professional',
  'self_employed',
  'small_business',
  'side_income',
])

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function getSituation(state: CareerBrainState): string | null {
  return resolveLegacySituation(state) ?? (answers(state).cb_entry_situation ? String(answers(state).cb_entry_situation) : null)
}

function needsExperienceBeforeEligibility(state: CareerBrainState): boolean {
  const goal = getRoutingGoal(state)
  if (
    goal === 'first_job' ||
    goal === 'have_experience' ||
    goal === 'grow_career' ||
    goal === 'start_new_career' ||
    isStartNewCareerGoal(goal) ||
    goal === 'self_employed' ||
    goal === 'small_business' ||
    goal === 'start_business' ||
    goal === 'urgent_work'
  ) {
    return false
  }
  return true
}

function isNewToUkDetected(state: CareerBrainState): boolean {
  if (isNewToUkContext(state)) return true
  const situation = getSituation(state)
  if (situation === 'new_to_uk') return true
  const country = String(answers(state).cb_experience_country ?? '')
  if (country === 'mostly_international') return true
  const gradRegion = String(answers(state).cb_graduate_qual_region ?? '')
  if (gradRegion === 'foreign') return true
  return false
}

/** Full visa/status list vs simple yes/no confirm. */
export function getEligibilityQuestionMode(
  state: CareerBrainState
): 'full' | 'simple' | 'none' {
  if (isWorkEligibilitySkippedForRoute(state)) return 'none'
  const situation = getSituation(state)
  if (!situation) return 'none'
  if (isNewToUkDetected(state)) return 'full'
  if (FULL_STATUS_SITUATIONS.has(situation)) return 'full'
  if (SIMPLE_CONFIRM_SITUATIONS.has(situation)) return 'simple'
  return 'full'
}

export function getSimpleRtwAnswer(state: CareerBrainState): SimpleRtwAnswer | null {
  const v = answers(state).cb_rtw_simple
  if (v === 'yes' || v === 'no' || v === 'not_sure') return v
  return null
}

export function getUkWorkStatus(state: CareerBrainState): UkWorkStatus | null {
  const explicit = answers(state).cb_uk_work_status
  if (explicit) return String(explicit) as UkWorkStatus

  const simple = getSimpleRtwAnswer(state)
  if (simple === 'yes') return 'settled_status'
  if (simple === 'not_sure') return 'other_not_sure'
  if (simple === 'no') return 'other_not_sure'
  return null
}

export function getWorkEligibilityResult(state: CareerBrainState) {
  return evaluateUkWorkEligibility(state, getUkWorkStatus(state))
}

function isFullStatusComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_uk_work_status')) return false
  const status = getUkWorkStatus(state)
  if (status === 'asylum_seeker') {
    return hasAnswer(state, 'cb_asylum_work_permission')
  }
  if (status === 'student_visa') {
    return hasAnswer(state, 'cb_student_visa_university') && hasAnswer(state, 'cb_student_visa_hours')
  }
  return true
}

function isSimpleConfirmComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_rtw_simple')) return false
  const simple = getSimpleRtwAnswer(state)
  if (simple === 'yes') return true
  if (simple === 'no') return true
  if (simple === 'not_sure') return isFullStatusComplete(state)
  return false
}

export function isRightToWorkComplete(state: CareerBrainState): boolean {
  if (isWorkEligibilitySkippedForRoute(state)) return true
  if (!getSituation(state)) return false
  if (needsExperienceBeforeEligibility(state) && !hasAnswer(state, 'cb_experience_level')) return false

  const mode = getEligibilityQuestionMode(state)
  if (mode === 'none') return true
  if (mode === 'simple') return isSimpleConfirmComplete(state)
  return isFullStatusComplete(state)
}

/** @deprecated use isRightToWorkComplete — kept for imports */
export function isAdaptiveEligibilityComplete(state: CareerBrainState): boolean {
  return isRightToWorkComplete(state)
}

function pickFullStatusQuestions(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_uk_work_status')) {
    return {
      question: RTW_QUESTIONS.workStatus,
      reason: 'Eligibility — UK status helps match realistic job pathways',
    }
  }

  const status = getUkWorkStatus(state)

  if (status === 'asylum_seeker') {
    const followUp = pickWorkEligibilityFollowUpQuestion(state, status)
    if (followUp.question) return followUp
    return { question: null, reason: 'Asylum seeker — work permission not confirmed' }
  }

  const followUp = pickWorkEligibilityFollowUpQuestion(state, status)
  if (followUp.question) return followUp

  if (status === 'student_visa') {
    if (!hasAnswer(state, 'cb_student_visa_university')) {
      return {
        question: RTW_QUESTIONS.studentUniversity,
        reason: 'Eligibility — student visa work restrictions',
      }
    }
    if (!hasAnswer(state, 'cb_student_visa_hours')) {
      return {
        question: RTW_QUESTIONS.studentHours,
        reason: 'Eligibility — student visa permitted work hours',
      }
    }
  }
  return { question: null, reason: 'Full eligibility check complete' }
}

export type PickEligibilityOptions = {
  /** Employed paths — ask simple RTW right after situation + experience. */
  earlySimpleOnly?: boolean
}

export function pickAdaptiveEligibilityQuestion(
  state: CareerBrainState,
  opts?: PickEligibilityOptions
): { question: CareerBrainQuestion | null; reason: string } {
  if (!getSituation(state)) {
    return { question: null, reason: 'Awaiting professional situation first' }
  }
  if (needsExperienceBeforeEligibility(state) && !hasAnswer(state, 'cb_experience_level')) {
    return { question: null, reason: 'Awaiting experience level before eligibility' }
  }

  const mode = getEligibilityQuestionMode(state)

  if (opts?.earlySimpleOnly) {
    if (mode !== 'simple') return { question: null, reason: 'Full eligibility deferred' }
    if (isSimpleConfirmComplete(state)) return { question: null, reason: 'Simple eligibility complete' }
    if (!hasAnswer(state, 'cb_rtw_simple')) {
      return {
        question: RTW_QUESTIONS.simpleConfirm,
        reason: 'Quick eligibility check — you appear active in the UK job market',
      }
    }
    return { question: null, reason: 'Simple eligibility complete' }
  }

  if (mode === 'simple') {
    if (isSimpleConfirmComplete(state)) {
      return { question: null, reason: 'Eligibility complete' }
    }
    if (!hasAnswer(state, 'cb_rtw_simple')) {
      return {
        question: RTW_QUESTIONS.simpleConfirm,
        reason: 'Quick eligibility check — you appear active in the UK job market',
      }
    }
    if (getSimpleRtwAnswer(state) === 'not_sure') {
      return pickFullStatusQuestions(state)
    }
    return { question: null, reason: 'Eligibility complete' }
  }

  if (mode === 'full') {
    return pickFullStatusQuestions(state)
  }

  return { question: null, reason: 'Eligibility not required' }
}

/** @deprecated — use pickAdaptiveEligibilityQuestion after professional context */
export function pickRightToWorkQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  return pickAdaptiveEligibilityQuestion(state)
}

export function isWorkBlocked(state: CareerBrainState): boolean {
  const result = getWorkEligibilityResult(state)
  if (result.pendingFollowUp) return true
  if (result.workEligible === false || result.workEligible === 'unknown') return true
  if (getSimpleRtwAnswer(state) === 'no') return true
  return false
}

export function canGenerateJobPathways(state: CareerBrainState): boolean {
  if (isWorkEligibilitySkippedForRoute(state)) return true
  if (!isRightToWorkComplete(state)) return false
  if (getSimpleRtwAnswer(state) === 'no') return false
  const status = getUkWorkStatus(state)
  return canGenerateCareerRecommendations(state, status)
}

export function canProceedAfterWorkEligibility(state: CareerBrainState): boolean {
  if (!isRightToWorkComplete(state)) return false
  const status = getUkWorkStatus(state)
  return canContinueCareerAssessment(state, status)
}

export function buildRightToWorkGuidance(state: CareerBrainState): string {
  const status = getUkWorkStatus(state)
  const result = getWorkEligibilityResult(state)

  if (getSimpleRtwAnswer(state) === 'no') {
    return (
      'You indicated you may not have the right to work in the UK. ' +
      'Please verify your immigration status with the Home Office or a qualified adviser before applying for paid work.'
    )
  }

  if (result.message) {
    return result.message
  }

  if (status === 'student_visa') {
    const hours = String(answers(state).cb_student_visa_hours ?? '')
    const uni = String(answers(state).cb_student_visa_university ?? '')
    const hourNote =
      hours === '20_hours'
        ? 'During term time you are usually limited to 20 hours per week.'
        : hours === 'full_time_vacation'
          ? 'You may be able to work full-time only outside term time — check your visa conditions.'
          : 'Check your visa and university rules before accepting work — hour limits apply on student visas.'
    const uniNote = uni === 'yes' ? 'UK university student visa rules apply.' : 'Check your course provider visa guidance.'
    return `${uniNote} ${hourNote} I will focus on realistic part-time student pathways within these limits.`
  }

  return buildWorkEligibilityGuidance(state, status)
}

export function buildWorkEligibilityNextSteps(state: CareerBrainState): string[] {
  const result = getWorkEligibilityResult(state)
  return result.nextSteps
}

export function applyRightToWorkToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (isWorkEligibilitySkippedForRoute(state)) return profile

  const status = getUkWorkStatus(state)
  if (!status && !getSimpleRtwAnswer(state)) return profile

  const result = getWorkEligibilityResult(state)
  const canWork = result.workEligible === true && !result.blocksRecommendations

  let next: CareerProfile = {
    ...profile,
    workEligibility: status ?? undefined,
    canWorkInUk: canWork,
    workEligible: result.workEligible,
    constraints: applyWorkEligibilityFlagsToConstraints(profile.constraints, result.flags),
  }

  if (getSimpleRtwAnswer(state) === 'yes') {
    next.constraints = [...new Set([...next.constraints, 'uk-work-eligible', 'rtw-confirmed'])]
  }

  if (result.workEligible === true) {
    next.constraints = [...new Set([...next.constraints, 'uk-work-eligible'])]
  }

  if (result.blocksRecommendations || result.workEligible === false || result.workEligible === 'unknown') {
    next.constraints = [...new Set([...next.constraints, 'work-blocked'])]
  }

  if (getSimpleRtwAnswer(state) === 'no') {
    next.constraints = [...new Set([...next.constraints, 'work-blocked'])]
    next.canWorkInUk = false
  }

  if (isNewToUkDetected(state)) {
    next.experienceCountry = next.experienceCountry ?? 'non-UK'
    next.constraints = [...new Set([...next.constraints, 'new-to-uk'])]
  }

  const country = String(state.answers?.cb_experience_country ?? '')
  if (country.includes('international') || country.includes('both')) {
    next.experienceCountry = next.experienceCountry ?? 'non-UK'
  } else if (country.includes('uk')) {
    next.experienceCountry = next.experienceCountry ?? 'UK'
  }

  return next
}

export function isNewToUkUser(state: CareerBrainState): boolean {
  return isNewToUkDetected(state)
}

export {
  evaluateUkWorkEligibility,
  getAsylumWorkPermission,
  needsAsylumWorkPermissionQuestion,
  type UkWorkEligibilityResult,
} from './ukWorkEligibilityEngine'
