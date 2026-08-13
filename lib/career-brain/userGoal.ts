/**
 * Top-level user goal — professional intent before admin/eligibility questions.
 */

import {
  getFirstJobEducationLevel,
  isDegreeOrAbove,
} from './firstJobEducationPath'
import {
  isNewToUkContext,
  isNewToUkGoalSelected,
  syncNewToUkContext,
} from './newToUkContext'
import { syncUkTransitionProfileAnswers } from './ukTransitionPath'
import { syncUnemployedPathAnswers } from './unemployedPath'
import type { CareerBrainQuestion, CareerBrainState } from './types'

/** Strategic goals shown on the Career Assistant homepage. */
export const STRATEGIC_GOAL_IDS = [
  'work_in_education',
  'work_in_profession',
  'work_in_experience',
  'start_new_career',
  'grow_career',
  'side_job',
  'start_business',
] as const

export type StrategicGoalId = (typeof STRATEGIC_GOAL_IDS)[number]

/** Visible top-level intents on the pathway selector. */
export type UserGoal =
  | StrategicGoalId
  | 'first_job'
  | 'unemployed'
  | 'career_change'
  | 'new_to_uk'
  /** Internal / legacy — not shown on the pathway selector */
  | 'have_experience'
  | 'urgent_work'
  | 'self_employed'
  | 'small_business'
  | 'exploring'

/** Goals used by decision-tree routing (excludes context-only new_to_uk). */
export type RoutingGoal = Exclude<UserGoal, 'new_to_uk'>

/** Legacy situation slug — mirrors EntrySituation in entryClassification. */
export type LegacySituation =
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

/** Legacy situation values still accepted from saved sessions / dev scenarios. */
const LEGACY_SITUATION_TO_GOAL: Partial<Record<LegacySituation, UserGoal>> = {
  first_job: 'first_job',
  graduate_little_exp: 'first_job',
  student_part_time: 'side_job',
  side_income: 'side_job',
  unemployed_urgent: 'unemployed',
  career_change: 'start_new_career',
  experienced_professional: 'grow_career',
  self_employed: 'self_employed',
  small_business: 'start_business',
  exploring: 'unemployed',
  new_to_uk: 'new_to_uk',
}

