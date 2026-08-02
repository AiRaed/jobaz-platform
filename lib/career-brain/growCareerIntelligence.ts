/**
 * Grow Career intelligence — merges growth plan into CareerBrainOutput.
 */

import { buildGrowCareerRecommendations, type GrowCareerGrowthPlan } from './growCareerEngine'
import { inferDynamicProgression } from './growCareerGrowthAdvisor'
import {
  buildGrowCareerPathReasoning,
  isGrowCareerPath,
  isGrowCareerPathComplete,
  prepareGrowCareerStateForResults,
  resolveGrowCareerCurrentJobTitle,
} from './growCareerPath'
import { buildGrowCareerFinalReport } from './jaz/growCareerFinalReport'
import { buildJazInternalAnalysis } from './jaz/jazInternalAnalysis'
import { dedupeRecommendations } from './jaz/jazRecommendationDedup'
import { estimateSalaryGrowthPotential } from './jaz/jazEngine'
import { buildJazProfessionProfile } from './jaz/jazProfessionProfile'
import { inferProfessionProgression, isGenericFallbackJob } from './jaz/jazProfessionProgression'
import type { CareerBrainOutput, CareerBrainState, CareerPathRole, CareerProfile, GrowCareerGrowthOutput } from './types'

export function buildGrowCareerIntelligence(
  profile: CareerProfile,
  state: CareerBrainState
): {
  plan: GrowCareerGrowthPlan
  growth: GrowCareerGrowthOutput
  recommendations: ReturnType<typeof buildGrowCareerRecommendations>['recommendations']
  reasoning: string[]
} | null {
  if (!isGrowCareerPath(state)) return null

  const hasJobTitle =
    resolveGrowCareerCurrentJobTitle(state) &&
    resolveGrowCareerCurrentJobTitle(state) !== 'Professional'
  if (!isGrowCareerPathComplete(state) && !hasJobTitle) return null

  const mappedState = prepareGrowCareerStateForResults(state)
  const professionProfile = buildJazProfessionProfile(mappedState)
  const progression = inferProfessionProgression(mappedState) ?? inferDynamicProgression(mappedState)
  const analysis = buildJazInternalAnalysis(mappedState, progression)
  const { recommendations, plan, reasoning } = buildGrowCareerRecommendations(profile, mappedState)
  const coach = plan.coach

  const filteredRecommendations = dedupeRecommendations(
    recommendations.filter((r) => !isGenericFallbackJob(r.title, analysis.professionTrack))
  )

  const salaryGrowthPotential = estimateSalaryGrowthPotential(mappedState)
  const finalReport = professionProfile
    ? buildGrowCareerFinalReport({
        profile: professionProfile,
        progression,
        analysis,
        state: mappedState,
        strengths: analysis.strengths,
        gaps: analysis.weaknesses,
        recommendedQualifications: coach.recommendedCertifications,
        actionPlan90Days: coach.actionPlan90Days,
        salaryProgressionEstimate: salaryGrowthPotential,
      })
    : undefined

  const growth: GrowCareerGrowthOutput = {
    field: plan.field,
    currentJobTitle: plan.currentJobTitle,
    currentLevel: plan.currentLevelLabel,
    currentPositionSummary: plan.currentPositionSummary,
    careerGrowthScore: plan.careerGrowthScore,
    growthScoreLabel: plan.growthScoreLabel,
    careerProfile: coach.careerProfile,
    promotionReadinessScore: analysis.promotionReadinessScore,
    promotionReadinessExplanation: analysis.promotionReadinessExplanation,
    mainBarrier: plan.mainBarrier,
    growthBarriers: coach.growthBarriers,
    nextRealisticStep: plan.nextRealisticStep,
    alternativeGrowthRoute: coach.alternativeGrowthRoute,
    skillsGap: {
      strengths: plan.strengths,
      needsDevelopment: plan.weaknesses,
    },
    skillsToDevelop: coach.skillsToDevelop,
    recommendedCertifications: coach.recommendedCertifications,
    detailedGaps: coach.detailedGaps,
    promotionRoadmap: plan.promotionRoadmap,
    immediateActions: plan.immediateActions,
    actionPlan90Days: coach.actionPlan90Days,
    growthPlan6To12Months: coach.growthPlan6To12Months,
    longTermCareerDirection: coach.longTermCareerDirection,
    assumptions: coach.assumptions,
    summary: finalReport?.careerSummary ?? plan.summary,
    recommendedJobAZActions: plan.recommendedJobAZActions,
    employabilityScore: plan.employabilityScore,
    salaryGrowthPotential,
    jazConfidence: analysis.careerConfidenceScore,
    careerConfidenceScore: analysis.careerConfidenceScore,
    careerConfidenceLabel: analysis.careerConfidenceLabel,
    progressionRoutes: finalReport?.progressionRoutes,
    recommendedQualification: finalReport?.recommendedQualification,
    longTermRequirements: finalReport?.longTermRequirements,
    readinessStrengths: analysis.strengths,
    readinessGaps: analysis.weaknesses,
    internalAnalysis: finalReport?.careerReasoning ?? analysis.currentState,
    professionProfile: professionProfile ?? undefined,
    finalReport,
  }

  return { plan, growth, recommendations: filteredRecommendations, reasoning: [...reasoning, analysis.currentState] }
}

