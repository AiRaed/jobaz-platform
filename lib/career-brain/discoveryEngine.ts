/**
 * Career Discovery Engine — gap-based question selection (replaces fixed sequence).
 */

import {
  isGenericNoExperiencePath,
  isGraduatePath,
  isStudentPath,
  isStructuredEntryComplete,
  pickStructuredEntryQuestion,
} from './entryClassification'
import { isCareerChangePath, isCareerChangePathComplete } from './careerChangePath'
import { isGrowCareerPath, isGrowCareerPathComplete } from './growCareerPath'
import {
  isBridgeDiscoveryComplete,
  pickBridgeDiscoveryQuestion,
  wantsBridgeRoleDiscovery,
} from './bridgeRoleIntelligence'
import { isGraduateEntryComplete, graduateWantsChange } from './graduatePath'
import { isStudentEntryComplete } from './studentPath'
import {
  buildDiscoveryProfile,
  hasAnyBackground,
  hasNoEducationOrExperience,
  inferChangeTrack,
} from './discoveryProfile'
import type { DiscoveryProfile, MissingField } from './discoveryTypes'
import {
  isCreativeDomain,
  isCreativeSpecialistQuestioningComplete,
  pickCreativeQuestions,
} from './domainQuestions'
import { isFieldFirstMode } from './domains'
import type {
  CareerBrainQuestion,
  CareerBrainState,
  CareerProfile,
} from './types'

export { buildDiscoveryProfile } from './discoveryProfile'

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

const QUESTIONS: Record<string, CareerBrainQuestion> = {
  cb_change_target_field: qFreeText(
    'cb_change_target_field',
    'What type of work or field do you want to move into?',
    'office admin, customer service, healthcare, IT, creative media'
  ),
  cb_office_computer_level: q(
    'cb_office_computer_level',
    'How confident are you using computers, email, and basic documents?',
    [
      { value: 'low', label: 'Not confident yet' },
      { value: 'basic', label: 'Basic — email and simple documents' },
      { value: 'comfortable', label: 'Comfortable with office software' },
      { value: 'strong', label: 'Strong — spreadsheets and admin tools' },
    ]
  ),
  cb_office_customer_comfort: q(
    'cb_office_customer_comfort',
    'Are you comfortable speaking with customers by phone or email?',
    [
      { value: 'yes', label: 'Yes' },
      { value: 'sometimes', label: 'Sometimes / with support' },
      { value: 'no', label: 'Prefer minimal customer contact' },
    ]
  ),
  cb_office_training: q(
    'cb_office_training',
    'Would you consider short admin or customer service training to get started?',
    [
      { value: 'yes', label: 'Yes' },
      { value: 'maybe', label: 'Maybe — depends on cost/time' },
      { value: 'no', label: 'No — prefer to start without training' },
    ]
  ),
  cb_office_role_preference: q(
    'cb_office_role_preference',
    'Do you prefer office admin, reception, customer support, or data entry?',
    [
      { value: 'admin', label: 'Office admin / assistant' },
      { value: 'reception', label: 'Reception' },
      { value: 'customer_support', label: 'Customer support' },
      { value: 'data_entry', label: 'Data entry' },
      { value: 'open', label: 'Open to any office role first' },
    ],
    true,
    2
  ),
  cb_english: q('cb_english', 'How confident is your English for UK work?', [
    { value: 'basic', label: 'Basic — simple tasks only' },
    { value: 'functional', label: 'I can follow instructions at work' },
    { value: 'comfortable', label: 'Comfortable in most situations' },
    { value: 'fluent', label: 'Fluent' },
  ]),
  cb_driving_licence: q('cb_driving_licence', 'Do you have a UK driving licence (and access to a car if needed)?', [
    { value: 'yes', label: 'Yes — licence and car' },
    { value: 'licence_only', label: 'Licence but no car' },
    { value: 'no', label: 'No licence' },
  ]),
  cb_physical_ability: q(
    'cb_physical_ability',
    'Are you able to do physical work (standing, lifting, warehouse, kitchen)?',
    [
      { value: 'yes', label: 'Yes — physical work is fine' },
      { value: 'light_only', label: 'Light physical only' },
      { value: 'no', label: 'Prefer non-physical work' },
    ]
  ),
  cb_customer_comfort: q('cb_customer_comfort', 'Are you comfortable with customer-facing work?', [
    { value: 'yes', label: 'Yes' },
    { value: 'sometimes', label: 'Sometimes / depends' },
    { value: 'no', label: 'Prefer not customer-facing' },
  ]),
  cb_shift_flexibility: q('cb_shift_flexibility', 'Can you work evenings, weekends, or shifts?', [
    { value: 'yes', label: 'Yes — flexible' },
    { value: 'some', label: 'Some shifts only' },
    { value: 'no', label: 'Daytime / weekdays only' },
  ]),
  cb_urgency: q('cb_urgency', 'How urgent is it for you to find work?', [
    { value: 'urgent', label: 'I need income urgently' },
    { value: 'soon', label: 'Within a few weeks' },
    { value: 'flexible', label: 'I can take time to find the right fit' },
  ]),
  // Phase 1: city/location is not asked — default UK-wide in discoveryProfile.
}

