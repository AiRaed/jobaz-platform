/**
 * Merge AI personalization over rule-based assessment display copy.
 */

import type { CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { AiPersonalizedAssessmentResult } from './types'

export function mergeRichInsightsWithPersonalization(
  rich: RichCareerInsights,
  ruleResult: CareerAssessmentResult,
  ai: AiPersonalizedAssessmentResult | null
): { rich: RichCareerInsights; result: CareerAssessmentResult } {
  if (!ai) {
    return { rich, result: ruleResult }
  }

  const personalizedInsights = [...rich.personalizedInsights]
  if (ai.confidenceNote?.trim()) {
    personalizedInsights.push(ai.confidenceNote.trim())
  }

  return {
    result: {
      ...ruleResult,
      summary: ai.personalisedSummary?.trim() || ruleResult.summary,
    },
    rich: {
      ...rich,
      recommendationReason: ai.whyThisPathFits?.trim() || rich.recommendationReason,
      nextAction: ai.nextBestAction?.trim() || rich.nextAction,
      firstWeekFocus: ai.firstWeekActionPlan?.trim() || rich.firstWeekFocus,
      personalizedInsights:
        personalizedInsights.length > 0 ? personalizedInsights : rich.personalizedInsights,
    },
  }
}

export function profileFieldsFromPersonalization(
  rich: RichCareerInsights,
  ai: AiPersonalizedAssessmentResult | null
): {
  recommendation_reason: string
  next_action: string
  weekly_focus: string
} {
  return {
    recommendation_reason: ai?.whyThisPathFits?.trim() || rich.recommendationReason,
    next_action: ai?.nextBestAction?.trim() || rich.nextAction,
    weekly_focus: ai?.firstWeekActionPlan?.trim() || rich.firstWeekFocus,
  }
}
