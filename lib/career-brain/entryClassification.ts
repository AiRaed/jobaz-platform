/**
 * Phases 1–3 — structured entry classification before adaptive Career Brain reasoning.
 */

import {
  isGraduateEntryComplete,
  pickGraduateEntryQuestion,
} from './graduatePath'
import { applyBridgeModeToProfile } from './bridgeRoleIntelligence'
import { applyDualPathModeToProfile } from './dualPathMode'
import { applyFlexibleEmploymentModeToProfile } from './flexibleEmploymentMode'
import { applyStudentExperienceToProfile } from './studentExperience'
import { isStudentEntryComplete, pickStudentEntryQuestion } from './studentPath'
import {
  applyNewToUkContextToProfile,
} from './newToUkContext'
import {
  applySpeedDevelopmentToProfile,
  TRAINING_READINESS_QUESTION,
} from './speedDevelopmentMode'
import {
  applyRightToWorkToProfile,
  isRightToWorkComplete,
} from './rightToWork'
import {
  applyFirstJobEducationToProfile,
  isFirstJobEducationComplete,
  isFirstJobPath,
  pickFirstJobEducationQuestion,
} from './firstJobEducationPath'
import {
  applyGlobalEducationToProfile,
  isGlobalEducationComplete,
  pickGlobalEducationQuestion,
} from './globalEducationAlignment'
import { applyFieldAlignmentToProfile, hasFieldAlignmentAnswer } from './fieldAlignment'
import { applyCareerTrackLockToProfile } from './careerTrackLock'
import {
  normalizeExperienceLevel,
  EXPERIENCE_LEVEL_QUESTION,
} from './experienceAssessment'
import { getRoutingGoal, getSelectedUserGoal, syncLegacySituationAnswer, isStartNewCareerGoal } from './userGoal'
import { applyUnemployedPathToProfile } from './unemployedPath'
import { applyCareerChangePathToProfile, syncCareerChangeAnswers } from './careerChangePath'
import { applyGrowCareerPathToProfile } from './growCareerPath'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile, UrgencyLevel } from './types'

export type EntrySituation =
  | 'student_part_time'
  | 'first_job'
  | 'side_income'
  | 'career_change'
  | 'unemployed_urgent'
  | 'graduate_little_exp'
  | 'experienced_professional'
  | 'new_to_uk'
  | 'self_employed'
  | 'small_business'
  | 'exploring'

export type ExperienceTier = 'no_experience' | 'have_experience'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false,
  maxSelect?: number
): CareerBrainQuestion {
  return {
    id,
    text,
    type: multi ? 'multi' : 'single',
    options,
    max_select: maxSelect,
    allow_free_text: options.length === 0,
  }
}

function qFreeText(id: string, text: string, placeholder?: string): CareerBrainQuestion {
  return {
    id,
    text: placeholder ? `${text}\n\n(e.g. ${placeholder})` : text,
    type: 'single',
    options: [],
    allow_free_text: true,
  }
}

