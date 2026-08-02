import type { CareerBrainOutput, CareerProfile, PathConfidenceScore } from './types'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function defaultCareerProfile(): CareerProfile {
  return {
    educationLevel: null,
    studyField: null,
    workExperienceField: null,
    targetField: null,
    yearsOfExperience: null,
    experienceCountry: null,
    toolsAndSkills: [],
    hasPortfolio: null,
    certificates: [],
    licences: [],
    englishLevel: null,
    ukLocation: null,
    urgencyLevel: 'medium',
    wantsSameField: null,
    wantsCareerChange: null,
    domain: 'no_experience_general',
    domainConfidence: 0,
    detectedRoles: [],
    transferableSkills: [],
    constraints: [],
    confidence: 0,
  }
}

/** Safe normalized assessment fields for legacy/partial JSON. */
export type NormalizedCareerAssessmentShape = {
  route: string | null
  targetRole: string | null
  nextRole: string | null
  longTermPath: string | null
  pathConfidence: PathConfidenceScore[]
  shortTermPlan: string[]
  longTermPlan: string[]
  roadmapSteps: string[]
  recommendedTraining: string[]
  recommendedJobs: string[]
  gaps: string[]
  nextBestAction: string | null
}

export function extractNormalizedAssessmentShape(
  brain: CareerBrainOutput | null | undefined
): NormalizedCareerAssessmentShape {
  const safe = brain ? normalizeCareerBrainOutput(brain) : null
  const workNow = safe?.recommendedPaths.workNow ?? []
  const buildNext = safe?.recommendedPaths.buildNext ?? []
  const longTerm = safe?.recommendedPaths.longTerm ?? []

  return {
    route: workNow[0]?.title ?? safe?.careerProfile.targetField ?? null,
    targetRole: longTerm[0]?.title ?? buildNext[0]?.title ?? workNow[0]?.title ?? null,
    nextRole: buildNext[0]?.title ?? workNow[0]?.title ?? null,
    longTermPath: longTerm[0]?.title ?? null,
    pathConfidence: safe?.pathConfidence ?? [],
    shortTermPlan: workNow.map((r) => r.title),
    longTermPlan: longTerm.map((r) => r.title),
    roadmapSteps: buildNext.map((r) => r.title),
    recommendedTraining: asArray<string>(safe?.recommendedCourses),
    recommendedJobs: asArray(safe?.ukTransitionGrowth?.finalReport?.recommendedJobs).map((j) =>
      typeof j === 'object' && j && 'title' in j ? String((j as { title: string }).title) : String(j)
    ),
    gaps: safe?.missingSkills ?? [],
    nextBestAction: safe?.practicalNextSteps?.[0]?.label ?? safe?.nextJobAZActions?.[0]?.label ?? null,
  }
}

/** Normalize partial/legacy Career Brain JSON — never throws. */
export function normalizeCareerBrainOutput(raw: unknown): CareerBrainOutput | null {
  if (!raw || typeof raw !== 'object') return null

  const input = raw as Partial<CareerBrainOutput>
  const recommendedPaths = input.recommendedPaths ?? ({} as CareerBrainOutput['recommendedPaths'])

  const normalized: CareerBrainOutput = {
    careerProfile: {
      ...defaultCareerProfile(),
      ...(input.careerProfile ?? {}),
      toolsAndSkills: asArray(input.careerProfile?.toolsAndSkills),
      certificates: asArray(input.careerProfile?.certificates),
      licences: asArray(input.careerProfile?.licences),
      detectedRoles: asArray(input.careerProfile?.detectedRoles),
      transferableSkills: asArray(input.careerProfile?.transferableSkills),
      constraints: asArray(input.careerProfile?.constraints),
    },
    recommendedPaths: {
      workNow: asArray(recommendedPaths.workNow),
      buildNext: asArray(recommendedPaths.buildNext),
      longTerm: asArray(recommendedPaths.longTerm),
      backupIncome: asArray(recommendedPaths.backupIncome),
    },
    jobSearchKeywords: asArray(input.jobSearchKeywords),
    missingSkills: asArray(input.missingSkills),
    mainBarriers: asArray(input.mainBarriers),
    nextJobAZActions: asArray(input.nextJobAZActions),
    practicalNextSteps: asArray(input.practicalNextSteps),
    whyThisPath: input.whyThisPath ?? '',
    careerLadderSummary: input.careerLadderSummary ?? '',
    personalizedSummary: input.personalizedSummary ?? '',
    reasoning: asArray(input.reasoning),
    employabilityScore: typeof input.employabilityScore === 'number' ? input.employabilityScore : 0,
    pathConfidence: asArray<PathConfidenceScore>(input.pathConfidence),
    englishDevelopmentPlan: input.englishDevelopmentPlan ?? null,
    notRecommended: asArray(input.notRecommended),
    rightToWorkGuidance: input.rightToWorkGuidance ?? '',
    specialPathway: input.specialPathway ?? null,
    dualCareerPaths: input.dualCareerPaths,
    careerChangeTransition: input.careerChangeTransition
      ? {
          ...input.careerChangeTransition,
          transferableSkills: asArray(input.careerChangeTransition.transferableSkills),
          recommendedTraining: asArray(input.careerChangeTransition.recommendedTraining),
          timelinePhases: asArray(input.careerChangeTransition.timelinePhases),
          buildNextPath: {
            ...input.careerChangeTransition.buildNextPath,
            milestones: asArray(input.careerChangeTransition.buildNextPath?.milestones),
          },
        }
      : undefined,
    growCareerGrowth: input.growCareerGrowth
      ? ({
          ...input.growCareerGrowth,
          readinessStrengths: asArray(input.growCareerGrowth.readinessStrengths),
          readinessGaps: asArray(input.growCareerGrowth.readinessGaps),
          progressionRoutes: asArray(input.growCareerGrowth.progressionRoutes),
          growthBarriers: asArray(input.growCareerGrowth.growthBarriers),
          skillsToDevelop: asArray(input.growCareerGrowth.skillsToDevelop),
          recommendedCertifications: asArray(input.growCareerGrowth.recommendedCertifications),
          actionPlan90Days: asArray(input.growCareerGrowth.actionPlan90Days),
          growthPlan6To12Months: asArray(input.growCareerGrowth.growthPlan6To12Months),
          recommendedJobAZActions: asArray(input.growCareerGrowth.recommendedJobAZActions),
          skillsGap: {
            strengths: asArray(input.growCareerGrowth.skillsGap?.strengths),
            needsDevelopment: asArray(input.growCareerGrowth.skillsGap?.needsDevelopment),
          },
        } as CareerBrainOutput['growCareerGrowth'])
      : undefined,
    businessDiscoveryGrowth: input.businessDiscoveryGrowth,
    ukTransitionGrowth: input.ukTransitionGrowth,
    recommendedCourses: asArray(input.recommendedCourses),
    ukMarketNotes: asArray(input.ukMarketNotes),
    workEligibilityGuidance: input.workEligibilityGuidance,
    workEligibilityNextSteps: asArray(input.workEligibilityNextSteps),
    careerReadinessScore: input.careerReadinessScore,
    pathScores: input.pathScores,
    alternativeEducationPath: input.alternativeEducationPath,
    alternativeExperiencePath: input.alternativeExperiencePath,
    sideIncomeGrowth: input.sideIncomeGrowth,
  }

  return normalized
}
