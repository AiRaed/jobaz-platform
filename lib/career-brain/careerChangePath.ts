/**
 * Career Change pathway — employed users transitioning to a different field.
 * NOT the unemployed flow.
 */

import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'
import {
  CAREER_SECTOR_OPTIONS,
  CAREER_SECTOR_TARGET_OPTIONS,
  labelCareerSector,
  resolveCareerSectorId,
} from '@/lib/career-engine/shared/careerSectors'
import { resolveTargetSectorFromInterests } from '@/lib/career-engine/shared/interestScoring'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
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

export const CAREER_CHANGE_CURRENT_FIELD_QUESTION = q(
  'cb_change_current_field',
  'What field are you currently working in or have most experience in?',
  [...CAREER_SECTOR_OPTIONS]
)

export const CAREER_CHANGE_EXPERIENCE_YEARS_QUESTION = q(
  'cb_change_experience_years',
  'How many years of experience do you have in your current field?',
  [
    { value: '0_1', label: 'Less than 1 year' },
    { value: '1_3', label: '1–3 years' },
    { value: '3_5', label: '3–5 years' },
    { value: '5_10', label: '5–10 years' },
    { value: '10_plus', label: '10+ years' },
  ]
)

export const CAREER_CHANGE_REASON_QUESTION = q(
  'cb_change_reason',
  'Why do you want to change career?',
  [
    { value: 'salary', label: 'Better salary' },
    { value: 'work_life_balance', label: 'Better work-life balance' },
    { value: 'opportunities', label: 'More opportunities' },
    { value: 'lost_interest', label: 'Lost interest in current field' },
    { value: 'health_lifestyle', label: 'Health or lifestyle reasons' },
    { value: 'remote_work', label: 'Remote work opportunities' },
    { value: 'progression', label: 'Career progression' },
    { value: 'other', label: 'Other' },
  ]
)

export const CAREER_CHANGE_TARGET_FIELD_QUESTION = q(
  'cb_change_target_field',
  'Which field would you like to move into?',
  [...CAREER_SECTOR_TARGET_OPTIONS]
)

export const CAREER_CHANGE_INTEREST_QUESTION = q(
  'cb_change_interest_area',
  'What interests you most?',
  [
    { value: 'people', label: 'Working with people' },
    { value: 'technology', label: 'Working with technology' },
    { value: 'creative', label: 'Creative work' },
    { value: 'problem_solving', label: 'Problem solving' },
    { value: 'helping_others', label: 'Helping others' },
    { value: 'business_management', label: 'Business and management' },
    { value: 'hands_on', label: 'Hands-on practical work' },
    { value: 'research_analysis', label: 'Research and analysis' },
  ]
)

export const CAREER_CHANGE_STUDY_WILLING_QUESTION = q(
  'cb_change_study_willing',
  'Are you willing to study or gain certifications?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]
)

export const CAREER_CHANGE_RETRAIN_TIME_QUESTION = q(
  'cb_change_retrain_time',
  'How much time can you invest in retraining?',
  [
    { value: 'under_3_months', label: 'Less than 3 months' },
    { value: '3_12_months', label: '3–12 months' },
    { value: '1_2_years', label: '1–2 years' },
    { value: 'over_2_years', label: '2+ years' },
  ]
)

export const CAREER_CHANGE_SALARY_REDUCTION_QUESTION = q(
  'cb_change_salary_reduction',
  'Can you accept a temporary salary reduction during the transition?',
  [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]
)