export const ENTRY_QUESTIONS = {
  situation: q('cb_entry_situation', 'What best describes your current situation?', [
    { value: 'first_job', label: 'Looking for my first job' },
    { value: 'graduate_little_exp', label: 'Graduate with little/no experience' },
    { value: 'student_part_time', label: 'Student looking for part-time work' },
    { value: 'unemployed_urgent', label: 'Unemployed and need work urgently' },
    { value: 'side_income', label: 'Employed but looking for side income' },
    { value: 'career_change', label: 'Employed but want career change' },
    { value: 'experienced_professional', label: 'Experienced professional' },
    { value: 'self_employed', label: 'Self-employed / Freelancer' },
    { value: 'small_business', label: 'Small business owner' },
    { value: 'exploring', label: 'Not sure / exploring options' },
  ]),
  experienceCountry: q('cb_experience_country', 'Was your experience in the UK or outside the UK?', [
    { value: 'mostly_uk', label: 'Mostly UK experience' },
    { value: 'mostly_international', label: 'Mostly international experience' },
    { value: 'both', label: 'Both UK and international' },
  ]),
  experienceLevel: EXPERIENCE_LEVEL_QUESTION,
  ukDrivingLicence: q('cb_uk_driving_licence', 'Do you have a UK driving licence?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]),
  hasCar: q('cb_has_car', 'Do you have access to a car for work?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'sometimes', label: 'Sometimes / shared car' },
  ]),
  english: q('cb_english', 'How confident is your English for UK work?', [
    { value: 'basic', label: 'Basic — simple tasks only' },
    { value: 'intermediate', label: 'Intermediate — everyday communication' },
    { value: 'good', label: 'Good — comfortable at work' },
    { value: 'fluent', label: 'Fluent' },
  ]),
  physical: q('cb_physical_ability', 'Are you comfortable with physical work?', [
    { value: 'heavy_physical', label: 'Heavy physical work' },
    { value: 'light_physical', label: 'Light physical work' },
    { value: 'non_physical', label: 'Prefer non-physical work' },
  ]),
  customer: q('cb_customer_comfort', 'Are you comfortable dealing with customers?', [
    { value: 'yes', label: 'Yes' },
    { value: 'sometimes', label: 'Sometimes / depends' },
    { value: 'no', label: 'Prefer not customer-facing' },
  ]),
  shifts: q('cb_shift_flexibility', 'Are you okay with shift or night work?', [
    { value: 'yes', label: 'Yes' },
    { value: 'day_only', label: 'Day shifts only' },
    { value: 'flexible', label: 'Flexible' },
  ]),
  training: TRAINING_READINESS_QUESTION,
  workPreference: q('cb_entry_work_preference', 'What type of work sounds best for you?', [
    { value: 'driving_delivery', label: 'Driving / delivery' },
    { value: 'physical_practical', label: 'Physical / practical work' },
    { value: 'customer_facing', label: 'Customer-facing work' },
    { value: 'office_computer', label: 'Office / computer work' },
    { value: 'creative_work', label: 'Creative work' },
    { value: 'care_support', label: 'Care / support work' },
    { value: 'flexible_part_time', label: 'Flexible / part-time work' },
    { value: 'quick_income', label: 'Any work for quick income' },
  ]),
  basicExperience: qFreeText(
    'cb_basic_experience_text',
    'What type of work experience do you have?',
    'waiter, warehouse, delivery, retail assistant, kitchen staff, cleaner'
  ),
  continueInField: q('cb_continue_in_field', 'Do you want to continue in this type of work?', [
    { value: 'yes', label: 'Yes' },
    { value: 'related', label: 'Related field' },
    { value: 'different', label: 'Different field' },
    { value: 'unsure', label: 'Not sure' },
  ]),
  discoveryWorkSetting: q('cb_discovery_work_setting', 'Do you prefer office/computer work or physical/practical work?', [
    { value: 'office', label: 'Office / computer' },
    { value: 'physical', label: 'Physical / practical' },
    { value: 'either', label: 'Either — open to both' },
  ]),
  discoverySocial: q('cb_discovery_social', 'Do you prefer social/customer-facing work or more independent work?', [
    { value: 'social', label: 'Social / customer-facing' },
    { value: 'independent', label: 'Independent / behind the scenes' },
    { value: 'mixed', label: 'Mixed is fine' },
  ]),
  discoveryIncomeGoal: q('cb_discovery_income_goal', 'What matters more right now?', [
    { value: 'fast_income', label: 'Fast income' },
    { value: 'stable_long_term', label: 'Stable long-term growth' },
    { value: 'balance', label: 'Balance of both' },
  ]),
  professionalField: qFreeText(
    'cb_professional_field',
    'What field do you work in?',
    'animation, accounting, nursing, logistics, hospitality'
  ),
  professionalExperience: qFreeText(
    'cb_professional_experience',
    'What experience do you have in this field?',
    '3 years as animator, 5 years taxi driver, senior warehouse operative'
  ),
  professionalIntent: q('cb_professional_field_intent', 'Do you want to continue in this field?', [
    { value: 'same_field', label: 'Yes — same field' },
    { value: 'related_field', label: 'Related field' },
    { value: 'change_field', label: 'Career change — different field' },
    { value: 'unsure', label: 'Not sure yet' },
  ]),
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

export function getEntrySituation(state: CareerBrainState): EntrySituation | null {
  const legacy = answers(state).cb_entry_situation
  if (!getRoutingGoal(state) && !getSelectedUserGoal(state) && legacy) {
    return String(legacy) as EntrySituation
  }
  const resolved = syncLegacySituationAnswer(state).answers?.cb_entry_situation
  return resolved ? (String(resolved) as EntrySituation) : null
}

export function getExperienceTier(state: CareerBrainState): ExperienceTier | null {
  const v = answers(state).cb_experience_level
  if (!v) return null
  return normalizeExperienceLevel(String(v))
}

export function isStudentPath(state: CareerBrainState): boolean {
  return getEntrySituation(state) === 'student_part_time'
}

export function getExperiencePath(state: CareerBrainState): ExperienceTier | null {
  return getExperienceTier(state)
}

export function isGraduatePath(state: CareerBrainState): boolean {
  if (getEntrySituation(state) !== 'graduate_little_exp') return false
  // Goal-first first job route uses education block, not legacy graduate questions
  if (getRoutingGoal(state) === 'first_job' && answers(state).cb_first_job_education_level) {
    return false
  }
  return true
}

/** Generic employability path — NOT for graduates. */
export function isGenericNoExperiencePath(state: CareerBrainState): boolean {
  if (isGraduatePath(state) || isStudentPath(state)) return false
  if (getExperienceTier(state) !== 'no_experience') return false
  const s = getEntrySituation(state)
  return s === 'first_job' || s === 'unemployed_urgent' || s === 'exploring'
}

export function isNoExperiencePath(state: CareerBrainState): boolean {
  return isGenericNoExperiencePath(state)
}

export function isSmallBasicPath(state: CareerBrainState): boolean {
  return getExperienceTier(state) === 'have_experience'
}

export function isExperiencedPath(state: CareerBrainState): boolean {
  return (
    getExperienceTier(state) === 'have_experience' &&
    hasAnswer(state, 'cb_professional_field')
  )
}

const NO_EXP_REQUIRED = [
  'cb_english',
  'cb_uk_driving_licence',
  'cb_physical_ability',
  'cb_customer_comfort',
  'cb_shift_flexibility',
  'cb_entry_work_preference',
] as const

function needsExperienceCountry(state: CareerBrainState): boolean {
  if (isStudentPath(state) || isGraduatePath(state)) return false
  const tier = getExperienceTier(state)
  return tier === 'have_experience'
}

function isNoExperienceEmployabilityComplete(state: CareerBrainState): boolean {
  for (const id of NO_EXP_REQUIRED) {
    if (!hasAnswer(state, id)) return false
  }
  if (answers(state).cb_uk_driving_licence === 'yes' && !hasAnswer(state, 'cb_has_car')) {
    return false
  }
  return true
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function isNoExperiencePathComplete(state: CareerBrainState): boolean {
  return isNoExperienceEmployabilityComplete(state)
}

function isHaveExperiencePathComplete(state: CareerBrainState): boolean {
  const { isExperienceAssessmentComplete } = require('./experienceAssessment') as typeof import('./experienceAssessment')
  return isExperienceAssessmentComplete(state)
}

function isExperiencedPathComplete(state: CareerBrainState): boolean {
  return (
    hasAnswer(state, 'cb_professional_field') &&
    hasAnswer(state, 'cb_professional_experience') &&
    hasAnswer(state, 'cb_professional_field_intent')
  )
}

export function isStructuredEntryComplete(state: CareerBrainState): boolean {
  state = syncLegacySituationAnswer(state)
  const { isDecisionTreeComplete } = require('./decisionTree') as typeof import('./decisionTree')
  if (!isDecisionTreeComplete(state)) return false
  if (!isRightToWorkComplete(state)) return false
  return true
}

export function pickStructuredEntryQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  const { pickDecisionTreeQuestion } = require('./decisionTree') as typeof import('./decisionTree')
  return pickDecisionTreeQuestion(syncLegacySituationAnswer(state))
}

export function applyEntrySituationToProfile(
  profile: CareerProfile,
  situation: EntrySituation,
  state?: CareerBrainState
): CareerProfile {
  const next = { ...profile }
  switch (situation) {
    case 'unemployed_urgent':
      if (!state || getSelectedUserGoal(state) !== 'unemployed') {
        next.urgencyLevel = 'high'
      }
      break
    case 'career_change':
      next.wantsCareerChange = true
      next.wantsSameField = false
      break
    case 'side_income':
      next.constraints = [...new Set([...next.constraints, 'part-time', 'side-income'])]
      break
    case 'student_part_time':
      next.constraints = [...new Set([...next.constraints, 'part-time', 'student'])]
      break
    case 'first_job':
    case 'graduate_little_exp':
      next.yearsOfExperience = next.yearsOfExperience ?? 0
      break
    case 'experienced_professional':
      next.confidence = Math.max(next.confidence, 0.5)
      break
    case 'exploring':
      break
    case 'new_to_uk':
      next.experienceCountry = next.experienceCountry ?? 'non-UK'
      next.constraints = [...new Set([...next.constraints, 'new-to-uk'])]
      break
    case 'self_employed':
      next.constraints = [...new Set([...next.constraints, 'self-employed'])]
      break
    case 'small_business':
      next.constraints = [...new Set([...next.constraints, 'small-business'])]
      break
    default:
      break
  }
  return next
}

export function applyEntryAnswersToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  let next = { ...profile }
  const a = answers(state)

  const situation = getEntrySituation(state)
  if (situation) next = applyEntrySituationToProfile(next, situation, state)

  const goal = getRoutingGoal(state)
  if (goal === 'first_job') {
    next.yearsOfExperience = 0
    next.workExperienceField = null
    next.constraints = [...new Set([...next.constraints, 'first-job-path', 'first-job-no-prior-exp'])]
  }
  if (isStartNewCareerGoal(goal) || situation === 'career_change') {
    next.wantsCareerChange = true
    if (a.cb_change_current_field) {
      const field = String(a.cb_change_current_field).trim()
      next.workExperienceField = field
      next.studyField = next.studyField ?? field
    }
    const directionTarget: Record<string, string> = {
      office_admin: 'office work',
      it_digital: 'IT',
      driving_logistics: 'driving logistics',
      care_support: 'care support',
      creative_media: 'creative media',
      skilled_trade: 'skilled trade',
    }
    const dir = String(a.cb_change_direction ?? '')
    if (dir && directionTarget[dir]) {
      next.targetField = directionTarget[dir]
    }
  }
  if (goal === 'grow_career' && (a.cb_grow_field || a.jaz_job_title || a.currentJobTitle)) {
    next = applyGrowCareerPathToProfile(next, state)
  }

  const tier = getExperienceTier(state)
  if (isStudentPath(state)) {
    const study = String(a.cb_student_study_field ?? '').trim()
    if (study) {
      next.studyField = study
      next.educationLevel = next.educationLevel ?? 'college'
    }
    next.constraints = [...new Set([...next.constraints, 'part-time', 'student'])]
    const sintent = String(a.cb_student_work_intent ?? '')
    if (sintent.includes('related_studies')) {
      next.wantsSameField = true
      next.wantsCareerChange = false
    } else if (sintent.includes('open_both')) {
      next.wantsSameField = null
    } else if (sintent.includes('any_job')) {
      next.wantsSameField = false
      next.wantsCareerChange = null
    }
    if (a.cb_student_work_style) next.targetField = String(a.cb_student_work_style)
    if (a.cb_experience_level === 'no_experience') {
      next.yearsOfExperience = 0
    }
    if (a.cb_student_availability) {
      next.constraints = [...new Set([...next.constraints, String(a.cb_student_availability)])]
    }
    const expIntent = String(a.cb_student_continue_experience ?? '')
    if (expIntent.includes('yes_continue')) {
      next.wantsSameField = true
    } else if (expIntent.includes('no_different')) {
      next.wantsCareerChange = true
    }
    next = applyStudentExperienceToProfile(next, state)
    if (hasFieldAlignmentAnswer(state)) {
      next = applyFieldAlignmentToProfile(next, state)
    }
  } else if (isGraduatePath(state)) {
    const study = String(a.cb_graduate_study_field ?? a.cb_study_field ?? '').trim()
    if (study) {
      next.studyField = study
      next.educationLevel = next.educationLevel ?? 'degree'
    }
    next.yearsOfExperience = next.yearsOfExperience ?? 0
    if (a.cb_graduate_urgency === 'urgent') next.urgencyLevel = 'high'
    if (hasFieldAlignmentAnswer(state)) {
      next = applyFieldAlignmentToProfile(next, state)
    }
    if (a.cb_graduate_urgency === 'urgent') {
      next = applyDualPathModeToProfile(next, state)
    }
  } else if (tier === 'no_experience' && isGenericNoExperiencePath(state)) {
    next.yearsOfExperience = 0
    next.workExperienceField = null
    next.educationLevel = next.educationLevel ?? 'none'
  }

  if (tier === 'have_experience') {
    const expText = String(
      a.cb_work_experience_field ?? a.cb_basic_experience_text ?? a.cb_professional_field ?? ''
    ).trim()
    if (expText) {
      next.workExperienceField = expText
      next.yearsOfExperience = next.yearsOfExperience ?? 1
    }
    const relation = String(a.cb_experience_field_relation ?? '')
    if (relation.includes('study_related') && !relation.includes('both_fields')) {
      next.wantsSameField = true
      next.wantsCareerChange = false
    } else if (relation.includes('different_field') && !relation.includes('both_fields')) {
      next.wantsCareerChange = null
    }
    const country = String(a.cb_experience_country ?? '')
    if (country.includes('mostly_uk')) next.experienceCountry = 'UK'
    else if (country.includes('mostly_international')) next.experienceCountry = 'non-UK'
    else if (country.includes('both')) next.experienceCountry = 'UK'
  }

  if (tier === 'have_experience' && a.cb_professional_field) {
    if (a.cb_professional_field) {
      next.workExperienceField = String(a.cb_professional_field).trim()
      next.studyField = next.studyField ?? String(a.cb_professional_field).trim()
    }
    if (a.cb_professional_experience) {
      next.workExperienceField = String(a.cb_professional_experience).trim()
    }
  }

  const continueField = String(
    a.cb_continue_in_field ??
      a.cb_graduate_field_intent ??
      a.cb_professional_field_intent ??
      ''
  )
  if (continueField.includes('yes') || continueField.includes('same_field')) {
    next.wantsSameField = true
    next.wantsCareerChange = false
  } else if (continueField.includes('related')) {
    next.wantsSameField = true
    next.wantsCareerChange = false
  } else if (continueField.includes('different') || continueField.includes('change_field')) {
    next.wantsCareerChange = true
    next.wantsSameField = false
  }

  if (a.cb_change_target_field) {
    next.targetField = String(a.cb_change_target_field).trim()
    next.wantsCareerChange = true
  }
  if (a.cb_entry_work_preference) {
    next.targetField = String(a.cb_entry_work_preference)
  }

  if (a.cb_english) {
    const eng = String(a.cb_english)
    next.englishLevel =
      eng === 'intermediate' ? 'intermediate' : eng === 'good' ? 'good' : eng
    if (eng === 'functional') next.englishLevel = 'intermediate'
    if (eng === 'comfortable') next.englishLevel = 'good'
  }
  if (a.cb_physical_ability) {
    const p = String(a.cb_physical_ability)
    if (p === 'non_physical' || p === 'no') {
      next.constraints = [...new Set([...next.constraints, 'non-physical'])]
    }
    if (p === 'heavy_physical' || p === 'light_physical' || p === 'yes') {
      next.constraints = [...new Set([...next.constraints, 'physical-work'])]
    }
  }
  if (a.cb_entry_work_preference === 'customer_facing') {
    next.constraints = [...new Set([...next.constraints, 'customer-facing-pref'])]
  }
  if (a.cb_entry_work_preference === 'physical_practical') {
    next.constraints = [...new Set([...next.constraints, 'physical-work'])]
  }
  if (a.cb_entry_work_preference === 'office_computer') {
    next.constraints = [...new Set([...next.constraints, 'non-physical'])]
  }
  if (a.cb_customer_comfort === 'no') {
    next.constraints = [...new Set([...next.constraints, 'no-customer-facing'])]
  }
  if (a.cb_uk_driving_licence === 'yes' || a.cb_driving_licence === 'yes') {
    next.licences = [...new Set([...next.licences, 'Driving licence'])]
  }
  if (a.cb_discovery_income_goal === 'fast_income' || situation === 'unemployed_urgent') {
    next.urgencyLevel = 'high'
  }
  if (a.cb_discovery_income_goal === 'stable_long_term') {
    next.urgencyLevel = 'low'
  }

  next = applySpeedDevelopmentToProfile(next, state)
  next = applyFirstJobEducationToProfile(next, state)
  next = applyCareerChangePathToProfile(next, state)
  next = applyGrowCareerPathToProfile(next, state)
  next = applyUnemployedPathToProfile(next, state)
  next = applyGlobalEducationToProfile(next, state)
  next = applyRightToWorkToProfile(next, state)
  next = applyCareerTrackLockToProfile(next, state)

  if (goal !== 'first_job') {
    const { applyCareerDirectionPriorityToProfile } = require('./educationExperienceSplit') as typeof import('./educationExperienceSplit')
    next = applyCareerDirectionPriorityToProfile(next, state)
  }

  // Explicit field alignment must win over inferred study/experience signals applied earlier.
  if (hasFieldAlignmentAnswer(state)) {
    next = applyFieldAlignmentToProfile(next, state)
  }

  return next
}

