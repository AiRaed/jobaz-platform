/**
 * Phased Career Brain questions:
 *   1. Background discovery (education, experience, field intent)
 *   2. Domain specialist follow-ups
 *   3. General employability (only if no education + no experience)
 */

import {
  isBackgroundDiscoveryComplete,
  pickBackgroundQuestion,
} from './backgroundDiscovery'
import { isFieldFirstMode, SPECIALIST_DOMAINS } from './domains'
import type { CareerBrainQuestion, CareerDomain, CareerProfile, CareerBrainState } from './types'

export { isBackgroundDiscoveryComplete, pickBackgroundQuestion } from './backgroundDiscovery'
export { isCreativeDomain } from './domainQuestions'

import {
  applyDiscoveryAnswer,
  pickNextDiscoveryQuestion,
  shouldFinalizeDiscovery,
} from './discoveryEngine'

type QuestionDef = {
  id: string
  when: (profile: CareerProfile, asked: Set<string>) => boolean
  question: CareerBrainQuestion
}

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
    allow_free_text: true,
  }
}

const PHASE3_QUESTION_IDS = new Set([
  'cb_english',
  'cb_transport',
  'cb_entry_preference',
  'cb_strengths',
  'cb_customer_comfort',
  'cb_urgency',
])

/** Phase 3 — only when user has no education AND no experience. */
const PHASE3_QUESTION_BANK: QuestionDef[] = [
  {
    id: 'cb_english',
    when: (p, a) => !a.has('cb_english') && !p.englishLevel,
    question: q('cb_english', 'How confident is your English for UK work?', [
      { value: 'basic', label: 'Basic — simple tasks only' },
      { value: 'functional', label: 'I can follow instructions at work' },
      { value: 'comfortable', label: 'Comfortable in most situations' },
      { value: 'fluent', label: 'Fluent' },
    ]),
  },
  {
    id: 'cb_customer_comfort',
    when: (p, a) => !a.has('cb_customer_comfort'),
    question: q('cb_customer_comfort', 'Are you comfortable with customer-facing work?', [
      { value: 'yes', label: 'Yes' },
      { value: 'sometimes', label: 'Sometimes / depends' },
      { value: 'no', label: 'Prefer not customer-facing' },
    ]),
  },
  {
    id: 'cb_entry_preference',
    when: (p, a) => !a.has('cb_entry_preference'),
    question: q('cb_entry_preference', 'What type of work would you prefer to start with?', [
      { value: 'retail', label: 'Shop / retail' },
      { value: 'warehouse', label: 'Warehouse / practical' },
      { value: 'hospitality', label: 'Kitchen / hospitality' },
      { value: 'office', label: 'Office / admin support' },
      { value: 'unsure', label: 'Not sure — open to anything' },
    ]),
  },
  {
    id: 'cb_transport',
    when: (p, a) => !a.has('cb_transport'),
    question: q('cb_transport', 'What transport do you have for work?', [
      { value: 'no_licence', label: 'No driving licence' },
      { value: 'licence_no_car', label: 'Licence but no car' },
      { value: 'car', label: 'Car' },
      { value: 'public', label: 'Public transport only' },
    ]),
  },
  {
    id: 'cb_urgency',
    when: (p, a) => !a.has('cb_urgency') && p.urgencyLevel === 'low',
    question: q('cb_urgency', 'How urgent is it for you to find work?', [
      { value: 'urgent', label: 'I need income urgently — any job' },
      { value: 'soon', label: 'Within a few weeks' },
      { value: 'flexible', label: 'I can take time to find the right fit' },
    ]),
  },
]

const CHANGE_QUESTION_BANK: QuestionDef[] = [
  {
    id: 'cb_change_reason',
    when: (p, a) => !a.has('cb_change_reason') && p.wantsCareerChange === true,
    question: q('cb_change_reason', 'Why do you want to change career direction?', [
      { value: 'income', label: 'Better income' },
      { value: 'stress', label: 'Less stress / burnout' },
      { value: 'interest', label: 'New interest' },
      { value: 'opportunity', label: 'More UK opportunities' },
    ]),
  },
  {
    id: 'cb_change_target',
    when: (p, a) => !a.has('cb_change_target') && p.wantsCareerChange === true,
    question: q('cb_change_target', 'Which new field interests you most?', [
      { value: 'tech', label: 'Technology / digital' },
      { value: 'creative', label: 'Creative / media' },
      { value: 'care', label: 'Care / healthcare' },
      { value: 'business', label: 'Business / admin' },
      { value: 'unsure', label: 'Not sure yet' },
    ]),
  },
]

