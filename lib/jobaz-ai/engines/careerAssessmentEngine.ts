import { calculateCareerAssessmentScores } from './careerAssessment/scoring'
import { selectPathProfile, type ToolCatalogKey } from './careerAssessment/pathProfiles'
import { TOOL_CATALOG } from './careerAssessment/toolCatalog'
import type {
  AssessmentAnswers,
  CareerAssessmentResult,
  RecommendedTool,
} from '../types'

function resolveToolsFromProfile(
  profileToolKeys: ToolCatalogKey[],
  answers: AssessmentAnswers
): RecommendedTool[] {
  const ids = new Set<string>()
  const tools: RecommendedTool[] = []
  const addKey = (key: ToolCatalogKey) => {
    const tool = TOOL_CATALOG[key]
    if (!ids.has(tool.id)) {
      ids.add(tool.id)
      tools.push(tool)
    }
  }

  for (const key of profileToolKeys) {
    addKey(key)
  }

  if (answers.helpNext === 'find_jobs') addKey('jobFinder')
  if (answers.helpNext === 'build_cv') addKey('cvBuilder')
  if (answers.cv === 'no') addKey('cvBuilder')
  if (answers.english === 'beginner' || answers.english === 'basic') {
    addKey('writingReview')
  }

  if (tools.length === 0) {
    addKey('ukCareerAssistant')
    addKey('cvBuilder')
  }

  return tools.slice(0, 5)
}

function tweakSuggestedJobs(jobs: string[], answers: AssessmentAnswers): string[] {
  const list = [...jobs]

  if (answers.situation === 'limited_english' || answers.english === 'beginner') {
    if (!list.some((j) => j.toLowerCase().includes('kitchen'))) {
      list.unshift('Kitchen Porter')
    }
    if (!list.some((j) => j.toLowerCase().includes('housekeeping'))) {
      list.push('Housekeeping Assistant')
    }
  }

  if (answers.experience === 'strong' && answers.situation === 'better_job') {
    return ['Team Leader', 'Supervisor', 'Senior Coordinator', 'Specialist Administrator']
  }

  return list.slice(0, 5)
}

/**
 * Rule-based career assessment engine.
 * Scores answers → selects a path profile → personalises copy and tools.
 *
 * Invoked by providers (rule-based today; LLM providers can delegate here or replace).
 */
export function runCareerAssessmentEngine(
  answers: AssessmentAnswers
): CareerAssessmentResult {
  const scores = calculateCareerAssessmentScores(answers)
  const profile = selectPathProfile(answers, scores)

  return {
    recommendedPath: profile.recommendedPath,
    summary: profile.buildSummary(answers, scores),
    suggestedJobs: tweakSuggestedJobs(profile.suggestedJobs, answers),
    nextSteps: profile.buildNextSteps(answers, scores),
    recommendedTools: resolveToolsFromProfile(profile.toolKeys, answers),
    pathType: profile.id,
    scores,
  }
}