const TARGET_FIELD_LABELS: Record<string, string> = {
  not_sure: 'Not sure yet',
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

export function isCareerChangePath(state: CareerBrainState): boolean {
  const g = String(answers(state).cb_user_goal ?? '')
  return g === 'career_change' || g === 'start_new_career'
}

export function labelCareerChangeCurrentField(value: string): string {
  return labelCareerSector(value)
}

export function labelCareerChangeTargetField(value: string): string {
  const v = value.trim().toLowerCase()
  if (TARGET_FIELD_LABELS[v]) return TARGET_FIELD_LABELS[v]
  return labelCareerSector(value)
}

export function resolveCareerChangeCurrentField(state: CareerBrainState): string {
  const a = answers(state)
  const slug = String(a.cb_change_current_field ?? '').trim()
  if (slug === 'other') {
    return String(a.cb_change_current_field_other ?? a.cb_change_current_field_text ?? '').trim()
  }
  if (slug && slug !== 'other') {
    return labelCareerChangeCurrentField(slug)
  }
  return String(a.cb_change_current_field ?? '').trim()
}

export function resolveCareerChangeTargetField(state: CareerBrainState): string {
  const a = answers(state)
  const slug = String(a.cb_change_target_field ?? a.cb_change_direction ?? '').trim()
  if (slug === 'not_sure') {
    const suggested = String(a.cb_change_suggested_target ?? '').trim()
    if (suggested) return labelCareerChangeTargetField(suggested)
  }
  if (slug && slug !== 'not_sure') {
    return labelCareerChangeTargetField(mapLegacyDirection(slug))
  }
  return String(a.cb_change_target_field ?? a.cb_change_direction ?? '').trim()
}

function mapLegacyDirection(dir: string): string {
  const sectorId = resolveCareerSectorId(dir)
  if (sectorId) return sectorId
  const d = dir.toLowerCase()
  if (d === 'office_admin') return 'office_admin'
  if (d === 'it_digital') return 'it_technology'
  if (d === 'care_support') return 'healthcare'
  if (d === 'skilled_trade') return 'construction_trades'
  if (d === 'unsure') return 'not_sure'
  return d
}

export function isCareerChangePathComplete(state: CareerBrainState): boolean {
  if (!isCareerChangePath(state)) return false
  const a = answers(state)
  const current = String(a.cb_change_current_field ?? '').trim()
  if (!current) return false
  if (current === 'other' && !hasAnswer(state, 'cb_change_current_field_other')) return false

  if (!hasAnswer(state, 'cb_change_experience_years')) {
    if (!hasAnswer(state, 'cb_change_pace') && !hasAnswer(state, 'cb_grow_years')) return false
  }
  if (!hasAnswer(state, 'cb_change_reason')) return false

  const target = String(a.cb_change_target_field ?? a.cb_change_direction ?? '').trim()
  if (!target && !hasAnswer(state, 'cb_change_direction')) return false
  if (target === 'not_sure' && !hasAnswer(state, 'cb_change_interest_area')) return false

  if (!hasAnswer(state, 'cb_change_study_willing') && !hasAnswer(state, 'cb_cert_openness')) {
    return false
  }
  if (!hasAnswer(state, 'cb_change_retrain_time') && !hasAnswer(state, 'cb_change_pace')) {
    return false
  }
  if (!hasAnswer(state, 'cb_change_salary_reduction')) return false

  return true
}

export function pickCareerChangePathQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!isCareerChangePath(state)) {
    return { question: null, reason: 'Not career change path' }
  }

  if (!hasAnswer(state, 'cb_change_current_field')) {
    return { question: CAREER_CHANGE_CURRENT_FIELD_QUESTION, reason: 'Career change — current field' }
  }
  if (String(answers(state).cb_change_current_field) === 'other' && !hasAnswer(state, 'cb_change_current_field_other')) {
    return {
      question: qFreeText(
        'cb_change_current_field_other',
        'Please describe your current field:',
        'taxi driving, accounting, childcare'
      ),
      reason: 'Career change — current field detail',
    }
  }
  if (!hasAnswer(state, 'cb_change_experience_years') && !hasAnswer(state, 'cb_grow_years')) {
    return { question: CAREER_CHANGE_EXPERIENCE_YEARS_QUESTION, reason: 'Career change — experience years' }
  }
  if (!hasAnswer(state, 'cb_change_reason')) {
    return { question: CAREER_CHANGE_REASON_QUESTION, reason: 'Career change — reason' }
  }
  if (!hasAnswer(state, 'cb_change_target_field') && !hasAnswer(state, 'cb_change_direction')) {
    return { question: CAREER_CHANGE_TARGET_FIELD_QUESTION, reason: 'Career change — target field' }
  }
  const target = String(answers(state).cb_change_target_field ?? answers(state).cb_change_direction ?? '')
  if ((target === 'not_sure' || target === 'unsure') && !hasAnswer(state, 'cb_change_interest_area')) {
    return { question: CAREER_CHANGE_INTEREST_QUESTION, reason: 'Career change — interest area' }
  }
  if (!hasAnswer(state, 'cb_change_study_willing')) {
    return { question: CAREER_CHANGE_STUDY_WILLING_QUESTION, reason: 'Career change — study willingness' }
  }
  if (!hasAnswer(state, 'cb_change_retrain_time') && !hasAnswer(state, 'cb_change_pace')) {
    return { question: CAREER_CHANGE_RETRAIN_TIME_QUESTION, reason: 'Career change — retrain timeline' }
  }
  if (!hasAnswer(state, 'cb_change_salary_reduction')) {
    return { question: CAREER_CHANGE_SALARY_REDUCTION_QUESTION, reason: 'Career change — salary flexibility' }
  }

  return { question: null, reason: 'Career change path complete' }
}

const EXPERIENCE_YEAR_LABELS: Record<string, string> = {
  '0_1': 'less than 1 year',
  '1_3': '1–3 years',
  '3_5': '3–5 years',
  '5_10': '5–10 years',
  '10_plus': '10+ years',
}