const EMPLOYABILITY_TAIL_BANK: QuestionDef[] = [
  {
    id: 'cb_english',
    when: (p, a) => !a.has('cb_english') && !p.englishLevel && p.domain !== 'no_experience_general',
    question: q('cb_english', 'How confident is your English for UK work?', [
      { value: 'basic', label: 'Basic' },
      { value: 'functional', label: 'Functional at work' },
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'fluent', label: 'Fluent' },
    ]),
  },
  {
    id: 'cb_urgency',
    when: (p, a) => !a.has('cb_urgency') && p.urgencyLevel === 'low',
    question: q('cb_urgency', 'How urgent is it for you to find work?', [
      { value: 'urgent', label: 'I need income urgently' },
      { value: 'soon', label: 'Within a few weeks' },
      { value: 'flexible', label: 'Flexible timing' },
    ]),
  },
]

function pickFromBank(
  bank: QuestionDef[],
  profile: CareerProfile,
  asked: Set<string>
): { question: CareerBrainQuestion | null; reason: string } {
  for (const def of bank) {
    if (def.when(profile, asked)) {
      return { question: def.question, reason: `Phase question ${def.id} (${profile.domain})` }
    }
  }
  return { question: null, reason: 'No match in bank' }
}

export function isNoBackgroundProfile(state: CareerBrainState, _profile?: CareerProfile): boolean {
  const edu = state.answers?.cb_edu ?? state.classification?.edu
  const exp = state.answers?.cb_exp ?? state.classification?.exp
  return edu === 'no' && exp === 'no'
}

export function pickNextAdaptiveQuestion(
  profile: CareerProfile,
  askedIds: string[],
  state?: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!state) {
    return { question: null, reason: 'No state' }
  }
  const result = pickNextDiscoveryQuestion(profile, askedIds, state)
  return { question: result.question, reason: result.reason }
}

