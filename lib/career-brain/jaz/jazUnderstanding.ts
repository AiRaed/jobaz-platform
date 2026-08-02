/**
 * JAZ — build internal understanding and confidence from answers.
 */

import type { CareerBrainState } from '../types'
import type { JazProfessionTrack, JazUnderstanding } from './jazTypes'

const JAZ_PREFIX = 'jaz_'

export function isJazAnswerKey(id: string): boolean {
  return id.startsWith(JAZ_PREFIX) || id === 'currentJobTitle'
}

export function getJazAnswerIds(state: CareerBrainState): string[] {
  const keys = Object.keys(state.answers ?? {}).filter(
    (k) => k.startsWith(JAZ_PREFIX) || k === 'currentJobTitle' || k === 'coreSkills'
  )
  const asked = (state.career_brain_asked ?? []).filter((k) => k.startsWith(JAZ_PREFIX) || k === 'currentJobTitle')
  return [...new Set([...keys, ...asked])]
}

export function inferJazProfessionTrack(jobTitle: string): JazProfessionTrack {
  const t = jobTitle.toLowerCase()
  if (/teach|teacher|education|tutor|hlta|learning support|classroom|school/.test(t)) return 'education'
  if (/software|developer|programmer|devops|data engineer|full.?stack|backend|frontend|web/.test(t)) {
    return 'software'
  }
  if (/nurse|midwife|healthcare|clinical|hca|doctor|physio|paramedic|care assistant/.test(t)) {
    return 'healthcare'
  }
  if (/design|creative|motion|graphic|video|animator|illustrat|art director|content/.test(t)) {
    return 'creative'
  }
  if (/engineer|mechanical|electrical|civil|structural|cad|technician/.test(t)) return 'engineering'
  if (/account|finance|payroll|bookkeep|audit|tax/.test(t)) return 'finance'
  return 'general'
}

function readString(state: CareerBrainState, ...keys: string[]): string | null {
  for (const key of keys) {
    const raw = (state.answers ?? {})[key]
    if (raw === undefined || raw === null) continue
    const val = String(raw).trim()
    if (val) return val
  }
  return null
}

function readArray(state: CareerBrainState, ...keys: string[]): string[] {
  for (const key of keys) {
    const raw = (state.answers ?? {})[key]
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
    if (typeof raw === 'string' && raw.trim()) return [raw]
  }
  return []
}

function readProfessionSpecific(state: CareerBrainState): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const [key, val] of Object.entries(state.answers ?? {})) {
    if (!key.startsWith(JAZ_PREFIX)) continue
    if (
      [
        'jaz_job_title',
        'jaz_years',
        'jaz_level',
        'jaz_goal',
        'jaz_blockers',
        'jaz_study',
        'jaz_dev_time',
        'jaz_leadership',
        'jaz_employer',
        'jaz_strengths',
      ].includes(key)
    ) {
      continue
    }
    if (val === undefined || val === null) continue
    if (typeof val === 'string' && !val.trim()) continue
    if (Array.isArray(val) && val.length === 0) continue
    out[key] = val as string | string[]
  }
  return out
}

const PROFESSION_SIGNAL_KEYS: Record<JazProfessionTrack, string[]> = {
  education: ['jaz_edu_qualification', 'jaz_edu_responsibilities', 'jaz_edu_progression'],
  software: ['jaz_tech_stack', 'jaz_tech_architecture', 'jaz_tech_progression'],
  healthcare: ['jaz_health_registration', 'jaz_health_specialty', 'jaz_health_sector'],
  creative: ['jaz_creative_tools', 'jaz_creative_portfolio', 'jaz_creative_progression'],
  engineering: ['jaz_eng_qualification', 'jaz_eng_specialism', 'jaz_eng_progression'],
  finance: ['jaz_fin_qualification', 'jaz_fin_specialism', 'jaz_fin_progression'],
  general: ['jaz_role_responsibilities', 'jaz_progression_target'],
}