function q(
  id: string,
  text: string,
  options: Array<{
    value: string
    label: string
    description?: string
    disabled?: boolean
    badge?: string
    helperText?: string
  }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

/** Strategic career goals — outcome-focused, not employment status.
 * Launch: Experience removed (replaced by Profession). Grow + Business kept but Coming Soon.
 */
export const GOAL_QUESTION = q('cb_user_goal', 'Which career goal are you working towards?', [
  {
    value: 'work_in_education',
    label: '🎓 Work in my Education',
    description: 'Use my qualification to build a career in the UK.',
  },
  {
    value: 'work_in_profession',
    label: '🛠️ Work in My Profession',
    description: 'Find the closest UK career route based on my practical work experience.',
  },
  {
    value: 'start_new_career',
    label: '🌱 Start a New Career',
    description: 'Move into a completely different profession and learn a new career.',
  },
  {
    value: 'side_job',
    label: '💰 Looking for Extra Income',
    description: 'Find part-time work, freelancing, gig economy, or side income opportunities.',
  },
  {
    value: 'grow_career',
    label: '📈 Grow in my Current Career',
    description: 'Get promoted, earn more, or progress further in my current profession.',
    disabled: true,
    badge: 'Coming Soon',
    helperText: 'Available in a future update.',
  },
  {
    value: 'start_business',
    label: '🚀 Start My Own Business',
    description: 'Build a business, become self-employed, or launch a startup.',
    disabled: true,
    badge: 'Coming Soon',
    helperText: 'Available in a future update.',
  },
])

export const SIDE_JOB_PROFILE_QUESTION = q(
  'cb_side_job_profile',
  'Which best describes you?',
  [
    { value: 'student', label: 'Student' },
    { value: 'employed_full', label: 'Employed full-time' },
    { value: 'employed_part', label: 'Employed part-time' },
    { value: 'self_employed', label: 'Self-employed' },
    { value: 'not_working', label: 'Not currently working' },
  ]
)

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

/** True when the user is on the Start a New Career path (includes legacy career_change). */
export function isStartNewCareerGoal(goal: string | null | undefined): boolean {
  return goal === 'start_new_career' || goal === 'career_change'
}

export function isStartNewCareerPath(state: CareerBrainState): boolean {
  const selected = getSelectedUserGoal(state)
  const routing = getRoutingGoal(state)
  return isStartNewCareerGoal(selected) || isStartNewCareerGoal(routing)
}

/** What the user selected on the first screen (raw value, includes legacy goals). */
export function getSelectedUserGoal(state: CareerBrainState): UserGoal | null {
  const raw = answers(state).cb_user_goal
  if (raw) return String(raw) as UserGoal
  const legacy = answers(state).cb_entry_situation
  if (legacy) {
    return LEGACY_SITUATION_TO_GOAL[String(legacy) as LegacySituation] ?? null
  }
  return null
}

/**
 * Map legacy situation-based goals to strategic paths for recommendations.
 * Decision-tree routing keeps first_job / unemployed for in-progress legacy sessions.
 */
export function resolveStrategicGoal(state: CareerBrainState): RoutingGoal | null {
  const selected = getSelectedUserGoal(state)
  if (!selected || selected === 'new_to_uk') return null

  if (selected === 'career_change') return 'start_new_career'

  if (selected === 'first_job') {
    const tier = getExperienceTierLocal(state)
    const edu = getFirstJobEducationLevel(state)
    if (tier === 'no_experience' && isDegreeOrAbove(edu)) {
      return 'work_in_education'
    }
    if (tier === 'no_experience') {
      return 'start_new_career'
    }
    return 'first_job'
  }

  if (selected === 'unemployed') {
    const priority = String(answers(state).cb_career_direction_priority ?? '')
    if (priority === 'education_field') return 'work_in_education'
    if (priority === 'experience_field') return 'work_in_experience'
    const tier = getExperienceTierLocal(state)
    if (tier === 'no_experience') {
      const edu = getFirstJobEducationLevel(state)
      if (isDegreeOrAbove(edu)) return 'work_in_education'
      return 'start_new_career'
    }
    if (tier === 'have_experience' || tier === 'some_experience' || tier === 'experienced') {
      return 'work_in_experience'
    }
    return 'unemployed'
  }

  return selected as RoutingGoal
}

/** Goal used for decision-tree routing (preserves legacy first_job / unemployed flows). */
export function getRoutingGoal(state: CareerBrainState): RoutingGoal | null {
  const selected = getSelectedUserGoal(state)
  if (!selected || selected === 'new_to_uk') return null
  if (selected === 'career_change') return 'start_new_career'
  return selected as RoutingGoal
}

/** @deprecated Prefer getRoutingGoal for tree logic; getSelectedUserGoal for display. */
export function getUserGoal(state: CareerBrainState): UserGoal | null {
  return getRoutingGoal(state) ?? getSelectedUserGoal(state)
}

function getExperienceTierLocal(state: CareerBrainState): string | null {
  const v = answers(state).cb_experience_level
  if (!v) return null
  const s = String(v)
  if (s === 'some_experience' || s === 'small_basic' || s === 'experienced') return 'have_experience'
  return s
}

/** Map goal + follow-ups to legacy EntrySituation for tested recommendation branches. */
export function resolveLegacySituation(state: CareerBrainState): LegacySituation | null {
  if (isNewToUkGoalSelected(state) || isNewToUkContext(state)) {
    return 'new_to_uk'
  }

  const goal = resolveStrategicGoal(state) ?? getRoutingGoal(state) ?? getSelectedUserGoal(state)
  if (!goal) {
    const legacy = answers(state).cb_entry_situation
    return legacy ? (String(legacy) as LegacySituation) : null
  }

  switch (goal) {
    case 'work_in_education':
      return 'graduate_little_exp'
    case 'work_in_profession':
      return 'experienced_professional'
    case 'work_in_experience':
      return 'experienced_professional'
    case 'start_new_career':
      return 'career_change'
    case 'first_job': {
      const legacy = String(answers(state).cb_entry_situation ?? '')
      if (legacy === 'graduate_little_exp' && !answers(state).cb_first_job_education_level) {
        return 'graduate_little_exp'
      }
      const tier = getExperienceTierLocal(state)
      const edu = getFirstJobEducationLevel(state)
      if (tier === 'no_experience' && isDegreeOrAbove(edu)) {
        return 'graduate_little_exp'
      }
      return 'first_job'
    }
    case 'unemployed':
      return 'unemployed_urgent'
    case 'have_experience':
      return isNewToUkContext(state) ? 'new_to_uk' : 'experienced_professional'
    case 'side_job': {
      const profile = String(answers(state).cb_side_job_profile ?? '')
      if (profile === 'student') return 'student_part_time'
      if (profile === 'employed_full' || profile === 'employed_part') return 'side_income'
      if (profile === 'self_employed') return 'self_employed'
      const legacy = String(answers(state).cb_entry_situation ?? '')
      if (legacy === 'student_part_time') return 'student_part_time'
      if (legacy === 'side_income') return 'side_income'
      return 'side_income'
    }
    case 'urgent_work':
      return 'unemployed_urgent'
    case 'start_business':
      return 'small_business'
    case 'career_change':
      return 'career_change'
    case 'grow_career':
      return 'experienced_professional'
    case 'self_employed':
      return 'self_employed'
    case 'small_business':
      return 'small_business'
    case 'exploring':
      return 'exploring'
    default:
      return null
  }
}

/** Keep cb_entry_situation in sync for downstream modules and saved state. */
export function syncLegacySituationAnswer(state: CareerBrainState): CareerBrainState {
  let next = syncNewToUkContext(state)
  if (isNewToUkGoalSelected(next)) {
    next = syncUkTransitionProfileAnswers(next)
  }
  next = syncUnemployedPathAnswers(next)
  const resolved = resolveLegacySituation(next)
  if (!resolved) return next
  return {
    ...next,
    answers: {
      ...next.answers,
      cb_entry_situation: resolved,
    },
  }
}

export function isSideJobStudent(state: CareerBrainState): boolean {
  return getRoutingGoal(state) === 'side_job' && answers(state).cb_side_job_profile === 'student'
}

export function isSideJobEmployed(state: CareerBrainState): boolean {
  const p = String(answers(state).cb_side_job_profile ?? '')
  return getRoutingGoal(state) === 'side_job' && (p === 'employed_full' || p === 'employed_part')
}

export { isNewToUkGoalSelected }