export function applyAnswerToProfile(
  profile: CareerProfile,
  questionId: string,
  answer: string | string[]
): CareerProfile {
  const val = Array.isArray(answer) ? answer.join(',') : String(answer)
  const next = { ...profile }

  if (questionId.startsWith('ntuk_')) return next

  switch (questionId) {
    case 'cb_asylum_work_permission':
    case 'cb_new_to_uk_prior_exp':
    case 'cb_new_to_uk_experience_abroad':
    case 'cb_new_to_uk':
    case 'cb_international_experience':
      break
    case 'cb_user_goal':
    case 'cb_field_income_strategy':
    case 'cb_entry_situation':
    case 'cb_experience_level':
    case 'cb_field_alignment':
    case 'cb_experience_field_relation':
    case 'cb_work_experience_field':
    case 'cb_experience_country':
    case 'cb_career_direction_priority':
    case 'cb_graduate_study_field':
    case 'cb_graduate_field_intent':
    case 'cb_graduate_creative_openness':
    case 'cb_graduate_it_stack':
    case 'cb_graduate_it_projects':
    case 'cb_graduate_it_routes':
    case 'cb_graduate_qual_region':
    case 'cb_graduate_uk_work_exp':
    case 'cb_graduate_finance_routes':
    case 'cb_graduate_role_target':
    case 'cb_graduate_urgency':
    case 'cb_student_study_field':
    case 'cb_student_work_intent':
    case 'cb_student_experience_type':
    case 'cb_student_continue_experience':
    case 'cb_student_prior_work':
    case 'cb_student_work_style':
    case 'cb_student_availability':
    case 'cb_student_creative_roles':
    case 'cb_student_it_routes':
    case 'cb_student_office_interest':
    case 'cb_student_care_confidence':
    case 'cb_student_travel_distance':
    case 'cb_student_lifting_ok':
    case 'cb_student_general_interest':
    case 'cb_uk_driving_licence':
    case 'cb_has_car':
    case 'cb_uk_driving_licence':
    case 'cb_has_car':
    case 'cb_training_willingness':
    case 'cb_entry_work_preference':
    case 'cb_basic_experience_text':
    case 'cb_continue_in_field':
    case 'cb_discovery_work_setting':
    case 'cb_discovery_social':
    case 'cb_discovery_income_goal':
    case 'cb_professional_field':
    case 'cb_professional_experience':
    case 'cb_professional_field_intent':
      break
    case 'cb_edu':
      next.educationLevel = val === 'no' ? 'none' : val === 'yes' ? 'college' : next.educationLevel
      if (val === 'no') next.studyField = null
      break
    case 'cb_study_field':
      next.studyField = val.trim()
      next.educationLevel = next.educationLevel ?? 'college'
      break
    case 'cb_exp':
      if (val === 'no') {
        next.workExperienceField = null
        next.yearsOfExperience = 0
      }
      break
    case 'cb_work_experience':
      next.workExperienceField = val.trim()
      next.yearsOfExperience = next.yearsOfExperience ?? 1
      break
    case 'cb_field_intent':
      if (val.includes('same_field')) {
        next.wantsSameField = true
        next.wantsCareerChange = false
      } else if (val.includes('related_field')) {
        next.wantsSameField = true
        next.wantsCareerChange = false
      } else if (val.includes('change_field')) {
        next.wantsCareerChange = true
        next.wantsSameField = false
      } else if (val.includes('unsure')) {
        next.wantsSameField = null
        next.wantsCareerChange = null
      }
      break
    case 'cb_english':
      next.englishLevel = val
      break
    case 'cb_location':
    case 'cb_creative_uk_location':
      next.ukLocation = val
      break
    case 'cb_work_speed':
      if (val.includes('urgent')) next.urgencyLevel = 'high'
      else if (val.includes('within_1_2')) next.urgencyLevel = 'medium'
      else if (val.includes('invest_time')) next.urgencyLevel = 'low'
      break
    case 'cb_cert_openness':
      if (val === 'yes') next.constraints = [...new Set([...next.constraints, 'open-to-certifications'])]
      else if (val === 'no' || val.includes('direct')) {
        next.constraints = [...new Set([...next.constraints, 'prefer-direct-work', 'direct-employment-focus'])]
      }
      break
    case 'cb_urgency':
      if (val.includes('urgent')) next.urgencyLevel = 'high'
      else if (val.includes('soon')) next.urgencyLevel = 'medium'
      break
    case 'cb_creative_portfolio':
      next.hasPortfolio = val.includes('yes') ? true : val.includes('no') ? false : null
      break
    case 'cb_animation_tools':
      next.toolsAndSkills = [...new Set([...next.toolsAndSkills, ...val.split(',').filter(Boolean)])]
      break
    case 'cb_creative_target_roles':
      next.targetField = val
      break
    case 'cb_change_target_field':
      next.targetField = val.trim()
      next.wantsCareerChange = true
      break
    case 'cb_change_reason':
    case 'cb_change_target':
      if (questionId === 'cb_change_target') next.targetField = val
      next.wantsCareerChange = true
      break
    case 'cb_office_customer_comfort':
    case 'cb_customer_comfort':
      if (val === 'no') {
        next.constraints = [...new Set([...next.constraints, 'no-customer-facing'])]
      }
      break
    case 'cb_office_computer_level':
    case 'cb_office_training':
    case 'cb_office_role_preference':
    case 'cb_driving_licence':
    case 'cb_physical_ability':
    case 'cb_shift_flexibility':
      break
    case 'currentJobTitle':
    case 'jaz_job_title': {
      const title = val.trim()
      if (title) {
        next.workExperienceField = title
        next.detectedRoles = [...new Set([...next.detectedRoles, title])]
      }
      break
    }
    case 'coreSkills':
    case 'jaz_strengths':
      break
    default:
      break
  }

  const merged = applyDiscoveryAnswer(next, questionId, answer)
  merged.confidence = Math.min(1, merged.confidence + 0.08)
  return merged
}

export function getAnsweredCareerBrainQuestionIds(state: {
  answers?: Record<string, unknown>
  career_brain_asked?: string[]
}): string[] {
  const fromAnswers = Object.keys(state.answers ?? {}).filter(
    (k) =>
      k.startsWith('cb_') ||
      k.startsWith('jaz_') ||
      k === 'edu' ||
      k === 'exp' ||
      k === 'currentJobTitle' ||
      k === 'coreSkills'
  )
  const fromAsked = state.career_brain_asked ?? []
  return [...new Set([...fromAnswers, ...fromAsked])]
}

export function shouldFinalizeProfile(
  profile: CareerProfile,
  askedIds: string[],
  state?: CareerBrainState
): { finalize: boolean; reason: string } {
  if (!state) {
    return { finalize: false, reason: 'No state' }
  }
  return shouldFinalizeDiscovery(profile, askedIds, state)
}
