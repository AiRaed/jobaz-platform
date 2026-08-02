/**
 * Graduate entry path — qualification-first discovery (not generic no-experience).
 */

import {
  isBridgeDiscoveryComplete,
  pickBridgeDiscoveryQuestion,
  wantsBridgeRoleDiscovery,
} from './bridgeRoleIntelligence'
import {
  FIELD_ALIGNMENT_QUESTION,
  getFieldAlignment,
  hasFieldAlignmentAnswer,
  isFieldAlignmentBoth,
  isFieldAlignmentNo,
  isFieldAlignmentYes,
} from './fieldAlignment'
import { pickFieldSpecialisationQuestion, resolveEffectiveStudyField } from './fieldSpecialisation'
import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'

export type GraduateDomain = 'creative' | 'it' | 'finance' | 'general'

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

export const GRADUATE_QUESTIONS = {
  studyField: qFreeText(
    'cb_graduate_study_field',
    'What did you study or qualify in?',
    'animation, computer science, accounting, graphic design, nursing'
  ),
  fieldAlignment: FIELD_ALIGNMENT_QUESTION,
  creativeOpenness: q(
    'cb_graduate_creative_openness',
    'Are you open to internships, junior roles, freelance, or studio assistant roles?',
    [
      { value: 'internship', label: 'Internships / placements' },
      { value: 'junior', label: 'Junior roles' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'studio_assistant', label: 'Studio assistant' },
      { value: 'any_first', label: 'Any of these to get started' },
    ],
    true,
    3
  ),
  itStack: qFreeText(
    'cb_graduate_it_stack',
    'What technologies or programming languages do you know?',
    'JavaScript, Python, React, SQL, HTML/CSS'
  ),
  itProjects: q('cb_graduate_it_projects', 'Do you have projects or a GitHub portfolio?', [
    { value: 'yes_github', label: 'Yes — GitHub / live projects' },
    { value: 'yes_basic', label: 'Yes — basic coursework projects' },
    { value: 'building', label: 'Building projects now' },
    { value: 'no', label: 'Not yet' },
  ]),
  itRoutes: q(
    'cb_graduate_it_routes',
    'Are you open to IT support, helpdesk, or junior developer routes?',
    [
      { value: 'support', label: 'IT support / helpdesk' },
      { value: 'junior_dev', label: 'Junior developer' },
      { value: 'qa', label: 'QA / testing' },
      { value: 'data', label: 'Data / junior analyst' },
      { value: 'open', label: 'Open to any IT entry route' },
    ],
    true,
    2
  ),
  qualRegion: q(
    'cb_graduate_qual_region',
    'Is your qualification UK-based or from another country?',
    [
      { value: 'uk', label: 'UK qualification' },
      { value: 'foreign', label: 'Foreign qualification' },
      { value: 'both', label: 'Both UK and foreign study' },
    ]
  ),
  ukWorkExp: q('cb_graduate_uk_work_exp', 'Do you have any UK work experience (including placements)?', [
    { value: 'yes', label: 'Yes' },
    { value: 'placement_only', label: 'Placement / internship only' },
    { value: 'no', label: 'No UK work experience yet' },
  ]),
  financeRoutes: q(
    'cb_graduate_finance_routes',
    'Are you open to bookkeeping, finance assistant, admin finance, or an AAT pathway?',
    [
      { value: 'bookkeeping', label: 'Bookkeeping' },
      { value: 'finance_assistant', label: 'Finance assistant' },
      { value: 'admin_finance', label: 'Admin finance' },
      { value: 'aat', label: 'AAT / accounting technician path' },
      { value: 'open', label: 'Open to any finance entry route' },
    ],
    true,
    2
  ),
  roleTarget: qFreeText(
    'cb_graduate_role_target',
    'Which roles or job titles are you targeting as a graduate?',
    'junior designer, graduate developer, accounts assistant'
  ),
  urgency: q('cb_graduate_urgency', 'How urgent is it for you to find work?', [
    { value: 'urgent', label: 'I need income urgently — open to any job' },
    { value: 'soon', label: 'Within a few weeks' },
    { value: 'flexible', label: 'I can focus on the right graduate role' },
  ]),
}