export function syncEntryClassification(state: CareerBrainState): CareerBrainState {
  state = syncLegacySituationAnswer(state)
  state = syncCareerChangeAnswers(state)
  const goal = getRoutingGoal(state)
  const tier = goal === 'first_job' ? ('no_experience' as const) : getExperienceTier(state)
  const graduate = isGraduatePath(state)
  const student = isStudentPath(state)
  const genericNoExp = goal === 'first_job' || isGenericNoExperiencePath(state)
  const entryPath =
    goal === 'first_job'
      ? 'first_job'
      : graduate
        ? 'graduate'
        : student
          ? 'student'
          : genericNoExp
            ? 'no_experience'
            : tier
  const hasFirstJobEdu = Boolean(answers(state).cb_first_job_education_level)
  return {
    ...state,
    classification: {
      ...(state.classification ?? {}),
      entry_situation: getEntrySituation(state) ?? state.classification?.entry_situation,
      experience_tier: tier ?? state.classification?.experience_tier,
      entry_path: entryPath,
      edu:
        goal === 'first_job'
          ? hasFirstJobEdu
            ? 'yes'
            : 'no'
          : graduate || student || (tier && tier !== 'no_experience')
            ? 'yes'
            : genericNoExp
              ? 'no'
              : state.classification?.edu,
      exp:
        goal === 'first_job' || genericNoExp || (tier === 'no_experience' && (graduate || student))
          ? 'no'
          : tier
            ? 'yes'
            : state.classification?.exp,
    },
    classification_done: isStructuredEntryComplete(state),
  }
}

export function parseUrgencyFromEntry(state: CareerBrainState): UrgencyLevel | null {
  const s = getEntrySituation(state)
  if (s === 'unemployed_urgent') return 'high'
  if (String(state.answers?.cb_discovery_income_goal) === 'fast_income') return 'high'
  if (String(state.answers?.cb_discovery_income_goal) === 'stable_long_term') return 'low'
  if (String(state.answers?.cb_entry_work_preference) === 'quick_income') return 'high'
  return null
}
