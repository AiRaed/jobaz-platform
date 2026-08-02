/**
 * Student part-time path — experience-first when applicable, then education + hybrid routing.
 */

import {
  isBridgeDiscoveryComplete,
  pickBridgeDiscoveryQuestion,
  wantsBridgeRoleDiscovery,
} from './bridgeRoleIntelligence'
import { wantsDualPathMode } from './dualPathMode'
import { wantsFlexibleEmploymentMode } from './flexibleEmploymentMode'
import {
  FIELD_ALIGNMENT_QUESTION,
  getFieldAlignment,
  hasFieldAlignmentAnswer,
  isFieldAlignmentBoth,
  isFieldAlignmentNo,
  isFieldAlignmentYes,
} from './fieldAlignment'
import {
  buildStudentExperienceSignals,
  getStudentExperienceRaw,
  inferExperienceCategory,
  studentHasSomeExperience,
} from './studentExperience'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'

export type StudentStudyDomain =
  | 'creative'
  | 'it'
  | 'business'
  | 'healthcare'
  | 'construction'
  | 'media'
  | 'general'

export type StudentContextualTrack =
  | 'creative'
  | 'it'
  | 'office'
  | 'care'
  | 'delivery'
  | 'physical'
  | 'retail'
  | 'general'

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

export const STUDENT_QUESTIONS = {
  experience: q('cb_experience_level', 'Do you have work experience?', [
    { value: 'no_experience', label: 'No experience' },
    { value: 'have_experience', label: 'Have experience' },
  ]),
  studyField: qFreeText(
    'cb_student_study_field',
    'What are you currently studying?',
    'Animation, Business, Computing, Healthcare, Construction, English, Media'
  ),
  fieldAlignment: FIELD_ALIGNMENT_QUESTION,
  experienceDiscovery: q(
    'cb_student_experience_type',
    'What kind of work experience do you have?',
    [
      { value: 'retail', label: 'Retail' },
      { value: 'hospitality', label: 'Hospitality' },
      { value: 'customer_service', label: 'Customer service' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'office_admin', label: 'Office / Admin' },
      { value: 'social_media', label: 'Social media' },
      { value: 'design', label: 'Design / creative' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'care', label: 'Care work' },
      { value: 'it_technology', label: 'IT / Technology' },
      { value: 'other', label: 'Other' },
    ],
    true,
    3
  ),
  experienceIntent: q(
    'cb_student_continue_experience',
    'Would you like to continue in this type of work?',
    [
      { value: 'yes_continue', label: 'Yes' },
      { value: 'maybe_partly', label: 'Maybe / partly' },
      { value: 'no_different', label: 'No, I want something different' },
    ]
  ),
  priorWork: qFreeText(
    'cb_student_prior_work',
    'Anything else about your work experience? (optional)',
    'shop assistant at Tesco, barista, campus ambassador'
  ),
  workStyle: q(
    'cb_student_work_style',
    'What type of part-time work are you most comfortable with?',
    [
      { value: 'people', label: 'Working with people' },
      { value: 'physical', label: 'Physical / active work' },
      { value: 'office', label: 'Office / computer work' },
      { value: 'quick_income', label: 'Flexible quick-income jobs' },
      { value: 'creative_digital', label: 'Creative / digital work' },
      { value: 'any', label: 'Any type of work' },
    ]
  ),
  availability: q('cb_student_availability', 'When are you mostly available to work?', [
    { value: 'evenings', label: 'Evenings' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'flexible', label: 'Flexible schedule' },
    { value: 'limited', label: 'Limited hours only' },
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

export function getStudentStudyField(state: CareerBrainState): string {
  return String(answers(state).cb_student_study_field ?? '').trim()
}

/** @deprecated use getFieldAlignment */
export function getStudentWorkIntent(state: CareerBrainState): string {
  const a = getFieldAlignment(state)
  if (a === 'yes') return 'related_studies'
  if (a === 'no') return 'any_job'
  if (a === 'both') return 'open_both'
  return String(answers(state).cb_student_work_intent ?? '')
}

export function studentNeedsWorkStyle(state: CareerBrainState): boolean {
  return isFieldAlignmentBoth(state) || isFieldAlignmentNo(state)
}

function studentProfileStub(state: CareerBrainState): CareerProfile {
  return {
    educationLevel: 'college',
    studyField: getStudentStudyField(state) || null,
    workExperienceField: getStudentExperienceRaw(state) || null,
    targetField: String(state.answers?.cb_student_work_style ?? '') || null,
    yearsOfExperience: studentHasSomeExperience(state) ? 1 : 0,
    experienceCountry: null,
    toolsAndSkills: [],
    hasPortfolio: null,
    certificates: [],
    licences: [],
    englishLevel: state.answers?.cb_english ? String(state.answers.cb_english) : null,
    ukLocation: null,
    urgencyLevel: 'low',
    wantsSameField: isFieldAlignmentYes(state)
      ? true
      : isFieldAlignmentNo(state)
        ? false
        : null,
    wantsCareerChange: null,
    domain: 'no_experience_general',
    domainConfidence: 0,
    detectedRoles: [],
    transferableSkills: [],
    constraints: ['student', 'part-time'],
    confidence: 0.3,
  }
}

export function studentWantsFlexibleEmployment(state: CareerBrainState): boolean {
  return wantsFlexibleEmploymentMode(studentProfileStub(state), state)
}

export function studentWantsDualPath(state: CareerBrainState): boolean {
  if (studentWantsFlexibleEmployment(state)) return false
  return wantsDualPathMode(studentProfileStub(state), state)
}

export function studentWantsBridgeDiscovery(state: CareerBrainState): boolean {
  if (studentWantsDualPath(state) || studentWantsFlexibleEmployment(state)) return false
  return wantsBridgeRoleDiscovery(studentProfileStub(state), state)
}

export function inferStudentStudyDomain(studyField: string): StudentStudyDomain {
  const t = studyField.toLowerCase()
  if (/animat|motion|video|3d|graphic|design|art\b|creative/.test(t)) return 'creative'
  if (/comput|software|it\b|tech|programming|cyber|data science|web/.test(t)) return 'it'
  if (/business|account|finance|economics|marketing|management/.test(t)) return 'business'
  if (/health|nurse|care|medical|midwif|pharmacy/.test(t)) return 'healthcare'
  if (/construct|building|trade|plumb|electric/.test(t)) return 'construction'
  if (/media|journal|film|broadcast|communication/.test(t)) return 'media'
  return 'general'
}

/** Hybrid routing: studies + experience + intents combined. */
export function detectStudentContextualTrack(state: CareerBrainState): StudentContextualTrack {
  const study = getStudentStudyField(state)
  const studyDomain = inferStudentStudyDomain(study)
  const studyIntent = getStudentWorkIntent(state)
  const style = String(answers(state).cb_student_work_style ?? '')
  const exp = buildStudentExperienceSignals(state)
  const expCat = exp.experienceCategory

  if (studentHasSomeExperience(state)) {
    if (studyDomain === 'creative' && expCat === 'retail') {
      if (exp.wantsDifferentDirection || studyIntent.includes('related')) return 'creative'
      if (exp.wantsContinueExperience) return 'retail'
    }
    if (studyDomain === 'creative' && (expCat === 'design' || expCat === 'social_media')) {
      return 'creative'
    }
    if (studyDomain === 'business') {
      if (exp.wantsDifferentDirection) return 'office'
      if (exp.wantsContinueExperience && /retail|customer|hospitality/.test(expCat)) {
        return 'retail'
      }
    }
    if (studyDomain === 'media' && expCat === 'hospitality') return 'creative'
    if (expCat === 'it_technology' || (studyDomain === 'it' && expCat === 'customer_service')) {
      return 'it'
    }
    if (expCat === 'delivery' || expCat === 'warehouse') return 'delivery'
    if (expCat === 'office_admin') return 'office'
    if (expCat === 'care') return 'care'
    if (exp.wantsContinueExperience && expCat === 'retail') return 'retail'
    if (exp.wantsContinueExperience && expCat === 'hospitality') return 'retail'
  }

  if (style === 'quick_income' || style === 'physical') return 'delivery'
  if (style === 'people' && studyDomain !== 'healthcare') return 'retail'
  if (style === 'office') return 'office'
  if (style === 'creative_digital' || studyDomain === 'creative' || studyDomain === 'media') {
    if (studyIntent.includes('related') || style === 'creative_digital') return 'creative'
  }
  if (studyDomain === 'it' && (studyIntent.includes('related') || studyIntent.includes('open'))) {
    return 'it'
  }
  if (studyDomain === 'business' && studyIntent.includes('related')) return 'office'
  if (studyDomain === 'healthcare' && studyIntent.includes('related')) return 'care'
  if (studyDomain === 'construction') return 'physical'
  if (studyIntent.includes('any_job') && !style) return 'retail'
  if (studyIntent.includes('related')) {
    if (studyDomain === 'creative' || studyDomain === 'media') return 'creative'
    if (studyDomain === 'it') return 'it'
    if (studyDomain === 'healthcare') return 'care'
    if (studyDomain === 'business') return 'office'
  }
  return 'general'
}

export { buildStudentExperienceSignals, inferExperienceCategory, studentHasSomeExperience } from './studentExperience'

const CONTEXTUAL_IDS: Record<StudentContextualTrack, string[]> = {
  creative: ['cb_creative_portfolio', 'cb_animation_tools', 'cb_student_creative_roles'],
  it: ['cb_graduate_it_stack', 'cb_graduate_it_projects', 'cb_student_it_routes'],
  office: ['cb_office_computer_level', 'cb_student_office_interest'],
  care: ['cb_customer_comfort', 'cb_student_care_confidence'],
  delivery: ['cb_uk_driving_licence', 'cb_has_car', 'cb_student_travel_distance'],
  physical: ['cb_physical_ability', 'cb_student_lifting_ok'],
  retail: ['cb_customer_comfort', 'cb_english'],
  general: ['cb_english', 'cb_student_general_interest'],
}

function pickContextualQuestion(state: CareerBrainState): CareerBrainQuestion | null {
  const track = detectStudentContextualTrack(state)
  const ids = CONTEXTUAL_IDS[track]

  const map: Record<string, CareerBrainQuestion> = {
    cb_creative_portfolio: q('cb_creative_portfolio', 'Do you have a portfolio or showreel?', [
      { value: 'yes_strong', label: 'Yes — portfolio / showreel' },
      { value: 'yes_basic', label: 'Yes — student projects' },
      { value: 'building', label: 'Building one now' },
      { value: 'no', label: 'Not yet' },
    ]),
    cb_animation_tools: q(
      'cb_animation_tools',
      'What creative or editing tools do you use?',
      [
        { value: 'after_effects', label: 'After Effects' },
        { value: 'premiere', label: 'Premiere Pro' },
        { value: 'photoshop', label: 'Photoshop / Illustrator' },
        { value: 'blender', label: 'Blender' },
        { value: 'figma', label: 'Figma' },
      ],
      true,
      4
    ),
    cb_student_creative_roles: q(
      'cb_student_creative_roles',
      'Which part-time creative roles interest you?',
      [
        { value: 'video_edit', label: 'Video editing' },
        { value: 'social_media', label: 'Social media content' },
        { value: 'motion', label: 'Motion graphics' },
        { value: 'studio_assist', label: 'Studio / production assistant' },
        { value: 'open', label: 'Open to any creative part-time work' },
      ],
      true,
      2
    ),
    cb_graduate_it_stack: qFreeText(
      'cb_graduate_it_stack',
      'What technologies or programming languages do you know?',
      'Python, JavaScript, HTML, SQL'
    ),
    cb_graduate_it_projects: q('cb_graduate_it_projects', 'Do you have projects or a GitHub portfolio?', [
      { value: 'yes_github', label: 'Yes — GitHub / projects' },
      { value: 'yes_basic', label: 'Yes — coursework only' },
      { value: 'building', label: 'Building now' },
      { value: 'no', label: 'Not yet' },
    ]),
    cb_student_it_routes: q(
      'cb_student_it_routes',
      'Are you open to tech support, QA, or digital support part-time roles?',
      [
        { value: 'support', label: 'IT support / helpdesk' },
        { value: 'qa', label: 'QA / testing' },
        { value: 'digital_support', label: 'Digital support' },
        { value: 'open', label: 'Open to any tech part-time role' },
      ],
      true,
      2
    ),
    cb_office_computer_level: q(
      'cb_office_computer_level',
      'How confident are you using computers, email, and documents?',
      [
        { value: 'basic', label: 'Basic' },
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'strong', label: 'Strong' },
      ]
    ),
    cb_student_office_interest: q(
      'cb_student_office_interest',
      'Are you interested in admin, reception, or office support part-time work?',
      [
        { value: 'admin', label: 'Admin / assistant' },
        { value: 'reception', label: 'Reception' },
        { value: 'data_entry', label: 'Data entry' },
        { value: 'open', label: 'Open to any office part-time role' },
      ]
    ),
    cb_customer_comfort: q('cb_customer_comfort', 'Are you comfortable dealing with customers?', [
      { value: 'yes', label: 'Yes' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'no', label: 'Prefer not customer-facing' },
    ]),
    cb_student_care_confidence: q(
      'cb_student_care_confidence',
      'Are you comfortable with care or support work (communication, empathy)?',
      [
        { value: 'yes', label: 'Yes' },
        { value: 'with_training', label: 'Yes with training' },
        { value: 'no', label: 'Prefer other work' },
      ]
    ),
    cb_uk_driving_licence: q('cb_uk_driving_licence', 'Do you have a UK driving licence?', [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]),
    cb_has_car: q('cb_has_car', 'Do you have access to a car for work?', [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]),
    cb_student_travel_distance: q('cb_student_travel_distance', 'How far can you travel for work?', [
      { value: 'local', label: 'Local area only' },
      { value: 'city', label: 'Across my city' },
      { value: 'far', label: 'Happy to travel further' },
    ]),
    cb_physical_ability: q(
      'cb_physical_ability',
      'Are you comfortable with physical work (standing, lifting)?',
      [
        { value: 'yes', label: 'Yes' },
        { value: 'light_only', label: 'Light physical only' },
        { value: 'no', label: 'Prefer non-physical' },
      ]
    ),
    cb_student_lifting_ok: q('cb_student_lifting_ok', 'Are you comfortable lifting or carrying loads?', [
      { value: 'yes', label: 'Yes' },
      { value: 'light', label: 'Light loads only' },
      { value: 'no', label: 'No' },
    ]),
    cb_english: q('cb_english', 'How confident is your English for UK work?', [
      { value: 'basic', label: 'Basic' },
      { value: 'functional', label: 'Functional at work' },
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'fluent', label: 'Fluent' },
    ]),
    cb_student_general_interest: q(
      'cb_student_general_interest',
      'What part-time work would you most like to try first?',
      [
        { value: 'retail', label: 'Shop / retail' },
        { value: 'hospitality', label: 'Café / hospitality' },
        { value: 'tutoring', label: 'Tutoring / campus work' },
        { value: 'open', label: 'Open to anything part-time' },
      ]
    ),
  }

  for (const id of ids) {
    if (!hasAnswer(state, id)) return map[id] ?? null
  }
  return null
}

export function isStudentContextualComplete(state: CareerBrainState): boolean {
  const stub = studentProfileStub(state)
  if (studentWantsBridgeDiscovery(state)) {
    return isBridgeDiscoveryComplete(stub, state)
  }
  if (studentWantsDualPath(state) || studentWantsFlexibleEmployment(state)) {
    return true
  }
  const track = detectStudentContextualTrack(state)
  return CONTEXTUAL_IDS[track].every((id) => hasAnswer(state, id))
}

function hasExperienceDiscovery(state: CareerBrainState): boolean {
  const type = answers(state).cb_student_experience_type
  const prior = answers(state).cb_student_prior_work
  if (Array.isArray(type) && type.length > 0) return true
  if (typeof type === 'string' && type.trim()) return true
  if (prior && String(prior).trim()) return true
  return false
}

export function isStudentEntryComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_experience_level')) return false

  if (studentHasSomeExperience(state)) {
    if (!hasExperienceDiscovery(state)) return false
    if (!hasAnswer(state, 'cb_student_continue_experience')) return false
  }

  if (!hasAnswer(state, 'cb_student_study_field')) return false
  if (!hasFieldAlignmentAnswer(state)) return false

  if (studentNeedsWorkStyle(state) && !hasAnswer(state, 'cb_student_work_style')) {
    return false
  }

  if (!hasAnswer(state, 'cb_student_availability')) return false

  return isStudentContextualComplete(state)
}

