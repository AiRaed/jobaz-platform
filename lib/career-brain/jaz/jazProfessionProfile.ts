/**
 * Structured profession profile — built from JAZ conversation evidence.
 */

import {
  getGrowCareerBlockers,
  labelGrowCareerExperienceYears,
  labelGrowCareerGoal,
  resolveGrowCareerCurrentJobTitle,
  resolveGrowCareerField,
} from '../growCareerPath'
import { buildJazUnderstanding } from './jazUnderstanding'
import type { JazProfessionTrack } from './jazTypes'
import { getProfessionTrack } from './jazProfessionProgression'
import type { CareerBrainState } from '../types'

export type JazProfessionProfile = {
  profession: string
  sector: string
  currentLevel: string
  experienceYears: string
  qualificationLevel: string
  responsibilities: string[]
  ambition: string
  barriers: string[]
  goal: string
  professionTrack: JazProfessionTrack
  confidence: number
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function arr(state: CareerBrainState, key: string): string[] {
  const raw = answers(state)[key]
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return [raw]
  return []
}

function labelQualification(track: JazProfessionTrack, state: CareerBrainState): string {
  switch (track) {
    case 'education':
      return str(state, 'jaz_edu_qualification').replace(/_/g, ' ') || 'No formal teaching qualification'
    case 'software':
      return str(state, 'jaz_tech_stack').replace(/_/g, ' ') || 'Stack not specified'
    case 'healthcare':
      return str(state, 'jaz_health_registration').replace(/_/g, ' ') || 'Registration status not specified'
    case 'finance':
      return str(state, 'jaz_fin_qualification').replace(/_/g, ' ') || 'Qualification not specified'
    case 'engineering':
      return str(state, 'jaz_eng_qualification').replace(/_/g, ' ') || 'Qualification not specified'
    case 'creative':
      return str(state, 'jaz_creative_portfolio').replace(/_/g, ' ') || 'Portfolio stage not specified'
    default:
      return str(state, 'jaz_role_responsibilities') || 'Role context captured'
  }
}

function labelAmbition(track: JazProfessionTrack, state: CareerBrainState): string {
  const progressionKeys = [
    'jaz_edu_progression',
    'jaz_tech_progression',
    'jaz_health_specialty',
    'jaz_eng_progression',
    'jaz_fin_progression',
    'jaz_creative_progression',
    'jaz_progression_target',
  ]
  for (const key of progressionKeys) {
    const val = str(state, key)
    if (val) return val.replace(/_/g, ' ')
  }
  return labelGrowCareerGoal(state)
}

function labelCurrentLevel(track: JazProfessionTrack, state: CareerBrainState): string {
  const seniorityKeys: Record<JazProfessionTrack, string> = {
    education: 'jaz_edu_seniority',
    software: 'jaz_tech_seniority',
    healthcare: 'jaz_health_band',
    creative: 'jaz_creative_seniority',
    engineering: 'jaz_eng_seniority',
    finance: 'jaz_fin_seniority',
    general: 'jaz_level',
  }
  const key = seniorityKeys[track]
  const raw = str(state, key) || str(state, 'cb_grow_level') || str(state, 'jaz_level')
  if (!raw) return resolveGrowCareerCurrentJobTitle(state)
  return raw.replace(/_/g, ' ')
}

function labelResponsibilities(track: JazProfessionTrack, state: CareerBrainState): string[] {
  if (track === 'education') {
    const labels: Record<string, string> = {
      sen: 'SEN / EHCP support',
      '1to1': '1:1 pupil support',
      small_group: 'Small group intervention',
      planning: 'Planning or delivering activities',
      behaviour: 'Behaviour support',
      admin: 'Classroom admin',
    }
    return arr(state, 'jaz_edu_responsibilities').map((v) => labels[v] ?? v.replace(/_/g, ' '))
  }
  const generic = str(state, 'jaz_role_responsibilities')
  return generic ? [generic] : []
}

function labelBarriers(state: CareerBrainState): string[] {
  const blockerLabels: Record<string, string> = {
    qualification: 'Missing qualifications',
    uk_exp: 'Limited UK experience evidence',
    technical_skills: 'Technical skills gap',
    leadership_exp: 'Limited leadership evidence',
    confidence: 'Confidence gap',
    limited_opportunities: 'Limited progression in current employer',
    weak_cv: 'CV / LinkedIn not aligned',
    not_sure: 'Unclear blocker',
  }
  return getGrowCareerBlockers(state)
    .filter((b) => b !== 'not_sure')
    .map((b) => blockerLabels[b] ?? b.replace(/_/g, ' '))
}

export function buildJazProfessionProfile(state: CareerBrainState): JazProfessionProfile | null {
  const u = buildJazUnderstanding(state)
  const profession = u.jobTitle ?? resolveGrowCareerCurrentJobTitle(state)
  if (!profession || profession === 'Professional') return null

  const track = getProfessionTrack(state)
  const confidence = u.confidence

  return {
    profession,
    sector: resolveGrowCareerField(state),
    currentLevel: labelCurrentLevel(track, state),
    experienceYears: labelGrowCareerExperienceYears(state),
    qualificationLevel: labelQualification(track, state),
    responsibilities: labelResponsibilities(track, state),
    ambition: labelAmbition(track, state),
    barriers: labelBarriers(state),
    goal: labelGrowCareerGoal(state),
    professionTrack: track,
    confidence,
  }
}

export function hasHighProfessionConfidence(profile: JazProfessionProfile | null): boolean {
  if (!profile) return false
  if (profile.professionTrack !== 'general' && profile.confidence >= 55) return true
  return profile.confidence >= 80
}
