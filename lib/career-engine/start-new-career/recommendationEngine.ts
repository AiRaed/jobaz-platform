import { scoreCareerRecommendations } from '@/lib/career-engine/shared/careerRecommendationScoring'
import { formatInterestAreasPhrase, parseInterestAreas } from '@/lib/career-engine/shared/interestScoring'
import { resolveDisplayCurrentField } from './mapToCareerBrain'
import { buildDiscoveryRecommendationPreview } from './recommendationPreview'
import { SITUATION_LABELS } from './questions'
import { parseSituation } from './situationUtils'
import type { StartNewCareerRecommendationsResult } from './types'

export function buildCareerRecommendations(
  answers: Record<string, string>
): StartNewCareerRecommendationsResult {
  const situation = parseSituation(answers)
  const scored = scoreCareerRecommendations(answers, 6)
  const interests = parseInterestAreas(answers.interest_area)
  const currentField = resolveDisplayCurrentField(answers)

  const recommendations = scored.map((row) =>
    buildDiscoveryRecommendationPreview(answers, row.sectorId, row.matchScore, row.reasons)
  )

  const explorationSummary =
    interests.length > 0
      ? `Career discovery for your profile — each option below is a complete mini-plan showing jobs you can get now, qualifications to study next, and your long-term UK progression. Based on ${formatInterestAreasPhrase(interests)} plus your full profile. You choose which career to build in full.`
      : 'Career discovery for your profile — each option is a complete mini-plan: bridge jobs, courses, career ladder, timeline, and readiness. Choose the career that fits you best, then build your full roadmap.'

  return {
    pathId: 'start_new_career',
    phase: 'recommendations',
    situation,
    situationLabel: SITUATION_LABELS[situation] ?? situation,
    currentField,
    answers,
    recommendations,
    explorationSummary,
  }
}
