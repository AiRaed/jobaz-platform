/**
 * Goal-first decision tree — routes to existing tested branch logic.
 */

import {
  pickFirstJobEducationQuestion,
  needsFirstJobEnglishQuestion,
} from './firstJobEducationPath'
import {
  isGlobalEducationComplete,
  pickGlobalEducationQuestion,
} from './globalEducationAlignment'
import {
  isGlobalEmployabilityComplete,
  nextFieldAwareGlobalQuestion,
} from './globalQuestions'
import {
  pickStudentEntryQuestion,
} from './studentPath'
import { pickTrainingReadinessQuestion } from './speedDevelopmentMode'
import { canProceedAfterWorkEligibility, pickAdaptiveEligibilityQuestion } from './rightToWork'
import {
  ENTRY_QUESTIONS,
  getExperienceTier,
  isGraduatePath,
  isStudentPath,
} from './entryClassification'
import {
  EXPERIENCE_LEVEL_QUESTION,
  pickExperienceAssessmentQuestion,
} from './experienceAssessment'
import {
  FIELD_INCOME_STRATEGY_QUESTION,
  needsFieldIncomeStrategyQuestion,
} from './careerTrackLock'
import {
  isUkTransitionPathComplete,
  pickUkTransitionPathQuestion,
} from './ukTransitionPath'
import {
  pickCareerChangePathQuestion,
  isCareerChangePathComplete,
  syncCareerChangeAnswers,
} from './careerChangePath'
import {
  isGrowCareerPathComplete,
  pickGrowCareerPathQuestion,
} from './growCareerPath'
import { isSideIncomePathComplete, pickSideIncomePathQuestion } from './sideIncomePath'
import { isBusinessDiscoveryPathComplete, pickBusinessDiscoveryPathQuestion } from './businessDiscoveryPath'
import {
  pickUnemployedPathQuestion,
  syncUnemployedPathAnswers,
} from './unemployedPath'
import { getRoutingGoal, getSelectedUserGoal, GOAL_QUESTION, SIDE_JOB_PROFILE_QUESTION, isNewToUkGoalSelected, isSideJobStudent } from './userGoal'
import type { CareerBrainQuestion, CareerBrainState } from './types'

function qFreeText(id: string, text: string, placeholder?: string): CareerBrainQuestion {
  return {
    id,
    text: placeholder ? `${text}\n\n(e.g. ${placeholder})` : text,
    type: 'single',
    options: [],
    allow_free_text: true,
  }
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

const SELF_EMPLOYED_QUESTIONS = {
  service: qFreeText('cb_self_service', 'What service do you offer?', 'design, tutoring, plumbing, consulting'),
  earning: q('cb_self_earning', 'Are you already earning from this work?', [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'Not yet' },
    { value: 'some', label: 'Some income' },
  ]),
  needClients: q('cb_self_need_clients', 'Do you need more clients or a side job for income?', [
    { value: 'clients', label: 'More clients' },
    { value: 'side_job', label: 'Side job for income' },
    { value: 'both', label: 'Both' },
  ]),
}

const BUSINESS_QUESTIONS = {
  type: qFreeText('cb_business_type', 'What type of business do you run?', 'cafe, online shop, trades, consultancy'),
  running: q('cb_business_running', 'Is the business already running?', [
    { value: 'yes', label: 'Yes' },
    { value: 'starting', label: 'Just starting' },
    { value: 'idea', label: 'Idea stage only' },
  ]),
  problem: q('cb_business_problem', 'What is your main challenge right now?', [
    { value: 'customers', label: 'Need customers' },
    { value: 'online', label: 'Need online presence' },
    { value: 'funding', label: 'Need funding' },
    { value: 'staff', label: 'Need staff' },
    { value: 'operations', label: 'Need operations help' },
    { value: 'compliance', label: 'Need compliance help' },
  ]),
}

const SIDE_EMPLOYED_QUESTIONS = {
  hours: q('cb_side_hours_week', 'How many hours per week can you do?', [
    { value: 'under_10', label: 'Under 10 hours' },
    { value: '10_20', label: '10–20 hours' },
    { value: '20_plus', label: '20+ hours' },
  ]),
  schedule: q('cb_side_schedule', 'What schedule works best?', [
    { value: 'evenings', label: 'Evenings' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'online', label: 'Online / remote' },
    { value: 'flexible', label: 'Flexible' },
  ]),
  intent: q('cb_side_income_intent', 'Is this extra income only, or a future career move?', [
    { value: 'income_only', label: 'Extra income only' },
    { value: 'future_change', label: 'Possible future career change' },
  ]),
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function needsExperienceCountry(state: CareerBrainState): boolean {
  if (isStudentPath(state) || isGraduatePath(state)) return false
  return getExperienceTier(state) === 'have_experience'
}

function pickHaveExperienceRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  const experience = pickExperienceAssessmentQuestion(state)
  if (experience.question) return experience
  if (!hasAnswer(state, 'cb_english')) {
    return { question: ENTRY_QUESTIONS.english, reason: 'Have experience — English for UK work' }
  }
  const global = nextFieldAwareGlobalQuestion(state)
  if (global) return { question: global.question, reason: `Have experience — ${global.id}` }
  return pickSharedTail(state)
}