const CREATIVE_DOMAIN_IDS = [
  'cb_creative_portfolio',
  'cb_animation_tools',
  'cb_creative_target_roles',
  'cb_graduate_creative_openness',
] as const

const IT_DOMAIN_IDS = ['cb_graduate_it_stack', 'cb_graduate_it_projects', 'cb_graduate_it_routes'] as const

const FINANCE_DOMAIN_IDS = [
  'cb_graduate_qual_region',
  'cb_graduate_uk_work_exp',
  'cb_graduate_finance_routes',
] as const

const GENERAL_DOMAIN_IDS = ['cb_graduate_role_target'] as const

const GRADUATE_BACKUP_CORE = ['cb_english', 'cb_graduate_urgency'] as const
const GRADUATE_BACKUP_DRIVING = ['cb_uk_driving_licence', 'cb_has_car'] as const

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

export function getGraduateStudyField(state: CareerBrainState): string {
  const raw = String(
    answers(state).cb_graduate_study_field ??
      answers(state).cb_study_field ??
      ''
  ).trim()
  return resolveEffectiveStudyField(state, raw) || raw
}

export function inferGraduateDomain(studyField: string): GraduateDomain {
  const t = studyField.toLowerCase()
  if (/animat|motion|video|3d|graphic|design|creative|media|film|art\b/.test(t)) return 'creative'
  if (
    /computer|software|it\b|tech|developer|programming|data science|cyber|web\b|java|python/.test(
      t
    )
  ) {
    return 'it'
  }
  if (/account|finance|business|economics|bookkeep|aat|banking/.test(t)) return 'finance'
  return 'general'
}

/** @deprecated use getFieldAlignment — returns legacy token for string checks */
export function graduateFieldIntent(state: CareerBrainState): string {
  const a = getFieldAlignment(state)
  if (a === 'yes') return 'same_field'
  if (a === 'no') return 'change_field'
  if (a === 'both') return 'related_field'
  return String(answers(state).cb_graduate_field_intent ?? answers(state).cb_field_intent ?? '')
}

export function graduateWantsSameOrRelated(state: CareerBrainState): boolean {
  return isFieldAlignmentYes(state) || isFieldAlignmentBoth(state)
}

export function graduateWantsChange(state: CareerBrainState): boolean {
  return isFieldAlignmentNo(state)
}

function graduateProfileStub(state: CareerBrainState): CareerProfile {
  const intent = graduateFieldIntent(state)
  return {
    educationLevel: 'degree',
    studyField: getGraduateStudyField(state) || null,
    workExperienceField: null,
    targetField: null,
    yearsOfExperience: 0,
    experienceCountry: null,
    toolsAndSkills: [],
    hasPortfolio: null,
    certificates: [],
    licences: [],
    englishLevel: state.answers?.cb_english ? String(state.answers.cb_english) : null,
    ukLocation: null,
    urgencyLevel:
      String(state.answers?.cb_graduate_urgency ?? '') === 'urgent' ? 'high' : 'low',
    wantsSameField:
      intent.includes('same_field') || intent.includes('related_field') ? true : null,
    wantsCareerChange: intent.includes('change_field') ? true : null,
    domain: 'no_experience_general',
    domainConfidence: 0,
    detectedRoles: [],
    transferableSkills: [],
    constraints: ['graduate'],
    confidence: 0.3,
  }
}

export function graduateWantsBridgeDiscovery(state: CareerBrainState): boolean {
  return wantsBridgeRoleDiscovery(graduateProfileStub(state), state)
}

/** Driving licence only after domain Qs, and only when quick-income / backup needed. */
export function graduateAllowsEarlyDrivingLicence(state: CareerBrainState): boolean {
  const a = answers(state)
  if (a.cb_graduate_urgency === 'urgent') return true
  if (a.cb_urgency === 'urgent') return true
  if (a.cb_entry_work_preference === 'quick_income') return true
  if (a.cb_graduate_quick_income === 'yes') return true
  return false
}

