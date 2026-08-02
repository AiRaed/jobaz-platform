/**
 * Unemployed pathway intelligence — scores experience vs education vs fast employment,
 * builds alternative paths, and enriches final output.
 */

import {
  getExperienceFieldText,
  getStudyFieldText,
  profileForPath,
  type CareerDirectionPriority,
  getCareerDirectionPriority,
} from './educationExperienceSplit'
import { buildFallbackRecommendations } from './fallbackRecommendations'
import { assembleCareerRoadmap } from './careerRoadmap'
import { applyGlobalRecommendationRules } from './globalPreferenceEngine'
import { applyUniversalCareerPathRules } from './universalCareerPath'
import { buildCertificationSuggestions } from './speedDevelopmentMode'
import { getFirstJobEducationLevel, isPostSecondaryEducation } from './firstJobEducationPath'
import { isHaveExperiencePath } from './experienceAssessment'
import {
  getExperienceYearsBand,
  isUnemployedPath,
} from './unemployedPath'
import type {
  CareerBrainOutput,
  CareerBrainRecommendation,
  CareerBrainState,
  CareerPathRole,
  CareerProfile,
} from './types'

export type UnemployedPathScores = {
  experience: number
  education: number
  fastEmployment: number
}

export type UnemployedAlternativePath = {
  label: string
  workNow: CareerPathRole[]
  buildNext: CareerPathRole[]
  longTerm: CareerPathRole[]
  summary: string
}

export type UnemployedIntelligenceOutput = {
  careerReadinessScore: number
  pathScores: UnemployedPathScores
  alternativeEducationPath: UnemployedAlternativePath | null
  alternativeExperiencePath: UnemployedAlternativePath | null
  recommendedCourses: string[]
  ukMarketNotes: string[]
  skillsToImprove: string[]
}

function toPathRole(rec: CareerBrainRecommendation): CareerPathRole {
  return {
    title: rec.title,
    why: rec.why,
    domain: rec.domain,
    source: rec.source,
    pathOrigin: rec.pathOrigin,
  }
}

function enrichRecs(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] {
  let next = assembleCareerRoadmap(recs, profile, state)
  next = applyGlobalRecommendationRules(next, profile, state)
  next = applyUniversalCareerPathRules(next, profile, state)
  return next
}

function toAlternative(
  label: string,
  recs: CareerBrainRecommendation[],
  summary: string
): UnemployedAlternativePath {
  return {
    label,
    summary,
    workNow: recs.filter((r) => r.track === 'work_now').slice(0, 3).map(toPathRole),
    buildNext: recs.filter((r) => r.track === 'build_next').slice(0, 3).map(toPathRole),
    longTerm: recs.filter((r) => r.track === 'long_term').slice(0, 3).map(toPathRole),
  }
}

function experienceYearsScore(state: CareerBrainState): number {
  const band = getExperienceYearsBand(state)
  switch (band) {
    case '10_plus':
      return 35
    case '5_10':
      return 28
    case '3_5':
      return 22
    case '1_3':
      return 15
    case 'under_1':
      return 8
    default:
      return isHaveExperiencePath(state) ? 10 : 0
  }
}

function ukExperienceScore(state: CareerBrainState): number {
  const country = String(state.answers?.cb_experience_country ?? '')
  if (country === 'mostly_uk') return 20
  if (country === 'both') return 12
  if (country === 'mostly_international') return 5
  return 0
}

function educationScore(state: CareerBrainState): number {
  const level = getFirstJobEducationLevel(state)
  if (!level || level === 'no_formal') return 0
  if (level === 'gcse_a_levels') return 8
  if (level === 'vocational' || level === 'diploma_college') return 14
  if (level === 'bachelors') return 22
  if (level === 'masters') return 28
  if (level === 'phd') return 30
  return 0
}

function trainingReadinessScore(state: CareerBrainState): number {
  return String(state.answers?.cb_cert_openness ?? '') === 'yes' ? 8 : 3
}

