/**
 * Evidence-based recommendation copy — references collected JAZ answers.
 */

import { getGrowCareerBlockers, labelGrowCareerExperienceYears, labelGrowCareerGoal, labelGrowCareerLevel } from './growCareerPath'
import type { DynamicProgression } from './growCareerGrowthAdvisor'
import type { JazProfessionTrack } from './jaz/jazTypes'
import type { CareerBrainState } from './types'

export type RecommendationConfidence = 'High' | 'Moderate' | 'Lower'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function arr(state: CareerBrainState, key: string): string[] {
  const raw = answers(state)[key]
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  return raw ? [String(raw)] : []
}

export function assessRecommendationConfidence(
  state: CareerBrainState,
  track: JazProfessionTrack
): RecommendationConfidence {
  let score = 0
  const years = str(state, 'jaz_years') || str(state, 'cb_grow_years')
  if (years && years !== 'not_sure') score += 2
  if (str(state, 'jaz_job_title') || str(state, 'currentJobTitle')) score += 2

  const blockers = getGrowCareerBlockers(state).filter((b) => b !== 'not_sure')
  if (blockers.length) score += 1

  if (track === 'software') {
    if (str(state, 'jaz_tech_stack')) score += 2
    if (str(state, 'jaz_tech_architecture')) score += 1
    if (str(state, 'jaz_tech_progression')) score += 2
  }
  if (track === 'education') {
    if (str(state, 'jaz_edu_qualification')) score += 2
    if (arr(state, 'jaz_edu_responsibilities').length) score += 2
    if (str(state, 'jaz_edu_progression')) score += 1
  }
  if (track === 'healthcare') {
    if (str(state, 'jaz_health_registration')) score += 2
    if (str(state, 'jaz_health_specialty')) score += 1
    if (str(state, 'jaz_health_sector')) score += 1
  }

  if (years === '0_1' && blockers.includes('qualification')) return 'Lower'
  if (score >= 7) return 'High'
  if (score >= 4) return 'Moderate'
  return 'Lower'
}

function formatBlockers(state: CareerBrainState): string {
  const labels: Record<string, string> = {
    qualification: 'missing qualifications',
    uk_exp: 'limited UK experience evidence',
    technical_skills: 'technical depth gaps',
    leadership_exp: 'limited leadership evidence',
    confidence: 'confidence in applications',
    limited_opportunities: 'limited internal progression',
    weak_cv: 'CV alignment gaps',
  }
  return getGrowCareerBlockers(state)
    .filter((b) => b !== 'not_sure')
    .map((b) => labels[b] ?? b.replace(/_/g, ' '))
    .slice(0, 2)
    .join(' and ')
}

function softwareEvidence(state: CareerBrainState): string[] {
  const parts: string[] = []
  const stack = str(state, 'jaz_tech_stack').replace(/_/g, ' ')
  const arch = str(state, 'jaz_tech_architecture').replace(/_/g, ' ')
  const progression = str(state, 'jaz_tech_progression').replace(/_/g, ' ')
  if (stack) parts.push(`${stack} stack`)
  parts.push(`${labelGrowCareerExperienceYears(state)} experience`)
  parts.push(`${labelGrowCareerLevel(state)} level`)
  if (arch) parts.push(`${arch} architecture exposure`)
  if (progression) parts.push(`${progression} progression goal`)
  const blockers = formatBlockers(state)
  if (blockers) parts.push(`blockers: ${blockers}`)
  return parts
}

function educationEvidence(state: CareerBrainState): string[] {
  const parts: string[] = []
  const qual = str(state, 'jaz_edu_qualification').replace(/_/g, ' ')
  const resp = arr(state, 'jaz_edu_responsibilities').map((r) => r.replace(/_/g, ' '))
  const progression = str(state, 'jaz_edu_progression').replace(/_/g, ' ')
  parts.push(`${labelGrowCareerExperienceYears(state)} in schools`)
  if (qual) parts.push(`${qual} qualification status`)
  if (resp.length) parts.push(`responsibilities: ${resp.slice(0, 2).join(', ')}`)
  if (progression) parts.push(`${progression} progression goal`)
  const blockers = formatBlockers(state)
  if (blockers) parts.push(`blockers: ${blockers}`)
  return parts
}

function healthcareEvidence(state: CareerBrainState): string[] {
  const parts: string[] = []
  const reg = str(state, 'jaz_health_registration').replace(/_/g, ' ')
  const specialty = str(state, 'jaz_health_specialty').replace(/_/g, ' ')
  const sector = str(state, 'jaz_health_sector').replace(/_/g, ' ')
  parts.push(`${labelGrowCareerExperienceYears(state)} in UK care`)
  if (reg) parts.push(`${reg} registration status`)
  if (specialty) parts.push(`${specialty} clinical area`)
  if (sector) parts.push(`${sector} sector`)
  const blockers = formatBlockers(state)
  if (blockers) parts.push(`blockers: ${blockers}`)
  return parts
}

export function buildEvidencePhrase(state: CareerBrainState, track: JazProfessionTrack): string {
  const parts =
    track === 'software'
      ? softwareEvidence(state)
      : track === 'education'
        ? educationEvidence(state)
        : track === 'healthcare'
          ? healthcareEvidence(state)
          : [
              `${labelGrowCareerExperienceYears(state)} experience`,
              `${labelGrowCareerLevel(state)} level`,
              `${labelGrowCareerGoal(state)} goal`,
            ]
  return `You reported ${parts.join(', ')}.`
}

export function buildWorkNowWhy(
  state: CareerBrainState,
  track: JazProfessionTrack,
  title: string,
  roleType: string
): string {
  const confidence = assessRecommendationConfidence(state, track)
  return [
    `${roleType} — ${buildEvidencePhrase(state, track)}`,
    `This is an immediate, realistic ${track === 'software' ? 'software engineering' : track === 'education' ? 'UK school' : track === 'healthcare' ? 'UK care' : 'profession'} role based on your current evidence.`,
    `Confidence: ${confidence}.`,
  ].join(' ')
}

export function buildBuildNextWhy(
  state: CareerBrainState,
  track: JazProfessionTrack,
  progression: DynamicProgression
): string {
  const confidence = assessRecommendationConfidence(state, track)
  return [
    buildEvidencePhrase(state, track),
    `Your most realistic next step is ${progression.buildNextTitle} — the immediate next rung on your profession ladder, not a long-term aspiration.`,
    progression.nextStepReason,
    `Confidence: ${confidence}.`,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildLongTermWhy(
  state: CareerBrainState,
  track: JazProfessionTrack,
  progression: DynamicProgression
): string {
  const confidence = assessRecommendationConfidence(state, track)
  const aspiration = progression.longTermTitle
  return [
    `Possible future direction: ${aspiration} may become realistic after sustained performance in ${progression.buildNextTitle} and further evidence.`,
    buildEvidencePhrase(state, track),
    `This is not guaranteed — it depends on qualifications, experience, and employer opportunities.`,
    `Confidence: ${confidence}.`,
  ].join(' ')
}
