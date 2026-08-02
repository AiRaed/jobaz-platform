/**
 * JAZ Side Income — build understanding and confidence from si_ answers.
 */

import type { CareerBrainState } from '../types'
import type { SideIncomeUnderstanding } from './sideIncomeTypes'

export const SI_PREFIX = 'si_'

export function isSideIncomeAnswerKey(id: string): boolean {
  return id.startsWith(SI_PREFIX)
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, ...keys: string[]): string | null {
  for (const key of keys) {
    const raw = answers(state)[key]
    if (raw === undefined || raw === null) continue
    const val = String(raw).trim()
    if (val) return val
  }
  return null
}

function arr(state: CareerBrainState, ...keys: string[]): string[] {
  for (const key of keys) {
    const raw = answers(state)[key]
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
    if (typeof raw === 'string' && raw.trim()) return [raw]
  }
  return []
}

export function getSideIncomeAnswerIds(state: CareerBrainState): string[] {
  const keys = Object.keys(answers(state)).filter((k) => k.startsWith(SI_PREFIX))
  const asked = (state.career_brain_asked ?? []).filter((k) => k.startsWith(SI_PREFIX))
  return [...new Set([...keys, ...asked])]
}

export function computeSideIncomeConfidence(u: SideIncomeUnderstanding): number {
  let score = 0
  if (u.employment) score += 12
  if (u.monthlyGoal) score += 10
  if (u.hoursPerWeek) score += 12
  if (u.schedule) score += 10
  if (u.mainField) score += 8
  if (u.skills.length) score += Math.min(14, u.skills.length * 4)
  if (u.assets.length) score += Math.min(12, u.assets.length * 3)
  if (u.workStyle.physicalVsDesk) score += 6
  if (u.workStyle.homeVsOutside) score += 6
  if (u.workStyle.peopleVsIndependent) score += 6
  if (u.riskTolerance) score += 8
  if (u.incomeTimeline) score += 10
  if (u.workStyle.scheduleFlex) score += 4
  return Math.min(100, score)
}

export function buildSideIncomeUnderstanding(state: CareerBrainState): SideIncomeUnderstanding {
  const employment =
    str(state, 'si_employment', 'cb_side_job_profile') ?? null
  const assets = arr(state, 'si_assets')
  const skills = arr(state, 'si_skills')
  const mainField = str(state, 'si_main_field', 'si_professional_field') ?? null
  const teachingExp =
    skills.includes('teaching') ||
    skills.includes('tutoring') ||
    /teach|tutor|education|classroom/i.test(mainField ?? '')

  const understanding: SideIncomeUnderstanding = {
    employment,
    monthlyGoal: str(state, 'si_monthly_goal'),
    hoursPerWeek: str(state, 'si_hours_week', 'cb_side_hours_week'),
    schedule: str(state, 'si_schedule', 'cb_side_schedule'),
    mainField,
    skills,
    assets,
    workStyle: {
      physicalVsDesk: str(state, 'si_work_physical'),
      homeVsOutside: str(state, 'si_work_location'),
      peopleVsIndependent: str(state, 'si_work_people'),
      scheduleFlex: str(state, 'si_schedule_flex'),
    },
    riskTolerance: str(state, 'si_risk_tolerance'),
    incomeTimeline: str(state, 'si_income_timeline'),
    teachingExperience: teachingExp,
    professionalField: str(state, 'si_professional_field'),
    hasCar: assets.includes('car') || assets.includes('van'),
    hasComputer: assets.includes('computer') || assets.includes('laptop'),
    hasHomeWorkspace: assets.includes('home_workspace'),
    hasCapital: assets.includes('capital') || assets.includes('savings'),
    hasDrivingLicence: assets.includes('driving_licence') || assets.includes('car'),
    askedIds: getSideIncomeAnswerIds(state),
    questionCount: getSideIncomeAnswerIds(state).length,
    confidence: 0,
  }

  understanding.confidence = computeSideIncomeConfidence(understanding)
  return understanding
}

export function isSideIncomeQuestioningComplete(state: CareerBrainState): boolean {
  const u = buildSideIncomeUnderstanding(state)
  if (u.confidence >= 80) return true
  if (u.questionCount >= 8 && u.confidence >= 72) return true
  return false
}

export function isLegacySideIncomeComplete(state: CareerBrainState): boolean {
  const a = answers(state)
  return (
    Boolean(a.cb_side_hours_week) &&
    Boolean(a.cb_side_schedule) &&
    Boolean(a.cb_side_income_intent) &&
    !Object.keys(a).some((k) => k.startsWith(SI_PREFIX))
  )
}