function pathRoleFromTitle(title: string, why: string, domain: CareerProfile['domain']): CareerPathRole {
  return { title, why, domain, source: 'fallback' }
}

function ensureGrowCareerRecommendedPaths(
  output: CareerBrainOutput,
  growth: GrowCareerGrowthOutput,
  intelligence: NonNullable<ReturnType<typeof buildGrowCareerIntelligence>>
): CareerBrainOutput['recommendedPaths'] {
  const fromRecs = {
    workNow: intelligence.recommendations.filter((r) => r.track === 'work_now').slice(0, 3),
    buildNext: intelligence.recommendations.filter((r) => r.track === 'build_next').slice(0, 4),
    longTerm: intelligence.recommendations.filter((r) => r.track === 'long_term').slice(0, 3),
    backupIncome: [] as CareerPathRole[],
  }

  if (fromRecs.workNow.length && fromRecs.buildNext.length && fromRecs.longTerm.length) {
    return fromRecs
  }

  const domain = output.careerProfile.domain
  const roadmap = growth.promotionRoadmap
  return {
    workNow: [
      pathRoleFromTitle(roadmap.workNow, growth.currentPositionSummary, domain),
    ],
    buildNext: [
      pathRoleFromTitle(roadmap.buildNext, growth.nextRealisticStep.reason, domain),
    ],
    longTerm: [
      pathRoleFromTitle(roadmap.longTerm, growth.longTermCareerDirection, domain),
    ],
    backupIncome: [],
  }
}

