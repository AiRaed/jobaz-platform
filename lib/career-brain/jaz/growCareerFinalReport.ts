/**
 * Grow career final report — 10-section advisor output from JAZ profile evidence.
 */

import type { DynamicProgression } from '../growCareerGrowthAdvisor'
import {
  buildEducationProgressionRoutes,
  buildEducationQualificationRecommendation,
  buildLongTermLeadershipDisclaimer,
  type EducationProgressionRoute,
} from '../growCareerEducationProgressionRoutes'
import { labelGrowCareerGoal } from '../growCareerPath'
import { describeExperienceRole, describeExperienceRoleLower } from './growCareerExperienceLabels'
import type { CareerConfidenceLabel, JazInternalAnalysis } from './jazInternalAnalysis'
import type { JazProfessionProfile } from './jazProfessionProfile'
import type { CareerBrainState } from '../types'

export type GrowCareerFinalReport = {
  careerSummary: string
  careerReasoning: string
  strengths: string[]
  gaps: string[]
  workNow: string
  buildNext: string
  longTermPath: string
  progressionRoutes: EducationProgressionRoute[]
  recommendedQualifications: string[]
  recommendedQualification?: { qualification: string; reason: string }
  longTermRequirements: string
  next90DayPlan: string[]
  salaryProgressionEstimate: string
  confidenceScore: number
  confidenceExplanation: string
  careerConfidenceScore: number
  careerConfidenceLabel: CareerConfidenceLabel
}

function strList(items: string[], fallback: string): string[] {
  return items.length ? items : [fallback]
}

export function buildCareerReasoningNarrative(
  profile: JazProfessionProfile,
  progression: DynamicProgression,
  analysis: JazInternalAnalysis,
  state: CareerBrainState
): string {
  const rolePhrase = describeExperienceRoleLower(state)
  const mainBarrier = profile.barriers[0] ?? 'progression gaps'
  const ambition = profile.ambition.replace(/_/g, ' ')

  const nextStepContext =
    profile.professionTrack === 'education'
      ? `building classroom responsibility and recognised progression inside ${profile.sector}`
      : profile.professionTrack === 'software'
        ? `deepening technical delivery and architecture evidence inside ${profile.sector}`
        : profile.professionTrack === 'healthcare'
          ? `building clinical responsibility and UK care evidence inside ${profile.sector}`
          : `recognised progression inside ${profile.sector}`

  return [
    `You currently work as a ${rolePhrase} and are interested in ${ambition || labelGrowCareerGoal(state)} over the longer term.`,
    profile.qualificationLevel.toLowerCase().includes('none') || profile.barriers.some((b) => /qualification/i.test(b))
      ? `Based on current evidence, your biggest constraint is ${mainBarrier.toLowerCase()}.`
      : `Based on current evidence, your main focus is ${mainBarrier.toLowerCase()}.`,
    `Your most realistic next step is ${progression.buildNextTitle} — ${nextStepContext} before targeting senior roles.`,
    `A possible future direction is ${progression.longTermTitle}, if qualifications and experience are gained — not guaranteed.`,
    analysis.promotionReadinessExplanation,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildGrowCareerFinalReport(params: {
  profile: JazProfessionProfile
  progression: DynamicProgression
  analysis: JazInternalAnalysis
  state: CareerBrainState
  strengths: string[]
  gaps: string[]
  recommendedQualifications: string[]
  actionPlan90Days: string[]
  salaryProgressionEstimate: string
}): GrowCareerFinalReport {
  const {
    profile,
    progression,
    analysis,
    state,
    strengths,
    gaps,
    recommendedQualifications,
    actionPlan90Days,
    salaryProgressionEstimate,
  } = params

  const rolePhrase = describeExperienceRole(state)
  const careerReasoning = buildCareerReasoningNarrative(profile, progression, analysis, state)
  const progressionRoutes =
    profile.professionTrack === 'education'
      ? buildEducationProgressionRoutes(state, progression)
      : []
  const qualRecommendation = buildEducationQualificationRecommendation(state)
  const longTermRequirements = buildLongTermLeadershipDisclaimer(state)

  const careerSummary = [
    `${rolePhrase} with ${profile.experienceYears} of experience in ${profile.sector}.`,
    `Goal: ${profile.goal}.`,
    profile.responsibilities.length
      ? `Key responsibilities: ${profile.responsibilities.slice(0, 3).join(', ')}.`
      : '',
    `Most realistic next step: ${progression.buildNextTitle}.`,
    progressionRoutes[0]
      ? `Primary progression route: ${progressionRoutes[0].steps.join(' → ')} (${progressionRoutes[0].confidence} confidence).`
      : `Likely pathway: ${progression.workNowTitle} → ${progression.buildNextTitle} → ${progression.longTermTitle}.`,
  ]
    .filter(Boolean)
    .join(' ')

  const mergedQualifications = qualRecommendation
    ? [qualRecommendation.qualification, ...recommendedQualifications.filter((q) => q !== qualRecommendation.qualification)]
    : recommendedQualifications

  return {
    careerSummary,
    careerReasoning,
    strengths: strList(strengths, 'Commitment to progression in your current profession'),
    gaps: strList(gaps, 'Structured evidence for the next level'),
    workNow: progression.workNowTitle,
    buildNext: progression.buildNextTitle,
    longTermPath: progression.longTermTitle,
    progressionRoutes,
    recommendedQualifications: strList(
      mergedQualifications,
      'Role-relevant accredited training for your next step'
    ),
    recommendedQualification: qualRecommendation ?? undefined,
    longTermRequirements,
    next90DayPlan: actionPlan90Days.length ? actionPlan90Days : ['Document impact in your current role', 'Align CV to next-level responsibilities'],
    salaryProgressionEstimate,
    confidenceScore: analysis.promotionReadinessScore,
    confidenceExplanation: analysis.promotionReadinessExplanation,
    careerConfidenceScore: analysis.careerConfidenceScore,
    careerConfidenceLabel: analysis.careerConfidenceLabel,
  }
}
