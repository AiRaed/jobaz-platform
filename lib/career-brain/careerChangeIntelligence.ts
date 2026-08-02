/**
 * Career Change intelligence — merges transition plan into CareerBrainOutput.
 */

import {
  buildCareerChangeRecommendations,
  type CareerChangeTransitionPlan,
} from './careerChangeEngine'
import {
  buildCareerChangePathReasoning,
  isCareerChangePath,
  isCareerChangePathComplete,
} from './careerChangePath'
import type { CareerBrainOutput, CareerBrainState, CareerChangeTransitionOutput, CareerProfile } from './types'

export function buildCareerChangeIntelligence(
  profile: CareerProfile,
  state: CareerBrainState
): {
  plan: CareerChangeTransitionPlan
  transition: CareerChangeTransitionOutput
  recommendations: ReturnType<typeof buildCareerChangeRecommendations>['recommendations']
  reasoning: string[]
} | null {
  if (!isCareerChangePath(state) || !isCareerChangePathComplete(state)) return null

  const { recommendations, plan, reasoning } = buildCareerChangeRecommendations(profile, state)

  const transition: CareerChangeTransitionOutput = {
    currentField: plan.currentField,
    targetField: plan.targetField,
    transitionDifficulty: plan.transitionDifficulty,
    difficultyScore: plan.difficultyScore,
    estimatedTimeline: plan.estimatedTimeline,
    confidenceScore: plan.confidenceScore,
    transitionReadinessScore: plan.transitionReadinessScore,
    transitionReadinessSummary: plan.transitionReadinessSummary,
    transferableSkills: plan.transferableSkills,
    fastestRouteSummary: plan.fastestRouteSummary,
    recommendedTraining: plan.recommendedTraining,
    timelinePhases: plan.timelinePhases,
    buildNextPath: plan.buildNextPath,
    summary: plan.summary,
    realityCheck: plan.realityCheck,
    routeType: plan.routeType,
  }

  return { plan, transition, recommendations, reasoning }
}

export function mergeCareerChangeIntelligenceIntoOutput(
  output: CareerBrainOutput,
  intelligence: NonNullable<ReturnType<typeof buildCareerChangeIntelligence>>,
  state: CareerBrainState
): CareerBrainOutput {
  const { transition, plan } = intelligence

  const timelineBlock = transition.timelinePhases
    .map((p) => `${p.period} — ${p.label}: ${p.description}`)
    .join('\n')

  const whyThisPath = [
    'Summary',
    transition.summary,
    '',
    `Transition difficulty: ${transition.transitionDifficulty}`,
    `Transition readiness: ${transition.transitionReadinessScore}/100 — ${transition.transitionReadinessSummary}`,
    '',
    'Transferable Skills You Already Have',
    ...transition.transferableSkills.map((s) => `• ${s}`),
    '',
    'Reality Check',
    transition.realityCheck,
    '',
    'Estimated Transition Timeline',
    timelineBlock,
    '',
    `${transition.buildNextPath.pathLabel}`,
    `Next role target: ${transition.buildNextPath.intermediateRole}`,
    ...transition.buildNextPath.milestones.map((m) => `• ${m.title} — ${m.description}`),
  ].join('\n')

  return {
    ...output,
    careerProfile: {
      ...output.careerProfile,
      transferableSkills: plan.transferableSkills,
      workExperienceField: plan.currentField,
      targetField: plan.targetField,
      wantsCareerChange: true,
      constraints: [...new Set([...output.careerProfile.constraints, 'career-change-path', 'employed-transition'])],
    },
    recommendedPaths: {
      workNow: plan.workNow.slice(0, 3),
      buildNext: plan.buildNext.slice(0, 5),
      longTerm: plan.longTerm.slice(0, 3),
      backupIncome: [],
    },
    whyThisPath,
    personalizedSummary: transition.summary,
    employabilityScore: transition.confidenceScore,
    recommendedCourses: transition.recommendedTraining,
    careerChangeTransition: transition,
    englishDevelopmentPlan: null,
    rightToWorkGuidance: '',
    reasoning: [...output.reasoning, ...buildCareerChangePathReasoning(output.careerProfile, state)],
  }
}

export function getCareerChangeDeterministicResult(
  profile: CareerProfile,
  state: CareerBrainState
): {
  recommendations: ReturnType<typeof buildCareerChangeRecommendations>['recommendations']
  reasoning: string[]
  extraConstraints: string[]
} | null {
  const intelligence = buildCareerChangeIntelligence(profile, state)
  if (!intelligence) return null
  return {
    recommendations: intelligence.recommendations,
    reasoning: intelligence.reasoning,
    extraConstraints: ['career-change-path', 'employed-transition'],
  }
}
