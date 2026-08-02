/**
 * IT / Technology work experience — targeted recommendations when user selects IT background.
 */

import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'
import { inferBridgeField, wantsBridgeRoleDiscovery } from './bridgeRoleIntelligence'
import { wantsFlexibleEmploymentMode } from './flexibleEmploymentMode'
import { wantsDualPathMode } from './dualPathMode'
import { getFieldAlignment } from './fieldAlignment'
import { inferStudentStudyDomain } from './studentPath'
import {
  getSelectedExperienceCategories,
  inferExperienceCategory,
  resolvePrimaryExperienceCategory,
} from './studentExperience'
import { rec } from './resultBuilder'

export function hasItTechnologyExperience(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  if (profile.constraints.includes('exp-it_technology')) return true
  const selected = state ? getSelectedExperienceCategories(state) : []
  if (selected.includes('it_technology')) return true
  return inferExperienceCategory(profile.workExperienceField ?? '') === 'it_technology'
}

function shouldIncludeDataEntry(profile: CareerProfile, state?: CareerBrainState): boolean {
  const selected = state ? getSelectedExperienceCategories(state) : []
  if (selected.includes('office_admin')) return true
  const style = String(state?.answers?.cb_student_work_style ?? profile.targetField ?? '')
  if (style === 'office') return true
  return inferExperienceCategory(profile.workExperienceField ?? '') === 'office_admin'
}

function hybridComboOverridesItPath(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (!state || !profile.constraints.includes('student')) return false
  const selected = getSelectedExperienceCategories(state)
  if (!selected.includes('it_technology') || selected.length <= 1) return false

  const studyDomain = inferStudentStudyDomain(profile.studyField ?? '')
  if (studyDomain === 'creative' && selected.includes('retail')) return true
  if (studyDomain === 'business' && selected.includes('retail')) return true
  if (studyDomain === 'media' && selected.includes('hospitality')) return true
  return false
}

export function shouldApplyItExperiencePath(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  if (!hasItTechnologyExperience(profile, state)) return false
  if (wantsFlexibleEmploymentMode(profile, state)) return false
  if (hybridComboOverridesItPath(profile, state)) return false

  const alignment = state ? getFieldAlignment(state) : null
  const bridgeField = inferBridgeField(profile.studyField, profile.targetField)

  if (wantsBridgeRoleDiscovery(profile, state)) {
    if (alignment === 'yes' && bridgeField !== 'computer_science' && bridgeField !== 'general') {
      return false
    }
  }

  if (wantsDualPathMode(profile, state)) {
    if (bridgeField !== 'computer_science' && bridgeField !== 'general') {
      return false
    }
  }

  return true
}

function buildItWorkNow(profile: CareerProfile, state?: CareerBrainState): CareerBrainRecommendation[] {
  const roles: CareerBrainRecommendation[] = [
    rec(
      'IT Support Assistant',
      'Work Now — your IT/technology experience suits helpdesk-style entry roles',
      'work_now',
      'IT_digital'
    ),
    rec(
      'Junior IT Support',
      'Work Now — common part-time or entry IT support route for students',
      'work_now',
      'IT_digital'
    ),
    rec(
      'Technical Support Assistant',
      'Work Now — troubleshooting and user support fit your background',
      'work_now',
      'IT_digital'
    ),
    rec(
      'Helpdesk Assistant',
      'Work Now — ticket-based support while you build UK work history',
      'work_now',
      'IT_digital'
    ),
  ]

  if (shouldIncludeDataEntry(profile, state)) {
    roles.push(
      rec(
        'Data Entry',
        'Work Now — structured computer work alongside IT support experience',
        'work_now',
        'admin_business'
      )
    )
  }

  return roles
}

const IT_BUILD_NEXT: CareerBrainRecommendation[] = [
  rec(
    'CompTIA IT Fundamentals',
    'Build Next — foundation IT certification for support and tech roles',
    'build_next',
    'IT_digital'
  ),
  rec(
    'CompTIA A+',
    'Build Next — recognised helpdesk and hardware/software support credential',
    'build_next',
    'IT_digital'
  ),
  rec(
    'Google IT Support Certificate',
    'Build Next — structured remote-friendly IT support training',
    'build_next',
    'IT_digital'
  ),
  rec(
    'Excel & Data Skills',
    'Build Next — data handling skills useful for IT and analyst progression',
    'build_next',
    'IT_digital'
  ),
  rec(
    'Basic Networking Skills',
    'Build Next — networking fundamentals for systems and support careers',
    'build_next',
    'IT_digital'
  ),
]

const IT_LONG_TERM: CareerBrainRecommendation[] = [
  rec(
    'IT Support Specialist',
    'Long-Term Path — helpdesk and end-user systems support career',
    'long_term',
    'IT_digital'
  ),
  rec(
    'Systems Administrator',
    'Long-Term Path — infrastructure and workplace systems management',
    'long_term',
    'IT_digital'
  ),
  rec(
    'Cybersecurity Pathway',
    'Long-Term Path — security-focused progression from IT foundations',
    'long_term',
    'IT_digital'
  ),
  rec(
    'Software Development Pathway',
    'Long-Term Path — coding and engineering route after support experience',
    'long_term',
    'IT_digital'
  ),
  rec(
    'Data Analyst Pathway',
    'Long-Term Path — data and reporting careers building on digital skills',
    'long_term',
    'IT_digital'
  ),
]

export function buildItExperienceRecommendations(
  profile: CareerProfile,
  state?: CareerBrainState
): { recommendations: CareerBrainRecommendation[]; reason: string } | null {
  if (!shouldApplyItExperiencePath(profile, state)) return null

  const raw = profile.workExperienceField ?? ''
  const category = state
    ? resolvePrimaryExperienceCategory(raw, getSelectedExperienceCategories(state))
    : inferExperienceCategory(raw)

  return {
    recommendations: [...buildItWorkNow(profile, state), ...IT_BUILD_NEXT, ...IT_LONG_TERM],
    reason: `IT experience path — ${category === 'it_technology' ? 'technology background' : 'IT-aligned experience'} with combined profile signals`,
  }
}

export function getItExperienceLongTermRecommendations(): CareerBrainRecommendation[] {
  return [...IT_LONG_TERM]
}

/** Use IT long-term destinations when study bridge is generic but experience is IT-focused. */
export function shouldUseItExperienceLongTerm(
  profile: CareerProfile,
  state: CareerBrainState | undefined,
  bridgeField: string
): boolean {
  if (!hasItTechnologyExperience(profile, state)) return false
  if (wantsFlexibleEmploymentMode(profile, state)) return false
  if (bridgeField !== 'general') return false
  return true
}