export function isGraduateDomainComplete(state: CareerBrainState): boolean {
  const intent = graduateFieldIntent(state)
  if (!intent || isFieldAlignmentNo(state)) return true
  if (isFieldAlignmentBoth(state)) return hasAnswer(state, 'cb_graduate_role_target')

  const domain = inferGraduateDomain(getGraduateStudyField(state))
  const ids =
    domain === 'creative'
      ? CREATIVE_DOMAIN_IDS
      : domain === 'it'
        ? IT_DOMAIN_IDS
        : domain === 'finance'
          ? FINANCE_DOMAIN_IDS
          : GENERAL_DOMAIN_IDS

  return ids.every((id) => hasAnswer(state, id))
}

export function isGraduateBackupComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_english')) return false
  if (!hasAnswer(state, 'cb_graduate_urgency') && !hasAnswer(state, 'cb_urgency')) return false
  // Phase 1: location is not required — UK-wide default
  if (graduateAllowsEarlyDrivingLicence(state)) {
    return GRADUATE_BACKUP_DRIVING.every((id) => hasAnswer(state, id))
  }
  return true
}

export function isGraduateEntryComplete(state: CareerBrainState): boolean {
  if (!hasAnswer(state, 'cb_graduate_study_field') && !hasAnswer(state, 'cb_study_field')) {
    return false
  }
  if (!hasFieldAlignmentAnswer(state)) {
    return false
  }
  if (graduateWantsChange(state) && !hasAnswer(state, 'cb_change_target_field')) {
    return false
  }
  if (!isGraduateDomainComplete(state)) return false
  return isGraduateBackupComplete(state)
}

function pickCreativeDomainQuestion(state: CareerBrainState): CareerBrainQuestion | null {
  const map: Record<string, CareerBrainQuestion> = {
    cb_creative_portfolio: q('cb_creative_portfolio', 'Do you have a portfolio or showreel?', [
      { value: 'yes_strong', label: 'Yes — strong portfolio / showreel' },
      { value: 'yes_basic', label: 'Yes — student or graduate work' },
      { value: 'building', label: 'Building one now' },
      { value: 'no', label: 'Not yet' },
    ]),
    cb_animation_tools: q(
      'cb_animation_tools',
      'What animation, design, or motion tools do you use?',
      [
        { value: 'after_effects', label: 'After Effects' },
        { value: 'premiere', label: 'Premiere Pro' },
        { value: 'maya', label: 'Maya' },
        { value: 'blender', label: 'Blender' },
        { value: 'photoshop', label: 'Photoshop / Illustrator' },
      ],
      true,
      4
    ),
    cb_creative_target_roles: q(
      'cb_creative_target_roles',
      'Which roles are you targeting?',
      [
        { value: 'junior_animator', label: 'Junior Animator' },
        { value: 'motion_designer', label: 'Motion Designer' },
        { value: 'video_editor', label: 'Video Editor' },
        { value: 'graphic_designer', label: 'Graphic Designer' },
        { value: '3d_artist', label: '3D Artist' },
        { value: 'open', label: 'Open to any creative graduate role' },
      ],
      true,
      2
    ),
    cb_graduate_creative_openness: GRADUATE_QUESTIONS.creativeOpenness,
  }
  for (const id of CREATIVE_DOMAIN_IDS) {
    if (!hasAnswer(state, id)) return map[id]
  }
  return null
}

