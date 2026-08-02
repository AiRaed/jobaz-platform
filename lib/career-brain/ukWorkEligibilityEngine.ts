/**
 * UK Work Eligibility Engine — gatekeeper after UK status, before career recommendations.
 */

import type { CareerBrainQuestion, CareerBrainState } from './types'

export type UkWorkStatus =
  | 'uk_citizen'
  | 'settled_status'
  | 'pre_settled_status'
  | 'skilled_worker_visa'
  | 'student_visa'
  | 'graduate_visa'
  | 'refugee_humanitarian'
  | 'asylum_seeker'
  | 'visitor_tourist'
  | 'other_not_sure'

export type WorkEligibleValue = true | false | 'unknown'

export type AsylumWorkPermission = 'yes' | 'no' | 'not_sure'

export type UkWorkEligibilityFlags = {
  graduateRoute?: boolean
  visaRestricted?: boolean
  restrictedHours?: boolean
  supportProgrammes?: boolean
}

export type UkWorkEligibilityResult = {
  status: UkWorkStatus | null
  workEligible: WorkEligibleValue | null
  /** Awaiting asylum permission follow-up. */
  pendingFollowUp: boolean
  blocksRecommendations: boolean
  allowsCareerAssessment: boolean
  message: string
  nextSteps: string[]
  flags: UkWorkEligibilityFlags
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const ASYLUM_WORK_PERMISSION_QUESTION = q(
  'cb_asylum_work_permission',
  'Do you currently have permission to work in the UK?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'not_sure', label: 'Not sure' },
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

export function getAsylumWorkPermission(state: CareerBrainState): AsylumWorkPermission | null {
  const v = String(answers(state).cb_asylum_work_permission ?? '')
  if (v === 'yes' || v === 'no' || v === 'not_sure') return v
  return null
}

export function needsAsylumWorkPermissionQuestion(state: CareerBrainState, status: UkWorkStatus | null): boolean {
  return status === 'asylum_seeker' && !hasAnswer(state, 'cb_asylum_work_permission')
}

const ASYLUM_NO_NEXT_STEPS = [
  'Review your immigration documents',
  'Contact the Home Office',
  'Contact a refugee or asylum support organisation',
]

const ASYLUM_NOT_SURE_NEXT_STEPS = [
  'Check your immigration documents',
  'Contact the Home Office',
  'Speak with a qualified immigration adviser',
]

const VISITOR_NEXT_STEPS = [
  'Review UK immigration guidance',
  'Contact the Home Office',
  'Explore legal work-authorisation routes',
]

function blockedResult(
  status: UkWorkStatus,
  message: string,
  nextSteps: string[] = ASYLUM_NO_NEXT_STEPS
): UkWorkEligibilityResult {
  return {
    status,
    workEligible: false,
    pendingFollowUp: false,
    blocksRecommendations: true,
    allowsCareerAssessment: false,
    message,
    nextSteps,
    flags: {},
  }
}

function unknownResult(
  status: UkWorkStatus,
  message: string,
  nextSteps: string[] = ASYLUM_NOT_SURE_NEXT_STEPS
): UkWorkEligibilityResult {
  return {
    status,
    workEligible: 'unknown',
    pendingFollowUp: false,
    blocksRecommendations: true,
    allowsCareerAssessment: false,
    message,
    nextSteps,
    flags: {},
  }
}

function allowedResult(
  status: UkWorkStatus,
  message: string,
  flags: UkWorkEligibilityFlags = {}
): UkWorkEligibilityResult {
  return {
    status,
    workEligible: true,
    pendingFollowUp: false,
    blocksRecommendations: false,
    allowsCareerAssessment: true,
    message,
    nextSteps: [],
    flags,
  }
}

/** Evaluate eligibility from UK status + follow-ups. */
export function evaluateUkWorkEligibility(
  state: CareerBrainState,
  status: UkWorkStatus | null
): UkWorkEligibilityResult {
  if (!status) {
    return {
      status: null,
      workEligible: null,
      pendingFollowUp: false,
      blocksRecommendations: false,
      allowsCareerAssessment: false,
      message: '',
      nextSteps: [],
      flags: {},
    }
  }

  switch (status) {
    case 'uk_citizen':
    case 'settled_status':
      return allowedResult(status, 'You have full work rights in the UK.')
    case 'pre_settled_status':
      return allowedResult(status, 'You have work rights in the UK.')
    case 'graduate_visa':
      return allowedResult(
        status,
        'Your Graduate Visa allows you to work in the UK. Recommendations will consider graduate opportunities where relevant.',
        { graduateRoute: true }
      )
    case 'skilled_worker_visa':
      return allowedResult(
        status,
        'You can work in the UK, but some career changes may involve visa sponsorship considerations.',
        { visaRestricted: true }
      )
    case 'student_visa':
      return allowedResult(
        status,
        'You may have restrictions on working hours depending on your visa conditions. Recommendations will focus on student-compatible opportunities.',
        { restrictedHours: true }
      )
    case 'refugee_humanitarian':
      return allowedResult(
        status,
        'You are generally permitted to work in the UK and may also be eligible for additional employment support programmes.',
        { supportProgrammes: true }
      )
    case 'visitor_tourist':
      return blockedResult(
        status,
        'Visitor and tourist visas generally do not allow employment in the UK. Before exploring career opportunities, you should first obtain a visa or immigration status that permits work.',
        VISITOR_NEXT_STEPS
      )
    case 'other_not_sure':
      return unknownResult(
        status,
        'I need to understand your work eligibility before recommending career options. Please confirm your immigration status or work permission.'
      )
    case 'asylum_seeker': {
      const permission = getAsylumWorkPermission(state)
      if (!permission) {
        return {
          status,
          workEligible: 'unknown',
          pendingFollowUp: true,
          blocksRecommendations: true,
          allowsCareerAssessment: false,
          message: '',
          nextSteps: [],
          flags: {},
        }
      }
      if (permission === 'yes') {
        return allowedResult(
          status,
          'Thank you. I will build recommendations based on your permission to work.'
        )
      }
      if (permission === 'no') {
        return blockedResult(
          status,
          'Based on your current status, you may not currently have permission to work in the UK. Before planning a career path, you should check your immigration conditions and available support services.',
          ASYLUM_NO_NEXT_STEPS
        )
      }
      return unknownResult(
        status,
        'I need to confirm your work eligibility before recommending jobs or career paths.',
        ASYLUM_NOT_SURE_NEXT_STEPS
      )
    }
    default:
      return unknownResult(status, 'Please confirm your right to work before continuing.')
  }
}

export function pickWorkEligibilityFollowUpQuestion(
  state: CareerBrainState,
  status: UkWorkStatus | null
): { question: CareerBrainQuestion | null; reason: string } {
  if (needsAsylumWorkPermissionQuestion(state, status)) {
    return {
      question: ASYLUM_WORK_PERMISSION_QUESTION,
      reason: 'Work eligibility — confirm asylum work permission',
    }
  }
  return { question: null, reason: 'No eligibility follow-up required' }
}

export function canContinueCareerAssessment(
  state: CareerBrainState,
  status: UkWorkStatus | null
): boolean {
  const result = evaluateUkWorkEligibility(state, status)
  if (result.pendingFollowUp) return false
  return result.workEligible === true && result.allowsCareerAssessment
}

export function canGenerateCareerRecommendations(
  state: CareerBrainState,
  status: UkWorkStatus | null
): boolean {
  const result = evaluateUkWorkEligibility(state, status)
  return result.workEligible === true && !result.blocksRecommendations && !result.pendingFollowUp
}

export function buildWorkEligibilityGuidance(
  state: CareerBrainState,
  status: UkWorkStatus | null
): string {
  const result = evaluateUkWorkEligibility(state, status)
  if (result.message) return result.message

  if (status === 'student_visa') {
    const hours = String(answers(state).cb_student_visa_hours ?? '')
    const hourNote =
      hours === '20_hours'
        ? 'During term time you are usually limited to 20 hours per week.'
        : hours === 'full_time_vacation'
          ? 'You may be able to work full-time only outside term time — check your visa conditions.'
          : 'Check your visa and course provider rules before accepting work.'
    return `${hourNote}`.trim()
  }

  return ''
}

export function applyWorkEligibilityFlagsToConstraints(
  constraints: string[],
  flags: UkWorkEligibilityFlags
): string[] {
  const next = new Set(constraints)
  if (flags.graduateRoute) next.add('graduate-route')
  if (flags.visaRestricted) next.add('visa-restricted')
  if (flags.restrictedHours) {
    next.add('restricted-hours')
    next.add('student-visa')
    next.add('part-time')
  }
  if (flags.supportProgrammes) next.add('support-programmes')
  return [...next]
}