export function computeMissingFields(
  d: DiscoveryProfile,
  asked: Set<string>,
  state: CareerBrainState
): MissingField[] {
  const missing: MissingField[] = []

  if (isCareerChangePath(state) && isCareerChangePathComplete(state)) {
    return missing
  }

  if (isGrowCareerPath(state) && isGrowCareerPathComplete(state)) {
    return missing
  }

  const entryComplete = isStructuredEntryComplete(state)
  const useLegacyEduExp = !entryComplete && !state.answers?.cb_entry_situation

  if (useLegacyEduExp) {
    const eduAns = state.answers?.cb_edu ?? state.answers?.edu
    const expAns = state.answers?.cb_exp ?? state.answers?.exp
    if (eduAns === undefined) {
      missing.push({ field: 'education_exists', priority: 100, reason: 'Need education gate' })
    } else if (eduAns === 'yes' && !d.education_field) {
      missing.push({ field: 'education_field', priority: 98, reason: 'Education yes — need field' })
    }
    if (expAns === undefined) {
      missing.push({ field: 'work_experience_exists', priority: 97, reason: 'Need experience gate' })
    } else if (expAns === 'yes' && !d.work_experience_field) {
      missing.push({
        field: 'work_experience_field',
        priority: 96,
        reason: 'Experience yes — need field description',
      })
    }
    if (hasAnyBackground(d) && d.wants_same_field === null && !asked.has('cb_field_intent')) {
      missing.push({ field: 'wants_same_field', priority: 94, reason: 'Has background — need field intent' })
    }
  } else if (entryComplete && !isGenericNoExperiencePath(state) && !isGraduatePath(state) && !isStudentPath(state)) {
    if (
      d.wants_same_field === null &&
      d.wants_career_change === null &&
      !asked.has('cb_continue_in_field') &&
      !asked.has('cb_professional_field_intent')
    ) {
      missing.push({ field: 'wants_same_field', priority: 94, reason: 'Need field direction' })
    }
  }

  if (
    d.wants_career_change === true &&
    !d.target_field &&
    !asked.has('cb_change_target_field') &&
    !isCareerChangePathComplete(state)
  ) {
    missing.push({
      field: 'target_field',
      priority: 93,
      reason: 'Career change — need target field (free text)',
    })
  }

  const changeTrack = inferChangeTrack(d.target_field)

  if (d.wants_career_change && changeTrack === 'office' && !isCareerChangePathComplete(state)) {
    if (!d.computer_level && !asked.has('cb_office_computer_level')) {
      missing.push({
        field: 'computer_level',
        priority: 92,
        reason: 'Office change — computer/email confidence',
      })
    }
    if (!d.customer_facing_comfort && !asked.has('cb_office_customer_comfort')) {
      missing.push({
        field: 'customer_facing_comfort',
        priority: 91,
        reason: 'Office change — customer communication',
      })
    }
    if (d.willingness_to_train === null && !asked.has('cb_office_training')) {
      missing.push({
        field: 'willingness_to_train',
        priority: 90,
        reason: 'Office change — training willingness',
      })
    }
    if (!asked.has('cb_office_role_preference')) {
      missing.push({
        field: 'target_field',
        priority: 89,
        reason: 'Office change — role preference',
      })
    }
  }

  if (isGenericNoExperiencePath(state) && entryComplete) {
    if (!d.english_level && !asked.has('cb_english')) {
      missing.push({ field: 'english_level', priority: 88, reason: 'Generic no-exp — English' })
    }
    if (d.driving_licence === null && !asked.has('cb_uk_driving_licence') && !asked.has('cb_driving_licence')) {
      missing.push({ field: 'driving_licence', priority: 87, reason: 'Generic no-exp — licence' })
    }
    if (!d.physical_work_ability && !asked.has('cb_physical_ability')) {
      missing.push({ field: 'physical_work_ability', priority: 86, reason: 'Generic no-exp — physical' })
    }
    if (!d.customer_facing_comfort && !asked.has('cb_customer_comfort')) {
      missing.push({ field: 'customer_facing_comfort', priority: 85, reason: 'Generic no-exp — customer' })
    }
    if (!d.shift_flexibility && !asked.has('cb_shift_flexibility')) {
      missing.push({ field: 'shift_flexibility', priority: 84, reason: 'Generic no-exp — shifts' })
    }
    if (!d.urgency && !asked.has('cb_urgency')) {
      missing.push({ field: 'urgency', priority: 83, reason: 'Generic no-exp — urgency' })
    }
  }

  const sameFieldCreative =
    (d.wants_same_field === true || d.wants_career_change === false) &&
    (isCreativeDomain(d.domain) ||
      /animat|motion|video|3d|creative|design/i.test(
        `${d.education_field ?? ''} ${d.work_experience_field ?? ''}`
      ))

  if (sameFieldCreative && !d.wants_career_change) {
    if (d.has_portfolio === null && !asked.has('cb_creative_portfolio')) {
      missing.push({ field: 'has_portfolio', priority: 82, reason: 'Creative — portfolio' })
    }
    if (d.tools.length < 2 && !asked.has('cb_animation_tools')) {
      missing.push({ field: 'tools', priority: 81, reason: 'Creative — tools' })
    }
    if (!asked.has('cb_creative_target_roles')) {
      missing.push({ field: 'target_field', priority: 79, reason: 'Creative — target roles' })
    }
  }

  if (!hasNoEducationOrExperience(d) && !d.wants_career_change) {
    if (!d.english_level && !asked.has('cb_english')) {
      missing.push({ field: 'english_level', priority: 50, reason: 'General — English for UK work' })
    }
    if (!d.urgency && !asked.has('cb_urgency')) {
      missing.push({ field: 'urgency', priority: 40, reason: 'General — urgency' })
    }
  }

  return missing.sort((a, b) => b.priority - a.priority)
}