export function mergeGrowCareerIntelligenceIntoOutput(
  output: CareerBrainOutput,
  intelligence: NonNullable<ReturnType<typeof buildGrowCareerIntelligence>>,
  state: CareerBrainState
): CareerBrainOutput {
  const { growth, plan } = intelligence
  const report = growth.finalReport
  const recommendedPaths = ensureGrowCareerRecommendedPaths(output, growth, intelligence)

  const whyThisPath = report
    ? [
        'Career Summary',
        report.careerSummary,
        '',
        'Career Reasoning',
        report.careerReasoning,
        '',
        'Strengths',
        ...report.strengths.map((s) => `• ${s}`),
        '',
        'Gaps',
        ...report.gaps.map((g) => `• ${g}`),
        '',
        'Work Now',
        report.workNow,
        '',
        'Build Next',
        report.buildNext,
        '',
        'Long-Term Path',
        report.longTermPath,
        '',
        ...(report.progressionRoutes.length
          ? [
              'Progression Routes',
              ...report.progressionRoutes.map(
                (r) =>
                  `${r.label} (${r.confidence}, ~${r.confidencePercent}%): ${r.steps.join(' → ')} — ${r.summary}`
              ),
              '',
            ]
          : []),
        ...(report.recommendedQualification
          ? [
              'Recommended Qualification',
              `${report.recommendedQualification.qualification}`,
              report.recommendedQualification.reason,
              '',
            ]
          : []),
        'Recommended Qualifications',
        ...report.recommendedQualifications.map((q) => `• ${q}`),
        '',
        'Long-Term Requirements',
        report.longTermRequirements,
        '',
        'Next 90-Day Plan',
        ...report.next90DayPlan.map((a, i) => `${i + 1}. ${a}`),
        '',
        'Salary Progression Estimate',
        report.salaryProgressionEstimate,
        '',
        'Promotion Readiness Score',
        report.confidenceExplanation,
        '',
        'Career Confidence',
        `${report.careerConfidenceLabel} (${report.careerConfidenceScore}/100 — based on answer quality and evidence collected)`,
      ].join('\n')
    : [
    'Promotion Readiness Score',
    `${growth.promotionReadinessScore}/100 — ${growth.careerProfile}`,
    growth.promotionReadinessExplanation,
    '',
    'Current Position',
    `${growth.currentJobTitle} (${growth.currentLevel}) — ${growth.careerProfile}`,
    growth.currentPositionSummary,
    '',
    'Strengths',
    ...growth.skillsGap.strengths.map((s) => `• ${s}`),
    '',
    'Growth Barriers',
    ...growth.growthBarriers.map((b) => `• ${b}`),
    '',
    'Most Likely Next Role',
    `${growth.nextRealisticStep.role} — ${growth.nextRealisticStep.timeline}`,
    growth.nextRealisticStep.reason,
    '',
    'Alternative Growth Route',
    `${growth.alternativeGrowthRoute.role}`,
    growth.alternativeGrowthRoute.reason,
    '',
    'Skills To Develop',
    ...growth.skillsToDevelop.map((s, i) => `${i + 1}. ${s}`),
    '',
    ...(growth.recommendedCertifications.length
      ? ['Recommended Certifications', ...growth.recommendedCertifications.map((c) => `• ${c}`), '']
      : []),
    '90-Day Action Plan',
    ...growth.actionPlan90Days.map((a, i) => `${i + 1}. ${a}`),
    '',
    '6–12 Month Growth Plan',
    ...growth.growthPlan6To12Months.map((a, i) => `${i + 1}. ${a}`),
    '',
    'Long-Term Career Direction',
    growth.longTermCareerDirection,
    '',
    'Salary Growth Potential',
    growth.salaryGrowthPotential,
    '',
    'Promotion Roadmap',
    `${growth.promotionRoadmap.workNow} → ${growth.promotionRoadmap.buildNext} → ${growth.promotionRoadmap.longTerm}`,
  ].join('\n')

  return {
    ...output,
    careerProfile: {
      ...output.careerProfile,
      workExperienceField: plan.currentJobTitle,
      wantsSameField: true,
      wantsCareerChange: false,
      constraints: [...new Set([...output.careerProfile.constraints, 'grow-career-path', 'employed-growth'])],
    },
    recommendedPaths,
    whyThisPath,
    personalizedSummary: report?.careerReasoning ?? growth.currentPositionSummary,
    careerLadderSummary: `${growth.promotionRoadmap.workNow} → ${growth.promotionRoadmap.buildNext} → ${growth.promotionRoadmap.longTerm}`,
    employabilityScore: growth.employabilityScore,
    mainBarriers: growth.growthBarriers.slice(0, 3),
    missingSkills: growth.skillsToDevelop.slice(0, 3),
    nextJobAZActions: growth.recommendedJobAZActions,
    practicalNextSteps: growth.recommendedJobAZActions,
    growCareerGrowth: growth,
    englishDevelopmentPlan: null,
    rightToWorkGuidance: '',
    notRecommended: [
      {
        title: 'Warehouse / retail / hospitality fallback roles',
        reason: `Excluded — your conversation identifies ${growth.currentJobTitle} in ${growth.field}. JAZ recommends progression inside that profession only.`,
      },
    ],
    reasoning: [...output.reasoning, ...buildGrowCareerPathReasoning(output.careerProfile, state)],
  }
}

export function getGrowCareerDeterministicResult(
  profile: CareerProfile,
  state: CareerBrainState
): {
  recommendations: ReturnType<typeof buildGrowCareerRecommendations>['recommendations']
  reasoning: string[]
  extraConstraints: string[]
} | null {
  const intelligence = buildGrowCareerIntelligence(profile, state)
  if (!intelligence) return null
  return {
    recommendations: intelligence.recommendations,
    reasoning: intelligence.reasoning,
    extraConstraints: ['grow-career-path', 'employed-growth'],
  }
}
