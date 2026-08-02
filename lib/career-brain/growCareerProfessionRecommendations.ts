/**
 * Profession-specific grow-career recommendations — isolated vocabulary, evidence-based copy.
 */

import {
  buildBuildNextWhy,
  buildLongTermWhy,
  buildWorkNowWhy,
} from './growCareerEvidenceReasoning'
import { buildEducationGrowRecommendations } from './growCareerEducationRecommendations'
import type { DynamicProgression } from './growCareerGrowthAdvisor'
import { domainForGrowField, type GrowCareerFieldSlug } from './growCareerGrowthAdvisor'
import { dedupeRoleTitles } from './jaz/jazRecommendationDedup'
import { getProfessionTrack } from './jaz/jazProfessionProgression'
import type { JazProfessionTrack } from './jaz/jazTypes'
import type { CareerBrainRecommendation, CareerBrainState } from './types'

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function rec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: ReturnType<typeof domainForGrowField>,
  stepType?: CareerBrainRecommendation['stepType']
): CareerBrainRecommendation {
  return {
    title,
    why,
    track,
    field_tag: domain,
    domain,
    source: 'fallback',
    stepType: stepType ?? 'career_step',
  }
}

function stackWorkNowRoles(state: CareerBrainState, currentTitle: string): string[] {
  const stack = str(state, 'jaz_tech_stack')
  const title = currentTitle.toLowerCase()
  const isJunior = /junior|graduate/i.test(title) || str(state, 'jaz_tech_seniority') === 'graduate'

  const prefix = isJunior ? 'Junior ' : ''
  switch (stack) {
    case 'javascript':
      return dedupeRoleTitles([
        currentTitle,
        `${prefix}Frontend Developer`,
        `${prefix}Full Stack Developer`,
        'React Developer',
        'Web Developer',
      ])
    case 'python':
      return dedupeRoleTitles([currentTitle, `${prefix}Python Developer`, 'Backend Developer', 'Data Engineer (junior)'])
    case 'java':
      return dedupeRoleTitles([currentTitle, `${prefix}Java Developer`, 'Backend Developer', 'Kotlin Developer'])
    case 'csharp':
      return dedupeRoleTitles([currentTitle, `${prefix}.NET Developer`, 'C# Developer', 'Backend Developer'])
    case 'php':
      return dedupeRoleTitles([currentTitle, `${prefix}PHP Developer`, 'Web Developer', 'Backend Developer'])
    case 'mobile':
      return dedupeRoleTitles([currentTitle, 'iOS Developer', 'Android Developer', 'Mobile App Developer'])
    case 'data':
      return dedupeRoleTitles([currentTitle, 'Data Analyst', 'SQL Developer', 'Junior Data Engineer'])
    default:
      return dedupeRoleTitles([
        currentTitle,
        `${prefix}Software Developer`,
        `${prefix}Full Stack Developer`,
        'Web Developer',
      ])
  }
}

function healthcareWorkNowRoles(state: CareerBrainState, currentTitle: string): string[] {
  const registration = str(state, 'jaz_health_registration')
  const specialty = str(state, 'jaz_health_specialty')
  const title = currentTitle.toLowerCase()

  if (registration === 'nmc' || /nurse/i.test(title)) {
    return dedupeRoleTitles([currentTitle, 'Staff Nurse', 'Registered Nurse', 'Clinical Nurse'])
  }

  const roles = [currentTitle, 'Care Assistant', 'Support Worker', 'Senior Care Assistant']
  if (specialty === 'mental_health') {
    roles.push('Mental Health Support Worker')
  } else if (specialty === 'elderly') {
    roles.push('Domiciliary Care Worker')
  }
  return dedupeRoleTitles(roles).slice(0, 4)
}

function buildSoftwareGrowRecommendations(
  state: CareerBrainState,
  progression: DynamicProgression
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const domain = domainForGrowField('it')
  const track: JazProfessionTrack = 'software'
  const workNowTitles = stackWorkNowRoles(state, progression.workNowTitle).slice(0, 4)
  const roleTypes = ['Current role', 'Closely related role', 'Alternative realistic role', 'Adjacent role']

  return {
    workNow: workNowTitles.map((title, i) =>
      rec(title, buildWorkNowWhy(state, track, title, roleTypes[i] ?? 'Related role'), 'work_now', domain)
    ),
    buildNext: [
      rec(progression.buildNextTitle, buildBuildNextWhy(state, track, progression), 'build_next', domain),
    ],
    longTerm: [
      rec(
        progression.longTermTitle,
        buildLongTermWhy(state, track, progression),
        'long_term',
        domain
      ),
    ],
  }
}

function buildHealthcareGrowRecommendations(
  state: CareerBrainState,
  progression: DynamicProgression
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const domain = domainForGrowField('healthcare')
  const track: JazProfessionTrack = 'healthcare'
  const workNowTitles = healthcareWorkNowRoles(state, progression.workNowTitle).slice(0, 4)
  const roleTypes = ['Current role', 'Closely related role', 'Alternative realistic role', 'Adjacent role']

  return {
    workNow: workNowTitles.map((title, i) =>
      rec(title, buildWorkNowWhy(state, track, title, roleTypes[i] ?? 'Related role'), 'work_now', domain)
    ),
    buildNext: [
      rec(progression.buildNextTitle, buildBuildNextWhy(state, track, progression), 'build_next', domain),
    ],
    longTerm: [
      rec(
        progression.longTermTitle,
        buildLongTermWhy(state, track, progression),
        'long_term',
        domain
      ),
    ],
  }
}

export function buildProfessionGrowRecommendations(
  state: CareerBrainState,
  progression: DynamicProgression,
  fieldSlug?: GrowCareerFieldSlug
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} | null {
  const track = getProfessionTrack(state)

  if (track === 'education' || fieldSlug === 'education') {
    return buildEducationGrowRecommendations(state, progression)
  }
  if (track === 'software' || fieldSlug === 'it') {
    return buildSoftwareGrowRecommendations(state, progression)
  }
  if (track === 'healthcare' || fieldSlug === 'healthcare') {
    return buildHealthcareGrowRecommendations(state, progression)
  }
  return null
}
