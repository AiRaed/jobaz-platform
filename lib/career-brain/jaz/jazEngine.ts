/**
 * JAZ — dynamic question selection and grow-career answer mapping.
 */

import type { CareerBrainState } from '../types'
import type { JazProfessionTrack, JazQuestionPick } from './jazTypes'
import { describeJazQuestionReason, pickBestJazQuestion } from './jazQuestionBank'
import {
  buildJazUnderstanding,
  inferFieldSlugFromTrack,
  inferJazProfessionTrack,
  isJazQuestioningComplete,
  isLegacyGrowCareerComplete,
} from './jazUnderstanding'

export {
  buildJazUnderstanding,
  computeJazConfidence,
  getJazAnswerIds,
  inferJazProfessionTrack,
  isJazAnswerKey,
  isJazQuestioningComplete,
  isLegacyGrowCareerComplete,
} from './jazUnderstanding'

export { buildJazSystemPrompt } from './jazSystemPrompt'

export function pickNextJazQuestion(state: CareerBrainState): JazQuestionPick {
  if (isLegacyGrowCareerComplete(state)) {
    const u = buildJazUnderstanding(state)
    return { question: null, reason: 'Legacy grow career answers complete', confidence: u.confidence, understanding: u }
  }

  const understanding = buildJazUnderstanding(state)

  if (isJazQuestioningComplete(state)) {
    return {
      question: null,
      reason: `JAZ confidence ${understanding.confidence}% — sufficient evidence (${understanding.questionCount} answers)`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  const pick = pickBestJazQuestion(understanding)
  if (!pick) {
    return {
      question: null,
      reason: `JAZ confidence ${understanding.confidence}% — no high-value gaps`,
      confidence: understanding.confidence,
      understanding,
    }
  }

  return {
    question: pick.question,
    reason: describeJazQuestionReason(pick.def.id, understanding),
    confidence: understanding.confidence,
    understanding,
  }
}

const GOAL_FROM_PROGRESSION: Record<string, string> = {
  hlta: 'promotion',
  teacher: 'promotion',
  senior_teacher: 'promotion',
  leadership: 'leadership',
  specialist: 'specialist',
  senior_ic: 'specialist',
  tech_lead: 'leadership',
  engineering_manager: 'leadership',
  senior_engineer: 'promotion',
  lead_engineer: 'leadership',
  project_manager: 'leadership',
  chartered: 'specialist',
  senior: 'promotion',
  manager: 'leadership',
  controller: 'leadership',
  senior_craft: 'specialist',
  lead: 'leadership',
  art_direction: 'leadership',
  creative_direction: 'leadership',
  freelance: 'salary',
}

function inferGoalFromJazAnswers(state: CareerBrainState, understanding: ReturnType<typeof buildJazUnderstanding>): string | null {
  if (understanding.careerGoal) return understanding.careerGoal

  const spec = understanding.professionSpecific
  for (const key of [
    'jaz_edu_progression',
    'jaz_tech_progression',
    'jaz_eng_progression',
    'jaz_fin_progression',
    'jaz_creative_progression',
  ]) {
    const val = spec[key]
    if (!val) continue
    const slug = String(Array.isArray(val) ? val[0] : val)
    if (GOAL_FROM_PROGRESSION[slug]) return GOAL_FROM_PROGRESSION[slug]
  }
  return null
}

function inferLevelFromYears(years: string): string {
  if (years === '0_1') return 'entry'
  if (years === '1_3' || years === '1_2') return 'junior'
  if (years === '3_5') return 'mid'
  if (years === '5_10' || years === '6_10') return 'senior'
  if (years === '10_plus') return 'senior'
  return 'junior'
}

function mapSeniorityToLevel(state: CareerBrainState): string | null {
  const a = (state.answers ?? {}) as Record<string, unknown>
  const edu = String(a.jaz_edu_seniority ?? '')
  if (edu === 'ta' || edu === 'level3_ta') return 'junior'
  if (edu === 'hlta') return 'mid'
  if (edu === 'teacher' || edu === 'subject_lead') return 'senior'
  if (edu === 'leadership') return 'manager'

  const tech = String(a.jaz_tech_seniority ?? '')
  if (tech === 'graduate') return 'junior'
  if (tech === 'mid') return 'mid'
  if (tech === 'senior' || tech === 'staff') return 'senior'
  if (tech === 'lead') return 'team_leader'
  if (tech === 'manager') return 'manager'

  const band = String(a.jaz_health_band ?? '')
  if (band === 'support') return 'entry'
  if (band === 'band3') return 'junior'
  if (band === 'band5') return 'mid'
  if (band === 'band6') return 'senior'
  if (band === 'band7' || band === 'band8') return 'manager'

  return null
}

/** Map JAZ conversation answers into grow-career advisor fields. */
export function mapJazAnswersToGrowCareerState(state: CareerBrainState): CareerBrainState {
  if (isLegacyGrowCareerComplete(state)) return state

  const u = buildJazUnderstanding(state)
  if (!u.jobTitle) return state

  const track = u.professionTrack ?? inferJazProfessionTrack(u.jobTitle)
  const fieldSlug = inferFieldSlugFromTrack(track, u.jobTitle)
  const goal = inferGoalFromJazAnswers(state, u)
  const mappedLevel =
    mapSeniorityToLevel(state) ??
    u.currentLevel ??
    inferLevelFromYears(String(u.yearsExperience ?? state.answers?.cb_grow_years ?? ''))

  const nextAnswers: Record<string, unknown> = {
    ...(state.answers ?? {}),
    cb_user_goal: 'grow_career',
    currentJobTitle: u.jobTitle,
    cb_grow_field: fieldSlug,
    cb_grow_years: u.yearsExperience ?? state.answers?.cb_grow_years,
    cb_grow_level: mappedLevel ?? state.answers?.cb_grow_level ?? 'junior',
    cb_grow_goal: goal ?? state.answers?.cb_grow_goal ?? 'promotion',
    cb_grow_blocker: u.blockers.length ? u.blockers : state.answers?.cb_grow_blocker,
    cb_grow_study_willing: u.studyWilling ?? state.answers?.cb_grow_study_willing ?? 'yes',
    cb_grow_dev_time: u.devTime ?? state.answers?.cb_grow_dev_time ?? '3_12_months',
    cb_grow_leadership_ready: u.leadershipReady ?? state.answers?.cb_grow_leadership_ready ?? 'not_sure',
    cb_grow_employer_change: u.employerMobility ?? state.answers?.cb_grow_employer_change ?? 'maybe',
    coreSkills: u.strengths.length ? u.strengths : state.answers?.coreSkills,
  }

  if (fieldSlug === 'other' && u.jobTitle) {
    nextAnswers.cb_grow_field_other = u.jobTitle.split(' ').slice(-2).join(' ') || u.jobTitle
  }

  return { ...state, answers: nextAnswers }
}

export function saveJazJobTitle(state: CareerBrainState, rawTitle: unknown): CareerBrainState {
  const trimmed = String(rawTitle ?? '').trim()
  if (!trimmed) return state
  return {
    ...state,
    answers: {
      ...(state.answers ?? {}),
      jaz_job_title: trimmed,
      currentJobTitle: trimmed,
    },
  }
}

export function estimateSalaryGrowthPotential(state: CareerBrainState): string {
  const u = buildJazUnderstanding(state)
  const level = u.currentLevel ?? 'mid'
  const goal = u.careerGoal ?? 'promotion'
  const track = u.professionTrack ?? 'general'

  const bandByTrack: Record<JazProfessionTrack, { now: string; next: string }> = {
    education: { now: '£22k–£28k', next: '£28k–£38k' },
    software: { now: '£35k–£55k', next: '£50k–£80k' },
    healthcare: { now: '£25k–£35k', next: '£32k–£45k' },
    creative: { now: '£24k–£38k', next: '£35k–£55k' },
    engineering: { now: '£32k–£45k', next: '£42k–£60k' },
    finance: { now: '£26k–£38k', next: '£35k–£52k' },
    general: { now: '£24k–£36k', next: '£30k–£45k' },
  }

  const bands = bandByTrack[track]
  const seniorityNote =
    level === 'senior' || level === 'team_leader' || level === 'manager'
      ? 'You are already at a higher band — growth may come from scope and employer move.'
      : ''

  const goalNote =
    goal === 'salary'
      ? 'Salary-led moves often benefit from employer change or specialist depth.'
      : goal === 'leadership'
        ? 'Leadership routes can raise pay through people-management scope.'
        : ''

  return [
    `Typical UK range today for your level in ${track.replace('_', ' ')}: ${bands.now}.`,
    `Realistic next-step band within 1–3 years: ${bands.next}.`,
    seniorityNote,
    goalNote,
    'Figures are indicative — based on your stated role, level, and goal, not invented experience.',
  ]
    .filter(Boolean)
    .join(' ')
}