function isExperiencedComplete(state: CareerBrainState): boolean {
  const goal = getRoutingGoal(state)
  if (goal === 'grow_career') {
    return isGrowCareerPathComplete(state)
  }
  if (goal === 'start_new_career' || goal === 'career_change') {
    return isCareerChangePathComplete(state)
  }
  return (
    hasAnswer(state, 'cb_professional_field') &&
    hasAnswer(state, 'cb_professional_experience') &&
    hasAnswer(state, 'cb_professional_field_intent')
  )
}

function isSelfEmployedComplete(state: CareerBrainState): boolean {
  return (
    hasAnswer(state, 'cb_self_service') &&
    hasAnswer(state, 'cb_self_earning') &&
    hasAnswer(state, 'cb_self_need_clients')
  )
}

function isSmallBusinessComplete(state: CareerBrainState): boolean {
  return (
    hasAnswer(state, 'cb_business_type') &&
    hasAnswer(state, 'cb_business_running') &&
    hasAnswer(state, 'cb_business_problem')
  )
}

function isSideEmployedComplete(state: CareerBrainState): boolean {
  return (
    hasAnswer(state, 'cb_side_hours_week') &&
    hasAnswer(state, 'cb_side_schedule') &&
    hasAnswer(state, 'cb_side_income_intent') &&
    isGlobalEmployabilityComplete(state)
  )
}

function pickFieldLockIfNeeded(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  if (needsFieldIncomeStrategyQuestion(state)) {
    return {
      question: FIELD_INCOME_STRATEGY_QUESTION,
      reason: 'Career track — focus on your field or allow temporary backup income',
    }
  }
  return { question: null, reason: 'Field lock not required' }
}

function pickSharedTail(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  const fieldLock = pickFieldLockIfNeeded(state)
  if (fieldLock.question) return fieldLock

  if (!isGlobalEducationComplete(state)) {
    const globalEdu = pickGlobalEducationQuestion(state)
    if (globalEdu.question) return globalEdu
  }

  if (needsExperienceCountry(state) && !hasAnswer(state, 'cb_experience_country')) {
    return {
      question: ENTRY_QUESTIONS.experienceCountry,
      reason: 'UK vs international experience',
    }
  }

  const eligibility = pickAdaptiveEligibilityQuestion(state)
  if (eligibility.question) return eligibility

  if (!canProceedAfterWorkEligibility(state)) {
    return { question: null, reason: 'UK work eligibility gate — career assessment paused' }
  }

  const training = pickTrainingReadinessQuestion(state)
  if (training.question) return training

  return { question: null, reason: 'Shared tail complete' }
}

/** First job — education → alignment → English (if needed) → training readiness. */
function pickFirstJobRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  const edu = pickFirstJobEducationQuestion(state)
  if (edu.question) return edu

  if (needsFirstJobEnglishQuestion(state) && !hasAnswer(state, 'cb_english')) {
    return { question: ENTRY_QUESTIONS.english, reason: 'Route 1 — English (can change recommendations)' }
  }

  const training = pickTrainingReadinessQuestion(state)
  if (training.question) return training

  const fieldLock = pickFieldLockIfNeeded(state)
  if (fieldLock.question) return fieldLock

  return { question: null, reason: 'Route 1 — first job flow complete' }
}

function pickSideJobRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_side_job_profile')) {
    return { question: SIDE_JOB_PROFILE_QUESTION, reason: 'Route 2 — side job profile' }
  }

  const jazSide = pickSideIncomePathQuestion(state)
  if (jazSide.question) {
    return { question: jazSide.question, reason: `JAZ Side Income — ${jazSide.reason}` }
  }

  if (isSideIncomePathComplete(state)) {
    const eligibility = pickAdaptiveEligibilityQuestion(state, { earlySimpleOnly: true })
    if (eligibility.question) return eligibility
    if (!canProceedAfterWorkEligibility(state)) {
      return { question: null, reason: 'Route 2 — UK work eligibility blocks further questions' }
    }
    return { question: null, reason: 'Route 2 — JAZ Side Income questioning complete' }
  }

  return { question: null, reason: 'Route 2 — awaiting JAZ side income evidence' }
}

function pickUrgentRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  const eligibility = pickAdaptiveEligibilityQuestion(state)
  if (eligibility.question) return eligibility

  if (!canProceedAfterWorkEligibility(state)) {
    return { question: null, reason: 'Route 3 — UK work eligibility blocks further questions' }
  }

  const global = nextFieldAwareGlobalQuestion(state)
  if (global) return { question: global.question, reason: `Route 3 urgent — ${global.id}` }

  const training = pickTrainingReadinessQuestion(state)
  if (training.question) return training

  return { question: null, reason: 'Route 3 complete' }
}

function pickCareerChangeRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickCareerChangePathQuestion(state)
}

function pickGrowCareerRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickGrowCareerPathQuestion(state)
}

function pickBusinessDiscoveryRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  const jazBiz = pickBusinessDiscoveryPathQuestion(state)
  if (jazBiz.question) {
    return { question: jazBiz.question, reason: `JAZ Business Discovery — ${jazBiz.reason}` }
  }

  if (isBusinessDiscoveryPathComplete(state)) {
    return { question: null, reason: 'JAZ Business Discovery questioning complete' }
  }

  return { question: null, reason: 'Awaiting JAZ business discovery evidence' }
}

function pickSelfEmployedRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickBusinessDiscoveryRoute(state)
}

function pickSmallBusinessRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickBusinessDiscoveryRoute(state)
}

function pickExploringRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_experience_level')) {
    return { question: EXPERIENCE_LEVEL_QUESTION, reason: 'Route 8 — experience level' }
  }

  const experience = pickExperienceAssessmentQuestion(state)
  if (experience.question) return experience
  if (!hasAnswer(state, 'cb_english')) {
    return { question: ENTRY_QUESTIONS.english, reason: 'Route 8 — English level' }
  }
  if (!hasAnswer(state, 'cb_discovery_work_setting')) {
    return { question: ENTRY_QUESTIONS.discoveryWorkSetting, reason: 'Route 8 — work setting preference' }
  }
  if (!hasAnswer(state, 'cb_discovery_social')) {
    return { question: ENTRY_QUESTIONS.discoverySocial, reason: 'Route 8 — people vs independent' }
  }
  if (!hasAnswer(state, 'cb_discovery_income_goal')) {
    return { question: ENTRY_QUESTIONS.discoveryIncomeGoal, reason: 'Route 8 — income vs growth' }
  }
  const global = nextFieldAwareGlobalQuestion(state)
  if (global) return { question: global.question, reason: `Route 8 — ${global.id}` }
  return pickSharedTail(state)
}

function pickUnemployedRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickUnemployedPathQuestion(state)
}

function pickStartBusinessRoute(state: CareerBrainState): { question: CareerBrainQuestion | null; reason: string } {
  return pickBusinessDiscoveryRoute(state)
}

export function pickDecisionTreeQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  state = syncCareerChangeAnswers(state)
  if (getRoutingGoal(state) === 'unemployed') {
    state = syncUnemployedPathAnswers(state)
  }
  if (!getSelectedUserGoal(state)) {
    return { question: GOAL_QUESTION, reason: 'Step 1 — what do you need right now?' }
  }

  if (isNewToUkGoalSelected(state)) {
    return pickUkTransitionPathQuestion(state)
  }
  const goal = getRoutingGoal(state)
  if (!goal) {
    return { question: null, reason: 'Unknown or dedicated path goal' }
  }

  switch (goal) {
    case 'first_job':
      return pickFirstJobRoute(state)
    case 'unemployed':
      return pickUnemployedRoute(state)
    case 'have_experience':
      return pickHaveExperienceRoute(state)
    case 'side_job':
      return pickSideJobRoute(state)
    case 'urgent_work':
      return pickUrgentRoute(state)
    case 'start_new_career':
    case 'career_change':
      return pickCareerChangeRoute(state)
    case 'grow_career':
      return pickGrowCareerRoute(state)
    case 'start_business':
      return pickStartBusinessRoute(state)
    case 'self_employed':
      return pickSelfEmployedRoute(state)
    case 'small_business':
      return pickSmallBusinessRoute(state)
    case 'exploring':
      return pickExploringRoute(state)
    default:
      return { question: null, reason: 'Unknown goal' }
  }
}

export function isDecisionTreeComplete(state: CareerBrainState): boolean {
  if (!getSelectedUserGoal(state)) return false
  if (isNewToUkGoalSelected(state)) return isUkTransitionPathComplete(state)
  return pickDecisionTreeQuestion(state).question === null
}
