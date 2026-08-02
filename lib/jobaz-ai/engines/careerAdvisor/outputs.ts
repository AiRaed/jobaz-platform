/**
 * Smart outputs — career match summary, paths, JobAZ tool recommendations.
 */

import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { GrowCareerGrowthOutput } from '@/lib/career-brain/types'
import type { CareerAdvisorOutputs, CareerAdvisorToolAction, CareerProfile } from './types'

function jobFinderHref(query: string): string {
  return `/job-finder?jobTitle=${encodeURIComponent(query)}`
}

export function buildCareerAdvisorOutputs(
  profile: CareerProfile,
  ruleResult?: UkCareerRuleResult | null
): CareerAdvisorOutputs {
  const insights = profile.aiInsights
  const topDirections = ruleResult?.work_now.directions.slice(0, 3) ?? []

  const topJobPaths = topDirections.length
    ? topDirections.map((d) => ({
        title: d.direction_title,
        why: d.why[0] ?? 'Matches your profile and UK market demand',
        salaryBand: insights.realisticSalaryBand ?? undefined,
      }))
    : insights.recommendedSectors.slice(0, 3).map((s) => ({
        title: s,
        why: 'Realistic entry based on your background and constraints',
        salaryBand: insights.realisticSalaryBand ?? undefined,
      }))

  const jobFinderSearches = [
    ...topJobPaths.map((p) => p.title),
    ...insights.easiestEntryRoles.slice(0, 2),
  ].filter(Boolean)

  const cvImprovements: string[] = []
  if (profile.barriers.lackOfExperience) {
    cvImprovements.push('Add a strong personal summary focused on reliability and transferable skills')
  }
  if (profile.workExperience.transferableSkills.length) {
    cvImprovements.push(
      `Highlight: ${profile.workExperience.transferableSkills.slice(0, 3).join(', ')}`
    )
  }
  if (profile.barriers.language) {
    cvImprovements.push('Use clear, simple UK-style bullet points — avoid long paragraphs')
  }
  if (!cvImprovements.length) {
    cvImprovements.push('Tailor your CV to the top recommended sector with UK job titles')
  }

  const nextSteps: CareerAdvisorToolAction[] = []

  if (profile.barriers.lackOfExperience || profile.profileCompleteness < 50) {
    nextSteps.push({
      tool: 'cv_builder',
      label: 'Build or improve your CV',
      href: '/cv-builder-v2',
      reason: 'A UK-format CV is essential before applying',
    })
  }

  if (insights.urgencyLevel === 'high' || profile.careerDirection.userSegment === 'unemployed') {
    nextSteps.push({
      tool: 'job_finder',
      label: 'Search realistic roles now',
      href: jobFinderHref(jobFinderSearches[0] ?? 'warehouse operative'),
      reason: 'Fast-hiring sectors can bring income while you develop',
    })
  }

  if (profile.barriers.interviewFear || profile.barriers.confidence) {
    nextSteps.push({
      tool: 'interview_coach',
      label: 'Practice interviews',
      href: '/interview-coach',
      reason: 'Build confidence with UK-style interview practice',
    })
  }

  if (profile.careerDirection.wantsCareerChange || insights.recommendedPaths.length > 1) {
    nextSteps.push({
      tool: 'build_your_path',
      label: 'Explore career paths',
      href: '/build-your-path',
      reason: 'Compare training routes and sector requirements',
    })
  }

  if (profile.barriers.language) {
    nextSteps.push({
      tool: 'writing_review',
      label: 'Polish applications',
      href: '/proofreading',
      reason: 'Clear written English strengthens applications',
    })
  }

  if (!nextSteps.length) {
    nextSteps.push({
      tool: 'job_finder',
      label: 'Find matching jobs',
      href: jobFinderHref(topJobPaths[0]?.title ?? 'customer service'),
      reason: 'Apply to roles aligned with your profile',
    })
  }

  const interviewReadinessNote =
    insights.jobReady
      ? 'You are approaching job-ready — focus on targeted applications and interview practice.'
      : profile.barriers.language
        ? 'Prioritise roles with manageable English demands while you build workplace confidence.'
        : 'Strengthen your CV and practise interviews before high-volume applications.'

  const careerMatchSummary = [
    `Employability guidance score: ${insights.employabilityScore}/100.`,
    insights.strongestAreas.length
      ? `Strengths: ${insights.strongestAreas.join('; ')}.`
      : '',
    insights.biggestRisks.length ? `Watch: ${insights.biggestRisks.join('; ')}.` : '',
    topJobPaths.length
      ? `Top realistic focus: ${topJobPaths.map((p) => p.title).join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const referencePhrase =
    profile.memorySnippets.length > 0
      ? profile.memorySnippets[0]
      : null

  return {
    careerMatchSummary,
    recommendedSectors: insights.recommendedSectors,
    topJobPaths,
    jobFinderSearches: [...new Set(jobFinderSearches)].slice(0, 5),
    cvImprovements,
    missingSkills: insights.missingSkills,
    interviewReadinessNote,
    nextSteps: nextSteps.slice(0, 5),
    referencePhrase,
  }
}

/** Profession-specific advisor outputs when grow-career JAZ path completed. */
export function buildGrowCareerAdvisorOutputs(
  profile: CareerProfile,
  growth: GrowCareerGrowthOutput
): CareerAdvisorOutputs {
  const report = growth.finalReport
  const roadmap = growth.promotionRoadmap

  const topJobPaths = [
    {
      title: report?.workNow ?? roadmap.workNow,
      why: 'Your current role — baseline for promotion inside your profession',
      salaryBand: report?.salaryProgressionEstimate ?? growth.salaryGrowthPotential,
    },
    {
      title: report?.buildNext ?? roadmap.buildNext,
      why: growth.nextRealisticStep.reason,
      salaryBand: report?.salaryProgressionEstimate ?? growth.salaryGrowthPotential,
    },
    {
      title: report?.longTermPath ?? roadmap.longTerm,
      why: growth.longTermCareerDirection,
      salaryBand: report?.salaryProgressionEstimate ?? growth.salaryGrowthPotential,
    },
  ]

  const nextSteps: CareerAdvisorToolAction[] = growth.recommendedJobAZActions.slice(0, 5).map((a) => ({
    tool:
      a.action === 'JOB_FINDER'
        ? 'job_finder'
        : a.action === 'CREATE_CV'
          ? 'cv_builder'
          : a.action === 'INTERVIEW_COACH'
            ? 'interview_coach'
            : 'build_your_path',
    label: a.label,
    href: a.href ?? '/build-your-path',
    reason: `Supports your ${roadmap.buildNext} progression`,
  }))

  const careerMatchSummary = report
    ? [
        report.careerSummary,
        `Confidence: ${report.confidenceScore}/100.`,
        report.careerReasoning,
      ].join(' ')
    : [
        growth.currentPositionSummary,
        `Promotion readiness ${growth.promotionReadinessScore}/100.`,
        growth.promotionReadinessExplanation,
      ].join(' ')

  return {
    careerMatchSummary,
    recommendedSectors: [growth.field],
    topJobPaths,
    jobFinderSearches: [roadmap.buildNext, growth.currentJobTitle].filter(Boolean),
    cvImprovements: [
      `Highlight ${growth.skillsGap.strengths.slice(0, 2).join(' and ') || 'your classroom impact'} for ${roadmap.buildNext}`,
      `Address ${growth.mainBarrier.toLowerCase()} on your CV`,
    ],
    missingSkills: growth.skillsToDevelop.slice(0, 5),
    interviewReadinessNote: growth.promotionReadinessExplanation,
    nextSteps,
    referencePhrase: profile.memorySnippets[0] ?? null,
  }
}
