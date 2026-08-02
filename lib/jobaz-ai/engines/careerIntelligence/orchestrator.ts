/**
 * Unified career intelligence orchestrator.
 * UK Career Assistant UI + rule engine + AI personalization layer.
 */

import {
  findFollowUpTrigger,
  generateAiFollowUpQuestion,
} from './followUpQuestions'
import { buildProfileContextFromUkState, mapUkStateToPartialAssessmentAnswers } from './mapUkAnswers'
import { personalizeUkCareerResult } from './personalizeUkResult'
import type {
  AiFollowUpQuestion,
  AiPersonalizedUkResult,
  PartialProfileContext,
  UkCareerAssistantState,
  UkCareerRuleResult,
  UnifiedStoredAssessmentResult,
} from './types'

export type OrchestratorFollowUpResult = {
  question: AiFollowUpQuestion
  stateUpdates: Partial<UkCareerAssistantState>
}

/** Decide whether to inject an AI follow-up before the next canonical question. */
export async function maybeGenerateFollowUp(
  state: UkCareerAssistantState
): Promise<OrchestratorFollowUpResult | null> {
  if (state.phase !== 'PATH' && state.phase !== 'assessment') return null

  const trigger = findFollowUpTrigger(state)
  if (!trigger) return null

  const question = await generateAiFollowUpQuestion(state, trigger)
  const existing = state.ai_follow_up_ids ?? []

  return {
    question,
    stateUpdates: {
      ai_follow_up_ids: [...existing, trigger.id],
      last_question_id: question.id,
    },
  }
}

export async function enrichUkCareerResult(input: {
  state: UkCareerAssistantState
  ruleResult: UkCareerRuleResult
  profileContext?: PartialProfileContext | null
}): Promise<AiPersonalizedUkResult | null> {
  const profileContext =
    input.profileContext ?? buildProfileContextFromUkState(input.state)

  return personalizeUkCareerResult({
    state: input.state,
    ruleResult: input.ruleResult,
    profileContext,
  })
}

export function buildUnifiedStoredResult(input: {
  state: UkCareerAssistantState
  ruleResult: UkCareerRuleResult
  aiPersonalized?: AiPersonalizedUkResult | null
}): UnifiedStoredAssessmentResult {
  return {
    assessment_type: 'uk_career_assistant',
    rule_result: input.ruleResult,
    ai_personalized_result: input.aiPersonalized ?? null,
    follow_up_context: {
      askedFollowUpIds: input.state.ai_follow_up_ids ?? [],
      followUpAnswers: Object.fromEntries(
        Object.entries(input.state.answers ?? {})
          .filter(([key]) => key.startsWith('ai_follow_up_'))
          .map(([k, v]) => [k, String(v)])
      ),
    },
    uk_state: {
      path: input.state.path,
      phase: input.state.phase,
      answers: input.state.answers,
      career_profile: input.state.career_profile,
      career_brain_result:
        (input.state as { career_brain_result?: unknown }).career_brain_result ?? undefined,
      career_brain_profile:
        (input.state as { career_brain_profile?: unknown }).career_brain_profile ?? undefined,
      career_engine_result:
        (input.state as { career_engine_result?: unknown }).career_engine_result ?? undefined,
    },
    career_advisor_outputs:
      (input.state as { career_advisor_outputs?: UnifiedStoredAssessmentResult['career_advisor_outputs'] })
        .career_advisor_outputs ?? undefined,
  }
}

export function getRecommendedPathLabel(ruleResult: UkCareerRuleResult): string {
  const top = ruleResult.work_now.directions[0]?.direction_title
  return top ?? 'UK Career Path'
}

export {
  buildProfileContextFromUkState,
  mapUkStateToPartialAssessmentAnswers,
  findFollowUpTrigger,
  generateAiFollowUpQuestion,
  personalizeUkCareerResult,
}