const FIELD_TO_QUESTION: Record<string, string> = {
  education_exists: 'cb_edu',
  education_field: 'cb_study_field',
  work_experience_exists: 'cb_exp',
  work_experience_field: 'cb_work_experience',
  wants_same_field: 'cb_field_intent',
  target_field: 'cb_change_target_field',
  computer_level: 'cb_office_computer_level',
  customer_facing_comfort: 'cb_office_customer_comfort',
  willingness_to_train: 'cb_office_training',
  english_level: 'cb_english',
  driving_licence: 'cb_driving_licence',
  physical_work_ability: 'cb_physical_ability',
  shift_flexibility: 'cb_shift_flexibility',
  urgency: 'cb_urgency',
  has_portfolio: 'cb_creative_portfolio',
  tools: 'cb_animation_tools',
}

function questionForMissing(
  m: MissingField,
  d: DiscoveryProfile,
  asked: Set<string>
): CareerBrainQuestion | null {
  if (m.field === 'target_field' && m.reason.includes('role preference')) {
    return asked.has('cb_office_role_preference') ? null : QUESTIONS.cb_office_role_preference
  }
  if (m.field === 'target_field' && d.wants_career_change) {
    return asked.has('cb_change_target_field') ? null : QUESTIONS.cb_change_target_field
  }
  if (m.field === 'target_field' && m.reason.includes('Creative')) {
    return null
  }
  if (m.field === 'customer_facing_comfort' && inferChangeTrack(d.target_field) === 'office') {
    return asked.has('cb_office_customer_comfort')
      ? null
      : QUESTIONS.cb_office_customer_comfort
  }
  if (m.field === 'computer_level') {
    return asked.has('cb_office_computer_level') ? null : QUESTIONS.cb_office_computer_level
  }
  if (m.field === 'willingness_to_train') {
    return asked.has('cb_office_training') ? null : QUESTIONS.cb_office_training
  }

  const qid = FIELD_TO_QUESTION[m.field]
  if (!qid || asked.has(qid)) return null
  return QUESTIONS[qid] ?? null
}