function pickDomainQuestion(state: CareerBrainState): CareerBrainQuestion | null {
  if (!graduateWantsSameOrRelated(state) && !isFieldAlignmentBoth(state)) {
    return null
  }

  const domain = inferGraduateDomain(getGraduateStudyField(state))
  if (domain === 'creative') return pickCreativeDomainQuestion(state)
  if (domain === 'it') {
    for (const id of IT_DOMAIN_IDS) {
      if (!hasAnswer(state, id)) {
        const map: Record<string, CareerBrainQuestion> = {
          cb_graduate_it_stack: GRADUATE_QUESTIONS.itStack,
          cb_graduate_it_projects: GRADUATE_QUESTIONS.itProjects,
          cb_graduate_it_routes: GRADUATE_QUESTIONS.itRoutes,
        }
        return map[id]
      }
    }
    return null
  }
  if (domain === 'finance') {
    for (const id of FINANCE_DOMAIN_IDS) {
      if (!hasAnswer(state, id)) {
        const map: Record<string, CareerBrainQuestion> = {
          cb_graduate_qual_region: GRADUATE_QUESTIONS.qualRegion,
          cb_graduate_uk_work_exp: GRADUATE_QUESTIONS.ukWorkExp,
          cb_graduate_finance_routes: GRADUATE_QUESTIONS.financeRoutes,
        }
        return map[id]
      }
    }
    return null
  }
  if (!hasAnswer(state, 'cb_graduate_role_target')) {
    return GRADUATE_QUESTIONS.roleTarget
  }
  return null
}

function pickBackupQuestion(state: CareerBrainState): CareerBrainQuestion | null {
  if (!hasAnswer(state, 'cb_english')) {
    return q('cb_english', 'How confident is your English for UK work?', [
      { value: 'basic', label: 'Basic — simple tasks only' },
      { value: 'functional', label: 'I can follow instructions at work' },
      { value: 'comfortable', label: 'Comfortable in most situations' },
      { value: 'fluent', label: 'Fluent' },
    ])
  }

  if (!hasAnswer(state, 'cb_graduate_urgency') && !hasAnswer(state, 'cb_urgency')) {
    return GRADUATE_QUESTIONS.urgency
  }

  if (graduateAllowsEarlyDrivingLicence(state)) {
    if (!hasAnswer(state, 'cb_uk_driving_licence')) {
      return q('cb_uk_driving_licence', 'Do you have a UK driving licence?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ])
    }
    if (!hasAnswer(state, 'cb_has_car')) {
      return q('cb_has_car', 'Do you have access to a car for work?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'sometimes', label: 'Sometimes / shared car' },
      ])
    }
  }

  return null
}

export function pickGraduateEntryQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!hasAnswer(state, 'cb_graduate_study_field') && !hasAnswer(state, 'cb_study_field')) {
    return {
      question: GRADUATE_QUESTIONS.studyField,
      reason: 'Graduate path — study field',
    }
  }

  const specQ = pickFieldSpecialisationQuestion(state)
  if (specQ.question) {
    return specQ
  }

  if (!hasFieldAlignmentAnswer(state)) {
    return {
      question: GRADUATE_QUESTIONS.fieldAlignment,
      reason: 'Graduate path — work in this field?',
    }
  }

  if (graduateWantsChange(state) && !hasAnswer(state, 'cb_change_target_field')) {
    return {
      question: qFreeText(
        'cb_change_target_field',
        'What type of work or field do you want to move into?',
        'office admin, healthcare, IT, creative media'
      ),
      reason: 'Graduate path — career change target',
    }
  }

  const stub = graduateProfileStub(state)
  if (wantsBridgeRoleDiscovery(stub, state)) {
    const bridgeQ = pickBridgeDiscoveryQuestion(stub, state)
    if (bridgeQ.question) {
      return {
        question: bridgeQ.question,
        reason: bridgeQ.reason,
      }
    }
  }

  const domainQ = pickDomainQuestion(state)
  if (domainQ) {
    return {
      question: domainQ,
      reason: `Graduate path — domain (${inferGraduateDomain(getGraduateStudyField(state))})`,
    }
  }

  const backupQ = pickBackupQuestion(state)
  if (backupQ) {
    return {
      question: backupQ,
      reason: 'Graduate path — backup employability (after domain)',
    }
  }

  return { question: null, reason: 'Graduate path complete' }
}
