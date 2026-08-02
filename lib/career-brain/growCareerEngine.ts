/**
 * Grow Career engine — dynamic progression from job title.
 */

import { applyGrowValidationRepairs, validateGrowCareerOutput } from './growCareerGrowValidation'
import { buildProfessionGrowRecommendations } from './growCareerProfessionRecommendations'
import { dedupeRecommendations } from './jaz/jazRecommendationDedup'
import { buildGrowCareerCoachAnalysis, type GrowCareerCoachAnalysis } from './growCareerCoachOutput'
import {
  buildCurrentPositionSummary,
  buildGrowthSummary,
  buildImmediateActions,
  buildRecommendedJobAZActions,
  buildSkillsGap,
  computeCareerGrowthScore,
  domainForGrowField,
  growthScoreLabel,
  identifyMainBarrier,
  inferDynamicProgression,
  normalizeGrowFieldSlug,
  normalizeGrowLevelSlug,
  suggestTrainingForRole,
  type GrowCareerFieldSlug,
  type GrowCareerLevelSlug,
  type GrowCareerScoreLabel,
  type MainBarrierLabel,
} from './growCareerGrowthAdvisor'
import { labelGrowCareerLevel, resolveGrowCareerCurrentJobTitle, resolveGrowCareerField } from './growCareerPath'
import type { CareerBrainRecommendation, CareerBrainState, CareerDomain, CareerProfile } from './types'

export type GrowCareerGrowthPlan = {
  field: string
  fieldSlug: GrowCareerFieldSlug
  currentJobTitle: string
  currentLevel: GrowCareerLevelSlug
  currentLevelLabel: string
  currentPositionSummary: string
  careerGrowthScore: number
  growthScoreLabel: GrowCareerScoreLabel
  mainBarrier: MainBarrierLabel
  strengths: string[]
  weaknesses: string[]
  summary: string
  nextRealisticStep: {
    role: string
    timeline: string
    reason: string
  }
  promotionRoadmap: {
    workNow: string
    buildNext: string
    longTerm: string
  }
  immediateActions: string[]
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
  recommendedJobAZActions: Array<{ action: string; label: string; href?: string }>
  employabilityScore: number
  coach: GrowCareerCoachAnalysis
}

function rec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: CareerDomain,
  options?: {
    stepType?: CareerBrainRecommendation['stepType']
  }
): CareerBrainRecommendation {
  return {
    title,
    why,
    track,
    field_tag: domain,
    domain,
    source: 'fallback',
    stepType: options?.stepType ?? 'career_step',
  }
}

function formatWorkNowWhy(jobTitle: string, strengths: string[], summary: string): string {
  return [
    `Why it fits: ${summary}`,
    `Your current strengths include ${strengths.slice(0, 3).join(', ')} — this is your baseline for promotion, not a career change.`,
    `What to do next: document impact in ${jobTitle} responsibilities before targeting the next level.`,
  ].join(' ')
}

function formatBuildNextWhy(role: string, reason: string, timeline: string): string {
  return [
    `Why it fits: ${reason}`,
    `Timeline: ${timeline}.`,
    `What to do next: build evidence employers expect for ${role} before applying.`,
  ].join(' ')
}

function formatLongTermWhy(role: string, buildNext: string, timeline: string, field: string): string {
  return [
    `Possible future direction: ${role} may become realistic after sustained performance in ${buildNext}.`,
    `Estimated timeline: ${timeline} with consistent performance and development — not guaranteed.`,
    `What to do next: treat ${role} as a medium-term aspiration when choosing training and project exposure.`,
  ].join(' ')
}

