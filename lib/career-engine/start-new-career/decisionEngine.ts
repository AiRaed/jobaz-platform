import { buildCareerRecommendations } from './recommendationEngine'
import {
  isExploringCareers,
  knowsTargetCareer,
  requireExplicitTargetForKnownCareerPath,
  shouldBuildRoadmap,
  shouldShowRecommendations,
} from './situationUtils'
import { buildStartNewCareerRoadmap } from './roadmapBuilder'
import type { StartNewCareerEngineResult, StartNewCareerPlanResult } from './types'

export function buildStartNewCareerEngineResult(
  answers: Record<string, string>
): StartNewCareerEngineResult {
  if (shouldShowRecommendations(answers)) {
    return buildCareerRecommendations(answers)
  }

  requireExplicitTargetForKnownCareerPath(answers)

  if (shouldBuildRoadmap(answers)) {
    return buildStartNewCareerRoadmap(answers)
  }

  if (isExploringCareers(answers.starting_situation)) {
    return buildCareerRecommendations(answers)
  }

  throw new Error(
    knowsTargetCareer(answers.starting_situation)
      ? 'Target career must be selected before generating your roadmap.'
      : 'Complete career discovery by choosing a recommended career.'
  )
}

export function buildStartNewCareerResult(
  answers: Record<string, string>
): StartNewCareerPlanResult {
  const result = buildStartNewCareerEngineResult(answers)
  if (result.phase === 'recommendations') {
    throw new Error(
      'Cannot build roadmap before user confirms a target career. Set target_field and target_confirmed=yes.'
    )
  }
  return result
}

export { buildStartNewCareerRoadmap, buildStartNewCareerRoadmapForSector } from './roadmapBuilder'