const REASON_LABELS: Record<string, string> = {
  salary: 'better salary',
  work_life_balance: 'better work-life balance',
  opportunities: 'more opportunities',
  lost_interest: 'lost interest in your current field',
  health_lifestyle: 'health or lifestyle reasons',
  remote_work: 'remote work opportunities',
  progression: 'career progression',
  other: 'personal reasons',
}

export function labelCareerChangeExperienceYears(state: CareerBrainState): string {
  const band = String(answers(state).cb_change_experience_years ?? answers(state).cb_grow_years ?? '')
  return EXPERIENCE_YEAR_LABELS[band] ?? 'several years'
}

export function labelCareerChangeReason(state: CareerBrainState): string {
  const raw = String(answers(state).cb_change_reason ?? 'other')
  return REASON_LABELS[raw] ?? raw.replace(/_/g, ' ')
}

export function isCareerChangeStudyWilling(state: CareerBrainState): boolean {
  return String(answers(state).cb_change_study_willing ?? answers(state).cb_cert_openness ?? '') === 'yes'
}

export function applyCareerChangePathToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  if (!isCareerChangePath(state)) return profile

  const a = answers(state)
  const current = resolveCareerChangeCurrentField(state)
  const target = resolveCareerChangeTargetField(state)

  const yearsBand = String(a.cb_change_experience_years ?? a.cb_grow_years ?? '')
  const yearsMap: Record<string, number> = {
    '0_1': 1,
    under_1: 1,
    '1_3': 2,
    '3_5': 4,
    '5_10': 7,
    '10_plus': 12,
    '1_2': 2,
    '6_10': 8,
  }

  const studyWilling = String(a.cb_change_study_willing ?? a.cb_cert_openness ?? '')
  const constraints = new Set(profile.constraints)
  if (isCareerChangePathComplete(state)) {
    constraints.add('career-change-path')
    constraints.add('employed-transition')
    constraints.delete('unemployed-path')
    constraints.delete('pathway-deterministic-locked')
  }

  return {
    ...profile,
    workExperienceField: current || profile.workExperienceField,
    targetField: target || profile.targetField,
    yearsOfExperience: yearsMap[yearsBand] ?? profile.yearsOfExperience,
    wantsCareerChange: true,
    wantsSameField: false,
    urgencyLevel: String(a.cb_change_salary_reduction) === 'no' ? 'medium' : profile.urgencyLevel,
    constraints: [...constraints],
    transferableSkills: profile.transferableSkills,
  }
}

export function syncCareerChangeAnswers(state: CareerBrainState): CareerBrainState {
  if (!isCareerChangePath(state)) return state
  const a = { ...answers(state) }

  if (a.cb_change_direction && !a.cb_change_target_field) {
    a.cb_change_target_field = mapLegacyDirection(String(a.cb_change_direction))
  }
  if (a.cb_change_reason === 'pay') {
    a.cb_change_reason = 'salary'
  }
  if (a.cb_change_pace && !a.cb_change_retrain_time) {
    const pace = String(a.cb_change_pace)
    a.cb_change_retrain_time =
      pace === 'quick' ? 'under_3_months' : pace === 'gradual' ? '3_12_months' : '1_2_years'
  }
  if (a.cb_change_study_willing === 'yes' && !a.cb_cert_openness) {
    a.cb_cert_openness = 'yes'
  }
  if (a.cb_change_study_willing === 'no' && !a.cb_cert_openness) {
    a.cb_cert_openness = 'direct_only'
  }
  if (a.cb_change_target_field === 'not_sure' && a.cb_change_interest_area && !a.cb_change_suggested_target) {
    a.cb_change_suggested_target = resolveTargetSectorFromInterests(
      String(a.cb_change_interest_area),
      {
        educationLevel: String(a.cb_first_job_education_level ?? a.education_level ?? ''),
        englishLevel: String(a.cb_english_level ?? a.english_level ?? ''),
        ukWorkExperience: String(a.uk_work_experience ?? ''),
        hasWorkExperience: String(a.cb_change_experience_years ?? '1_3') !== '0_1',
        studyWilling: String(a.cb_change_study_willing ?? 'yes'),
        urgency: String(a.urgency ?? ''),
      }
    )
  }

  return { ...state, answers: a }
}

export function buildCareerChangePathReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state || !isCareerChangePath(state)) return []
  const current = resolveCareerChangeCurrentField(state)
  const target = resolveCareerChangeTargetField(state)
  return [
    `Career change pathway — transitioning from ${current || 'your current field'} to ${target || 'your target field'}.`,
    'Existing experience is treated as transferable — not as unemployment.',
  ]
}