export function buildGrowCareerGrowthPlan(
  profile: CareerProfile,
  state: CareerBrainState
): GrowCareerGrowthPlan {
  const fieldSlug = normalizeGrowFieldSlug(state)
  const field = resolveGrowCareerField(state)
  const currentLevel = normalizeGrowLevelSlug(state)
  const currentLevelLabel = labelGrowCareerLevel(state)
  const currentJobTitle = resolveGrowCareerCurrentJobTitle(state)
  let progression = inferDynamicProgression(state)
  const skillsGap = buildSkillsGap(state)
  const careerGrowthScore = computeCareerGrowthScore(state)
  const scoreLabel = growthScoreLabel(careerGrowthScore)
  const mainBarrier = identifyMainBarrier(state)
  const summary = buildGrowthSummary(state, progression)
  const currentPositionSummary = buildCurrentPositionSummary(state)
  const immediateActions = buildImmediateActions(state, progression)
  const recommendedJobAZActions = buildRecommendedJobAZActions(state)
  const domain = domainForGrowField(fieldSlug)
  const training = suggestTrainingForRole(progression.buildNextTitle, state)
  const coach = buildGrowCareerCoachAnalysis(state)

  const professionRecs = buildProfessionGrowRecommendations(state, progression, fieldSlug)

  let workNow = professionRecs
    ? professionRecs.workNow.map((item) => rec(item.title, item.why, 'work_now', domain))
    : [
        rec(
          progression.workNowTitle,
          formatWorkNowWhy(progression.workNowTitle, skillsGap.strengths, currentPositionSummary),
          'work_now',
          domain
        ),
      ]

  let buildNextItems: CareerBrainRecommendation[] = professionRecs
    ? professionRecs.buildNext.map((item) =>
        rec(item.title, item.why, 'build_next', domain, {
          stepType: item.stepType ?? 'career_step',
        })
      )
    : [
        rec(
          progression.buildNextTitle,
          formatBuildNextWhy(
            progression.buildNextTitle,
            progression.nextStepReason,
            progression.nextStepTimeline
          ),
          'build_next',
          domain
        ),
        ...training.map((item) =>
          rec(
            item,
            `Supports your move to ${progression.buildNextTitle} while staying in the same profession.`,
            'build_next',
            domain,
            { stepType: 'training' }
          )
        ),
      ]

  let longTerm = professionRecs
    ? professionRecs.longTerm.map((item) => rec(item.title, item.why, 'long_term', domain))
    : [
        rec(
          progression.longTermTitle,
          formatLongTermWhy(
            progression.longTermTitle,
            progression.buildNextTitle,
            progression.longTermTimeline,
            field
          ),
          'long_term',
          domain
        ),
      ]

  const draftRecs = dedupeRecommendations([...workNow, ...buildNextItems, ...longTerm])
  const validation = validateGrowCareerOutput(state, progression, draftRecs)
  const repaired = applyGrowValidationRepairs(progression, draftRecs, validation)
  progression = repaired.progression
  const validatedRecs = repaired.recommendations
  workNow = validatedRecs.filter((r) => r.track === 'work_now')
  buildNextItems = validatedRecs.filter((r) => r.track === 'build_next')
  longTerm = validatedRecs.filter((r) => r.track === 'long_term')

  const employabilityScore = Math.max(
    55,
    Math.min(90, careerGrowthScore + (scoreLabel === 'Promotion Ready' ? 5 : 0))
  )

  return {
    field,
    fieldSlug,
    currentJobTitle,
    currentLevel,
    currentLevelLabel,
    currentPositionSummary,
    careerGrowthScore,
    growthScoreLabel: scoreLabel,
    mainBarrier,
    strengths: skillsGap.strengths,
    weaknesses: skillsGap.needsDevelopment,
    summary,
    nextRealisticStep: {
      role: progression.buildNextTitle,
      timeline: progression.nextStepTimeline,
      reason: progression.nextStepReason,
    },
    promotionRoadmap: {
      workNow: progression.workNowTitle,
      buildNext: progression.buildNextTitle,
      longTerm: progression.longTermTitle,
    },
    immediateActions,
    workNow,
    buildNext: buildNextItems.slice(0, 4),
    longTerm,
    recommendedJobAZActions,
    employabilityScore,
    coach,
  }
}

export function buildGrowCareerRecommendations(
  profile: CareerProfile,
  state: CareerBrainState
): {
  recommendations: CareerBrainRecommendation[]
  plan: GrowCareerGrowthPlan
  reasoning: string[]
} {
  const plan = buildGrowCareerGrowthPlan(profile, state)
  const recommendations = dedupeRecommendations([...plan.workNow, ...plan.buildNext, ...plan.longTerm])
  const reasoning = [
    `Grow career: ${plan.currentJobTitle} (${plan.currentLevelLabel}) → ${plan.nextRealisticStep.role}.`,
    `Growth score ${plan.careerGrowthScore}/100 (${plan.growthScoreLabel}).`,
    `Main barrier: ${plan.mainBarrier}.`,
    `Roadmap: ${plan.promotionRoadmap.workNow} → ${plan.promotionRoadmap.buildNext} → ${plan.promotionRoadmap.longTerm}.`,
  ]
  return { recommendations, plan, reasoning }
}