/** Score three pathway families before user priority is applied. */
export function scoreUnemployedPaths(
  state: CareerBrainState,
  profile: CareerProfile
): UnemployedPathScores {
  const expBase = isHaveExperiencePath(state)
    ? experienceYearsScore(state) + ukExperienceScore(state) + 15
    : 0
  const eduBase = educationScore(state) + (getStudyFieldText(state, profile) ? 8 : 0)
  const fastBase =
    20 +
    (profile.englishLevel === 'basic' ? 5 : 0) +
    (isHaveExperiencePath(state) ? 10 : 5)

  return {
    experience: Math.min(100, expBase),
    education: Math.min(100, eduBase),
    fastEmployment: Math.min(100, fastBase),
  }
}

function applyPriorityWeight(
  scores: UnemployedPathScores,
  priority: CareerDirectionPriority | null
): UnemployedPathScores {
  if (!priority) return scores
  const boost = 40
  const next = { ...scores }
  switch (priority) {
    case 'experience_field':
      next.experience += boost
      break
    case 'education_field':
      next.education += boost
      break
    case 'both':
      next.experience += 12
      next.education += 12
      break
    case 'fast_employment':
      next.fastEmployment += boost
      break
    case 'not_sure':
      break
  }
  return {
    experience: Math.min(100, next.experience),
    education: Math.min(100, next.education),
    fastEmployment: Math.min(100, next.fastEmployment),
  }
}

export function computeCareerReadinessScore(
  state: CareerBrainState,
  profile: CareerProfile,
  employabilityScore: number
): number {
  const scores = applyPriorityWeight(scoreUnemployedPaths(state, profile), getCareerDirectionPriority(state))
  const training = trainingReadinessScore(state)
  const uk = isHaveExperiencePath(state) ? ukExperienceScore(state) : 5
  const years = experienceYearsScore(state)
  const blended = Math.round(
    (scores.experience * 0.22 +
      scores.education * 0.18 +
      scores.fastEmployment * 0.12 +
      employabilityScore * 0.2 +
      years * 0.15 +
      uk * 0.08 +
      training) /
      1.05
  )
  return Math.max(0, Math.min(100, blended))
}

function buildUkMarketNotes(state: CareerBrainState, _profile: CareerProfile): string[] {
  const notes: string[] = [
    'UK employers in retail, logistics, hospitality, care, and office admin frequently hire entry-level staff nationwide.',
  ]
  if (String(state.answers?.cb_experience_country ?? '') === 'mostly_international') {
    notes.push('International experience is valued, but UK references and local work history strengthen applications.')
  }
  const band = getExperienceYearsBand(state)
  if (band === 'under_1' || band === '1_3') {
    notes.push('With limited years of experience, entry-level and assistant roles are the most realistic Work Now targets.')
  } else if (band === '5_10' || band === '10_plus') {
    notes.push('Your experience depth supports supervisor, coordinator, and team-leader Work Now options where relevant.')
  }
  if (isPostSecondaryEducation(getFirstJobEducationLevel(state)) && getCareerDirectionPriority(state) === 'experience_field') {
    notes.push('Your qualification remains an asset for the long term even when you prioritise experience-based roles now.')
  }
  return notes
}

function buildSkillsToImprove(state: CareerBrainState, profile: CareerProfile): string[] {
  const skills: string[] = []
  if (String(state.answers?.cb_cert_openness ?? '') === 'yes') {
    skills.push('Short UK certifications relevant to your target sector')
  }
  if (String(state.answers?.cb_experience_country ?? '') === 'mostly_international') {
    skills.push('UK work references and local employer familiarity')
  }
  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  if (study && exp && getCareerDirectionPriority(state) === 'both') {
    skills.push(`Bridge skills connecting ${exp} experience with ${study} studies`)
  }
  return [...new Set(skills)].slice(0, 5)
}