export function computeJazConfidence(u: JazUnderstanding): number {
  let score = 0

  if (u.jobTitle) score += 22
  if (u.professionTrack) score += 5
  if (u.yearsExperience) score += 12
  if (u.currentLevel) score += 12
  if (u.careerGoal) score += 14
  if (u.blockers.length) score += 10
  if (u.studyWilling) score += 6
  if (u.devTime) score += 5
  if (u.leadershipReady) score += 6
  if (u.employerMobility) score += 5
  if (u.strengths.length) score += 5

  const track = u.professionTrack ?? 'general'
  const signals = PROFESSION_SIGNAL_KEYS[track]
  const answered = signals.filter((k) => {
    const v = u.professionSpecific[k]
    if (!v) return false
    if (Array.isArray(v)) return v.length > 0
    return String(v).trim().length > 0
  })
  score += Math.min(18, answered.length * 6)

  return Math.min(100, score)
}

export function buildJazUnderstanding(state: CareerBrainState): JazUnderstanding {
  const jobTitle = readString(state, 'jaz_job_title', 'currentJobTitle')
  const professionTrack = jobTitle ? inferJazProfessionTrack(jobTitle) : null
  const askedIds = getJazAnswerIds(state)

  const understanding: JazUnderstanding = {
    jobTitle,
    professionTrack,
    yearsExperience: readString(state, 'jaz_years', 'cb_grow_years'),
    currentLevel: readString(state, 'jaz_level', 'cb_grow_level'),
    careerGoal: readString(state, 'jaz_goal', 'cb_grow_goal'),
    blockers: readArray(state, 'jaz_blockers', 'cb_grow_blocker'),
    studyWilling: readString(state, 'jaz_study', 'cb_grow_study_willing'),
    devTime: readString(state, 'jaz_dev_time', 'cb_grow_dev_time'),
    leadershipReady: readString(state, 'jaz_leadership', 'cb_grow_leadership_ready'),
    employerMobility: readString(state, 'jaz_employer', 'cb_grow_employer_change'),
    strengths: readArray(state, 'jaz_strengths', 'coreSkills'),
    professionSpecific: readProfessionSpecific(state),
    askedIds,
    questionCount: askedIds.filter((id) => id.startsWith(JAZ_PREFIX) || id === 'currentJobTitle').length,
    confidence: 0,
  }

  understanding.confidence = computeJazConfidence(understanding)
  return understanding
}

export function isLegacyGrowCareerComplete(state: CareerBrainState): boolean {
  const a = (state.answers ?? {}) as Record<string, unknown>
  const has = (id: string) => {
    const v = a[id]
    if (v === undefined || v === null) return false
    if (typeof v === 'string' && !v.trim()) return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }
  const field = String(a.cb_grow_field ?? '').trim()
  if (!field) return false
  if (field === 'other' && !has('cb_grow_field_other')) return false
  return (
    has('currentJobTitle') &&
    has('cb_grow_years') &&
    has('cb_grow_level') &&
    has('cb_grow_goal') &&
    has('cb_grow_blocker') &&
    has('cb_grow_study_willing') &&
    has('cb_grow_dev_time') &&
    has('cb_grow_leadership_ready') &&
    has('cb_grow_employer_change') &&
    has('coreSkills')
  )
}

export function isJazQuestioningComplete(state: CareerBrainState): boolean {
  if (isLegacyGrowCareerComplete(state)) return true
  const u = buildJazUnderstanding(state)
  if (!u.jobTitle) return false
  if (u.questionCount >= 10) return u.confidence >= 65
  if (u.questionCount >= 8 && u.confidence >= 72) return true
  return u.confidence >= 80 && u.questionCount >= 5
}

export function inferFieldSlugFromTrack(track: JazProfessionTrack, jobTitle: string): string {
  const map: Record<JazProfessionTrack, string> = {
    education: 'education',
    software: 'it',
    healthcare: 'healthcare',
    creative: 'creative_media',
    engineering: 'engineering',
    finance: 'finance',
    general: 'other',
  }
  if (map[track] !== 'other') return map[track]
  const t = jobTitle.toLowerCase()
  if (/market|brand|digital/.test(t)) return 'marketing'
  if (/construct|builder|trade/.test(t)) return 'construction'
  if (/logistic|warehouse|driver/.test(t)) return 'logistics'
  return 'other'
}