export function pickNextDiscoveryQuestion(
  profile: CareerProfile,
  askedIds: string[],
  state: CareerBrainState
): import('./discoveryTypes').DiscoveryPickResult {
  const asked = new Set(askedIds)
  const legacyFlowSkipped = true

  if (!isStructuredEntryComplete(state)) {
    const entry = pickStructuredEntryQuestion(state)
    return {
      question: entry.question,
      reason: entry.reason,
      missingFields: [],
      legacyFlowSkipped,
    }
  }

  if (isCareerChangePath(state) && isCareerChangePathComplete(state)) {
    return {
      question: null,
      reason: 'Career change pathway complete — no discovery questions',
      missingFields: [],
      legacyFlowSkipped,
    }
  }

  if (isGrowCareerPath(state) && isGrowCareerPathComplete(state)) {
    return {
      question: null,
      reason: 'Grow career pathway complete — no discovery questions',
      missingFields: [],
      legacyFlowSkipped,
    }
  }

  const discovery = buildDiscoveryProfile(state, profile)
  const missing = computeMissingFields(discovery, asked, state)

  if (
    wantsBridgeRoleDiscovery(profile, state) &&
    !profile.constraints.includes('dual-path-mode') &&
    !profile.constraints.includes('flexible-employment-mode') &&
    !isBridgeDiscoveryComplete(profile, state)
  ) {
    const bridgeQ = pickBridgeDiscoveryQuestion(profile, state)
    if (bridgeQ.question) {
      return {
        question: bridgeQ.question,
        reason: bridgeQ.reason,
        missingFields: missing,
        legacyFlowSkipped,
      }
    }
  }

  const creative =
    (discovery.wants_same_field === true || !discovery.wants_career_change) &&
    isCreativeDomain(profile.domain)
  if (creative && !discovery.wants_career_change) {
    const cq = pickCreativeQuestions(profile, asked)
    if (cq.question) {
      return {
        question: cq.question,
        reason: `Discovery: ${cq.reason}`,
        missingFields: missing,
        legacyFlowSkipped,
      }
    }
  }

  for (const gap of missing) {
    const question = questionForMissing(gap, discovery, asked)
    if (question) {
      return {
        question,
        reason: `Discovery: ${gap.field} — ${gap.reason} (priority ${gap.priority})`,
        missingFields: missing,
        legacyFlowSkipped,
      }
    }
  }

  if (creative && !isCreativeSpecialistQuestioningComplete(profile, asked)) {
    const cq = pickCreativeQuestions(profile, asked)
    if (cq.question) {
      return {
        question: cq.question,
        reason: `Discovery fallback: ${cq.reason}`,
        missingFields: missing,
        legacyFlowSkipped,
      }
    }
  }

  return {
    question: null,
    reason: 'Discovery complete — no high-priority gaps',
    missingFields: missing,
    legacyFlowSkipped,
  }
}