export function buildUnemployedIntelligence(
  profile: CareerProfile,
  state: CareerBrainState,
  employabilityScore: number
): UnemployedIntelligenceOutput | null {
  if (!isUnemployedPath(state)) return null

  const priority = getCareerDirectionPriority(state)
  const pathScores = applyPriorityWeight(scoreUnemployedPaths(state, profile), priority)
  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)

  let alternativeEducationPath: UnemployedAlternativePath | null = null
  let alternativeExperiencePath: UnemployedAlternativePath | null = null

  if (isHaveExperiencePath(state) && isPostSecondaryEducation(getFirstJobEducationLevel(state)) && study) {
    const eduProfile = profileForPath(profile, state, 'education')
    const eduRecs = enrichRecs(buildFallbackRecommendations(eduProfile, state).recommendations, eduProfile, state)
    alternativeEducationPath = toAlternative(
      `If you prioritised ${study}`,
      eduRecs,
      'Alternative route weighted toward your qualification rather than your previous job sector.'
    )
  }

  if (isHaveExperiencePath(state) && exp && priority !== 'experience_field') {
    const expProfile = profileForPath(profile, state, 'experience')
    const expRecs = enrichRecs(buildFallbackRecommendations(expProfile, state).recommendations, expProfile, state)
    alternativeExperiencePath = toAlternative(
      `If you prioritised ${exp} experience`,
      expRecs,
      'Alternative route weighted toward your work history rather than your degree field.'
    )
  }

  return {
    careerReadinessScore: computeCareerReadinessScore(state, profile, employabilityScore),
    pathScores,
    alternativeEducationPath,
    alternativeExperiencePath,
    recommendedCourses: buildCertificationSuggestions(profile, state),
    ukMarketNotes: buildUkMarketNotes(state, profile),
    skillsToImprove: buildSkillsToImprove(state, profile),
  }
}

export function buildUnemployedIntelligenceReasoning(
  intelligence: UnemployedIntelligenceOutput,
  priority: CareerDirectionPriority | null
): string[] {
  const lines = [
    `Path scoring — Experience ${intelligence.pathScores.experience}, Education ${intelligence.pathScores.education}, Fast employment ${intelligence.pathScores.fastEmployment} (before your stated priority).`,
    `Career readiness score: ${intelligence.careerReadinessScore}/100 — weighted by your priority, experience, education, UK experience, years worked, and training openness.`,
  ]
  if (priority === 'experience_field') {
    lines.push('Your priority weights experience highest — recommendations follow your work history, not your degree title alone.')
  } else if (priority === 'education_field') {
    lines.push('Your priority weights education highest — recommendations follow your qualification field.')
  } else if (priority === 'both') {
    lines.push('This route balances your existing work history and your academic background.')
  } else if (priority === 'fast_employment') {
    lines.push('Fastest employment priority — prestige and field alignment are secondary to realistic hiring speed.')
  }
  return lines
}

export function mergeUnemployedIntelligenceIntoOutput(
  output: CareerBrainOutput,
  intelligence: UnemployedIntelligenceOutput,
  state: CareerBrainState
): CareerBrainOutput {
  const priority = getCareerDirectionPriority(state)
  const reasoning = [
    ...output.reasoning,
    ...buildUnemployedIntelligenceReasoning(intelligence, priority),
    ...intelligence.ukMarketNotes.map((n) => `UK market: ${n}`),
  ]

  const missingSkills = [...new Set([...output.missingSkills, ...intelligence.skillsToImprove])]

  let whyThisPath = output.whyThisPath
  if (priority === 'both') {
    whyThisPath = `${whyThisPath}\n\nThis route balances your existing work history and your academic background.`
  } else if (priority === 'fast_employment') {
    whyThisPath = `${whyThisPath}\n\nFastest route into employment — roles chosen for realistic UK hiring speed.`
  }

  return {
    ...output,
    whyThisPath,
    reasoning,
    missingSkills,
    employabilityScore: output.employabilityScore,
    careerReadinessScore: intelligence.careerReadinessScore,
    pathScores: intelligence.pathScores,
    alternativeEducationPath: intelligence.alternativeEducationPath ?? undefined,
    alternativeExperiencePath: intelligence.alternativeExperiencePath ?? undefined,
    recommendedCourses: intelligence.recommendedCourses,
    ukMarketNotes: intelligence.ukMarketNotes,
  }
}
