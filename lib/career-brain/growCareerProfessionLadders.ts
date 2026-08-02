/**
 * Realistic UK progression ladders — Build Next is always the immediate next rung.
 */

import type { CareerBrainState } from './types'

export type LadderPick = {
  workNowTitle: string
  buildNextTitle: string
  longTermTitle: string
  ladderSummary: string
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function pickFromLadder(ladder: string[], index: number): LadderPick {
  const clamped = Math.max(0, Math.min(index, ladder.length - 1))
  const workNow = ladder[clamped]!
  const buildNext = ladder[Math.min(clamped + 1, ladder.length - 1)]!
  const longTerm = ladder[Math.min(clamped + 2, ladder.length - 1)]!
  return {
    workNowTitle: workNow,
    buildNextTitle: buildNext === workNow ? ladder[Math.min(clamped + 1, ladder.length - 1)]! : buildNext,
    longTermTitle: longTerm === buildNext ? ladder[Math.min(clamped + 3, ladder.length - 1)]! : longTerm,
    ladderSummary: ladder.join(' → '),
  }
}

export function isSoftwareManagementTrack(state: CareerBrainState): boolean {
  const progression = str(state, 'jaz_tech_progression')
  const goal = str(state, 'jaz_goal') || str(state, 'cb_grow_goal')
  if (progression === 'engineering_manager') return true
  if (goal === 'leadership' && progression !== 'senior_ic' && progression !== 'specialist') {
    return progression === 'tech_lead'
  }
  return false
}

export function isSoftwareIcTrack(state: CareerBrainState): boolean {
  const progression = str(state, 'jaz_tech_progression')
  return (
    progression === 'senior_ic' ||
    progression === 'specialist' ||
    progression === 'product' ||
    (!progression && !isSoftwareManagementTrack(state))
  )
}

const SOFTWARE_IC_LADDER = [
  'Junior Developer',
  'Mid-Level Developer',
  'Senior Developer',
  'Staff Engineer',
  'Principal Engineer / Architect',
]

const SOFTWARE_MGMT_LADDER = [
  'Junior Developer',
  'Mid-Level Developer',
  'Tech Lead',
  'Engineering Manager',
  'Head of Engineering',
]

const EDUCATION_LADDER = [
  'Teaching Assistant',
  'Level 3 Teaching Assistant',
  'HLTA',
  'Cover Supervisor',
  'SEN Lead / Pastoral Lead',
  'School Leadership',
]

const HEALTHCARE_UNREGISTERED_LADDER = [
  'Care Assistant',
  'Senior Care Assistant',
  'Team Leader (Care)',
  'Care Coordinator',
  'Registered pathway (Nursing Associate / Nurse training)',
]

const HEALTHCARE_NMC_LADDER = [
  'Healthcare Assistant',
  'Band 5 Nurse',
  'Band 6 Nurse',
  'Band 7 Clinical Lead',
  'Matron / Advanced Clinical Practitioner',
]

function resolveSoftwareLadderIndex(state: CareerBrainState, jobTitle: string): number {
  const seniority = str(state, 'jaz_tech_seniority')
  const title = jobTitle.toLowerCase()
  if (seniority === 'staff' || /staff engineer|principal/i.test(title)) return 3
  if (seniority === 'senior' || /senior developer|senior engineer/i.test(title)) return 2
  if (seniority === 'mid' || /mid[- ]?level/i.test(title)) return 1
  if (seniority === 'lead' || /tech lead|team lead/i.test(title)) {
    return isSoftwareManagementTrack(state) ? 2 : 2
  }
  if (seniority === 'graduate' || /junior|graduate/i.test(title)) return 0
  if (/developer|engineer|programmer/i.test(title) && !/junior|senior|staff|lead/i.test(title)) return 1
  return 0
}

export function pickSoftwareLadder(state: CareerBrainState, jobTitle: string): LadderPick {
  const ladder = isSoftwareManagementTrack(state) ? SOFTWARE_MGMT_LADDER : SOFTWARE_IC_LADDER
  const index = resolveSoftwareLadderIndex(state, jobTitle)
  const pick = pickFromLadder(ladder, index)
  if (pick.buildNextTitle === pick.workNowTitle) {
    pick.buildNextTitle = ladder[Math.min(index + 1, ladder.length - 1)]!
  }
  if (isSoftwareIcTrack(state)) {
    if (/engineering manager|head of engineering|director of engineering/i.test(pick.buildNextTitle)) {
      pick.buildNextTitle = ladder[Math.min(index + 1, ladder.length - 1)]!
    }
    if (/engineering manager|head of engineering|director/i.test(pick.longTermTitle)) {
      pick.longTermTitle = 'Staff Engineer / Architect'
    }
  }
  pick.ladderSummary = ladder.join(' → ')
  return pick
}

function resolveEducationLadderIndex(state: CareerBrainState, jobTitle: string): number {
  const qual = str(state, 'jaz_edu_qualification')
  const seniority = str(state, 'jaz_edu_seniority')
  const title = jobTitle.toLowerCase()

  if (/head|deputy|assistant head/i.test(title) || seniority === 'leadership') return 5
  if (/cover supervisor/i.test(title)) return 3
  if (/hlta|higher level teaching assistant/i.test(title) || qual === 'hlta' || seniority === 'hlta') return 2
  if (qual === 'level3_ta' || seniority === 'level3_ta' || /level 3/i.test(title)) return 1
  if (qual === 'qts' || /qualified teacher/i.test(title)) return 4
  return 0
}

export function pickEducationLadder(state: CareerBrainState, jobTitle: string): LadderPick {
  const index = resolveEducationLadderIndex(state, jobTitle)
  const pick = pickFromLadder(EDUCATION_LADDER, index)
  const progression = str(state, 'jaz_edu_progression')
  if (progression === 'leadership' && index < 4) {
    pick.longTermTitle = 'SEN Lead / Pastoral Lead → School Leadership (possible future direction)'
  } else if (progression === 'teacher') {
    pick.longTermTitle = 'Cover Supervisor → Teacher Training (QTS) pathway'
  } else if (progression === 'specialist') {
    pick.longTermTitle = 'SEN Lead / Inclusion Lead (possible future direction)'
  }
  pick.ladderSummary = EDUCATION_LADDER.join(' → ')
  return pick
}

function resolveHealthcareLadderIndex(state: CareerBrainState, jobTitle: string): number {
  const registration = str(state, 'jaz_health_registration')
  const band = str(state, 'jaz_health_band')
  const title = jobTitle.toLowerCase()

  if (registration === 'nmc' || /nurse|midwife/i.test(title)) {
    if (band === 'band6' || /band 6/i.test(title)) return 2
    if (band === 'band7' || /band 7|matron/i.test(title)) return 3
    return 1
  }
  if (/coordinator|team leader/i.test(title)) return 3
  if (/senior (care|hca|support)/i.test(title)) return 1
  if (/care assistant|support worker|hca/i.test(title) || registration === 'unregistered') return 0
  return 0
}

export function pickHealthcareLadder(state: CareerBrainState, jobTitle: string): LadderPick {
  const registration = str(state, 'jaz_health_registration')
  const ladder =
    registration === 'nmc' || /nurse|midwife/i.test(jobTitle)
      ? HEALTHCARE_NMC_LADDER
      : HEALTHCARE_UNREGISTERED_LADDER
  const index = resolveHealthcareLadderIndex(state, jobTitle)
  const pick = pickFromLadder(ladder, index)
  pick.ladderSummary = ladder.join(' → ')
  return pick
}

export function getProfessionLadderSummary(track: string, state: CareerBrainState, jobTitle: string): string {
  switch (track) {
    case 'software':
      return pickSoftwareLadder(state, jobTitle).ladderSummary
    case 'education':
      return pickEducationLadder(state, jobTitle).ladderSummary
    case 'healthcare':
      return pickHealthcareLadder(state, jobTitle).ladderSummary
    default:
      return ''
  }
}