export function shouldFinalizeDiscovery(
  profile: CareerProfile,
  askedIds: string[],
  state: CareerBrainState
): { finalize: boolean; reason: string } {
  if (!isStructuredEntryComplete(state)) {
    return { finalize: false, reason: 'Structured entry classification incomplete' }
  }

  if (isCareerChangePath(state) && isCareerChangePathComplete(state)) {
    return { finalize: true, reason: 'Career change pathway complete' }
  }

  if (isGrowCareerPath(state) && isGrowCareerPathComplete(state)) {
    return { finalize: true, reason: 'Grow career pathway complete' }
  }

  const asked = new Set(askedIds)
  const d = buildDiscoveryProfile(state, profile)
  const missing = computeMissingFields(d, asked, state)

  const critical = missing.filter((m) => m.priority >= 83)
  if (critical.length > 0) {
    return {
      finalize: false,
      reason: `Missing critical: ${critical.map((c) => c.field).join(', ')}`,
    }
  }

  if (isStudentPath(state)) {
    if (!isStudentEntryComplete(state)) {
      return { finalize: false, reason: 'Student path — structured entry incomplete' }
    }
    if (missing.filter((m) => m.priority >= 79).length === 0) {
      return { finalize: true, reason: 'Student path — identity and contextual complete' }
    }
  }

  if (isGraduatePath(state)) {
    if (!isGraduateEntryComplete(state)) {
      return { finalize: false, reason: 'Graduate path — structured entry incomplete' }
    }
    if (graduateWantsChange(state) && inferChangeTrack(d.target_field) === 'office') {
      const officeIds = [
        'cb_change_target_field',
        'cb_office_computer_level',
        'cb_office_customer_comfort',
        'cb_office_training',
        'cb_office_role_preference',
      ]
      if (officeIds.filter((id) => asked.has(id)).length < 4) {
        return { finalize: false, reason: 'Graduate career change — office diagnostics' }
      }
    }
    if (missing.filter((m) => m.priority >= 79).length === 0) {
      return { finalize: true, reason: 'Graduate path — domain and backup complete' }
    }
  }

  if (isGenericNoExperiencePath(state)) {
    const entryIds = [
      'cb_uk_driving_licence',
      'cb_has_car',
      'cb_english',
      'cb_physical_ability',
      'cb_customer_comfort',
      'cb_shift_flexibility',
      'cb_cert_openness',
      'cb_entry_work_preference',
    ]
    const answered = entryIds.filter((id) => asked.has(id)).length
    if (answered < 6) {
      return { finalize: false, reason: 'Generic no experience — employability incomplete' }
    }
    return { finalize: true, reason: 'Generic no experience — entry complete' }
  }

  if (d.wants_career_change && inferChangeTrack(d.target_field) === 'office') {
    const officeIds = [
      'cb_change_target_field',
      'cb_office_computer_level',
      'cb_office_customer_comfort',
      'cb_office_training',
      'cb_office_role_preference',
    ]
    const officeAnswered = officeIds.filter((id) => asked.has(id)).length
    if (officeAnswered < 4) {
      return { finalize: false, reason: 'Office career change — diagnostics incomplete' }
    }
    return { finalize: true, reason: 'Office change diagnostics complete' }
  }

  if (
    isCreativeDomain(profile.domain) &&
    (d.wants_same_field === true || !d.wants_career_change) &&
    isFieldFirstMode(profile)
  ) {
    if (!isCreativeSpecialistQuestioningComplete(profile, asked)) {
      return { finalize: false, reason: 'Creative specialist evidence incomplete' }
    }
    return { finalize: true, reason: 'Creative specialist complete' }
  }

  if (missing.filter((m) => m.priority >= 79).length > 0) {
    return { finalize: false, reason: 'Specialist gaps remain' }
  }

  if (asked.size >= 6 && profile.confidence >= 0.4) {
    return { finalize: true, reason: 'Sufficient discovery evidence' }
  }

  if (asked.size >= 10) {
    return { finalize: true, reason: 'Question cap' }
  }

  return { finalize: false, reason: 'Gathering more context' }
}

export function applyDiscoveryAnswer(
  profile: CareerProfile,
  questionId: string,
  answer: string | string[]
): CareerProfile {
  const val = Array.isArray(answer) ? answer.join(',') : String(answer)
  const next = { ...profile }

  switch (questionId) {
    case 'cb_change_target_field':
      next.targetField = val.trim()
      next.wantsCareerChange = true
      break
    case 'cb_office_computer_level':
    case 'cb_computer_level':
      break
    case 'cb_office_customer_comfort':
    case 'cb_customer_comfort':
      break
    case 'cb_office_training':
      break
    case 'cb_office_role_preference':
      next.targetField = next.targetField ?? val
      break
    case 'cb_driving_licence':
      if (val === 'yes' || val === 'licence_only') {
        next.licences = [...new Set([...next.licences, 'Driving licence'])]
      }
      break
    case 'cb_physical_ability':
      if (val === 'no') next.constraints = [...new Set([...next.constraints, 'non-physical'])]
      break
    case 'cb_shift_flexibility':
      break
    default:
      break
  }

  return next
}
