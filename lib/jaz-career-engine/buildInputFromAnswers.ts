/**
 * Normalize Career Assistant / Extra Income answers into JazAnalyseInput.
 */

import type { JazAnalyseInput, JazCareerGoal, JazWorkModePreference } from './types'

const GOAL_MAP: Record<string, JazCareerGoal> = {
  work_in_education: 'work_in_education',
  work_in_experience: 'work_in_experience',
  start_new_career: 'start_new_career',
  grow_current_career: 'grow_current_career',
  grow_career: 'grow_current_career',
  extra_income: 'extra_income',
  start_business: 'start_business',
  uk_transition: 'work_in_experience',
  uk_career_assistant: 'unknown',
}

function mapGoal(raw: unknown): JazCareerGoal {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  if (GOAL_MAP[key]) return GOAL_MAP[key]
  if (/extra\s*income|side\s*hustle/i.test(String(raw))) return 'extra_income'
  if (/new\s*career|change\s*career/i.test(String(raw))) return 'start_new_career'
  if (/grow|promot|progress/i.test(String(raw))) return 'grow_current_career'
  if (/business|self.?employ/i.test(String(raw))) return 'start_business'
  if (/education|teach|tutor/i.test(String(raw))) return 'work_in_education'
  return 'unknown'
}

function mapWorkMode(answers: Record<string, unknown>): JazWorkModePreference {
  const blob = JSON.stringify(answers).toLowerCase()
  if (/online|remote|from\s*home/.test(blob) && /physical|in.?person|on.?site/.test(blob)) {
    return 'hybrid'
  }
  if (/online|remote|from\s*home/.test(blob)) return 'online'
  if (/physical|in.?person|on.?site|warehouse|security|retail/.test(blob)) return 'physical'
  if (/flexible|hybrid/.test(blob)) return 'flexible'
  return 'unknown'
}

function collectSkills(answers: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(answers)) {
    if (!/skill|interest|side_skill|sector|route/i.test(k)) continue
    if (Array.isArray(v)) out.push(...v.map(String))
    else if (typeof v === 'string' && v.trim()) {
      // Multi-select may be comma / JSON encoded
      if (v.includes(',') || v.includes('|')) {
        out.push(...v.split(/[,|]/).map((s) => s.trim()).filter(Boolean))
      } else {
        out.push(v)
      }
    }
  }
  return [...new Set(out.map((s) => s.trim()).filter(Boolean))]
}

export function buildJazAnalyseInputFromAnswers(opts: {
  answers?: Record<string, unknown>
  goal?: string
  pathId?: string
  sessionId?: string | null
  userId?: string | null
}): JazAnalyseInput {
  const answers = opts.answers && typeof opts.answers === 'object' ? opts.answers : {}
  const goalRaw =
    opts.goal ||
    answers.cb_user_goal ||
    answers.user_goal ||
    answers.goal ||
    opts.pathId ||
    'unknown'

  const education = String(
    answers.education || answers.cb_education || answers.qualification || ''
  )
  const experience = String(
    answers.experience || answers.cb_experience || answers.work_history || ''
  )
  const availability = String(
    answers.availability || answers.cb_availability || answers.hours || ''
  )
  const language_level = String(
    answers.language_level || answers.english_level || answers.cb_english || ''
  )

  let has_driving_licence: boolean | null = null
  const drive = answers.has_driving_licence ?? answers.driving_licence ?? answers.cb_driving
  if (typeof drive === 'boolean') has_driving_licence = drive
  else if (typeof drive === 'string') {
    if (/yes|true|full|uk/i.test(drive)) has_driving_licence = true
    else if (/no|false|none/i.test(drive)) has_driving_licence = false
  }

  return {
    goal: mapGoal(goalRaw),
    answers,
    skills: collectSkills(answers),
    education,
    experience,
    availability,
    preferences: {
      path_id: opts.pathId,
    },
    language_level,
    has_driving_licence,
    work_mode_preference: mapWorkMode(answers),
    session_id: opts.sessionId || undefined,
    user_id: opts.userId ?? null,
  }
}