export function pickStudentEntryQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_experience_level')) {
    return {
      question: STUDENT_QUESTIONS.experience,
      reason: 'Student path — experience (no / some)',
    }
  }

  if (studentHasSomeExperience(state)) {
    if (!hasExperienceDiscovery(state)) {
      return {
        question: STUDENT_QUESTIONS.experienceDiscovery,
        reason: 'Student path — experience discovery (before education)',
      }
    }
    if (!hasAnswer(state, 'cb_student_continue_experience')) {
      return {
        question: STUDENT_QUESTIONS.experienceIntent,
        reason: 'Student path — continue in this type of work?',
      }
    }
    if (
      hasExperienceDiscovery(state) &&
      !hasAnswer(state, 'cb_student_prior_work') &&
      inferExperienceCategory(getStudentExperienceRaw(state)) === 'other'
    ) {
      return {
        question: STUDENT_QUESTIONS.priorWork,
        reason: 'Student path — experience detail (other)',
      }
    }
  }

  if (!hasAnswer(state, 'cb_student_study_field')) {
    return {
      question: STUDENT_QUESTIONS.studyField,
      reason: 'Student path — education context (after experience understood)',
    }
  }

  if (!hasFieldAlignmentAnswer(state)) {
    return {
      question: STUDENT_QUESTIONS.fieldAlignment,
      reason: 'Student path — work in this field?',
    }
  }

  const stub = studentProfileStub(state)
  if (studentWantsBridgeDiscovery(state)) {
    const bridgeQ = pickBridgeDiscoveryQuestion(stub, state)
    if (bridgeQ.question) {
      return {
        question: bridgeQ.question,
        reason: bridgeQ.reason,
      }
    }
  }

  if (studentNeedsWorkStyle(state) && !hasAnswer(state, 'cb_student_work_style')) {
    return {
      question: STUDENT_QUESTIONS.workStyle,
      reason: 'Student path — work style preference',
    }
  }

  if (!hasAnswer(state, 'cb_student_availability')) {
    return {
      question: STUDENT_QUESTIONS.availability,
      reason: 'Student path — availability',
    }
  }

  if (
    !studentWantsBridgeDiscovery(state) &&
    !studentWantsDualPath(state) &&
    !studentWantsFlexibleEmployment(state)
  ) {
    const contextual = pickContextualQuestion(state)
    if (contextual) {
      return {
        question: contextual,
        reason: `Student path — contextual (${detectStudentContextualTrack(state)})`,
      }
    }
  } else if (
    (studentWantsBridgeDiscovery(state) ||
      studentWantsDualPath(state) ||
      studentWantsFlexibleEmployment(state)) &&
    !hasAnswer(state, 'cb_english')
  ) {
    return {
      question: q('cb_english', 'How confident is your English for UK work?', [
        { value: 'basic', label: 'Basic' },
        { value: 'functional', label: 'Functional at work' },
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'fluent', label: 'Fluent' },
      ]),
      reason: 'Student bridge path — English confidence',
    }
  }

  return { question: null, reason: 'Student path complete' }
}
