/**
 * Integrates career advisor intelligence into UK Career Assistant API responses.
 */

import { maybeInjectAiFollowUp } from '@/lib/jobaz-ai/engines/careerIntelligence/injectFollowUp'
import type { UkCareerAssistantState, UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import {
  findAdaptiveFollowUpTrigger,
  generateAdaptiveFollowUp,
} from './adaptiveQuestions'
import {
  buildClassifyAdvisorMessage,
  buildResultAdvisorMessage,
  generateAdvisorTransition,
} from './dialogue'
import { applyInsightsToProfile } from './employability'
import { buildCareerProfile, syncCareerAdvisorOnState } from './profileBuilder'
import { buildCareerAdvisorOutputs, buildGrowCareerAdvisorOutputs } from './outputs'

type UkQuestion = {
  id: string
  text: string
  type: 'single' | 'multi'
  options: Array<{ value: string; label: string }>
  max_select?: number
  allow_free_text?: boolean
}

export type UkApiResponse = {
  phase?: string
  done?: boolean
  question?: UkQuestion | null
  assistant_message?: string
  state_updates?: Record<string, unknown>
  result?: UkCareerRuleResult | null
  career_advisor?: ReturnType<typeof buildCareerAdvisorOutputs>
  /** Career Brain owns PATH/RESULT — do not inject legacy/advisor follow-ups */
  career_brain_active?: boolean
  question_source?: 'career_brain' | 'legacy'
  [key: string]: unknown
}

async function maybeInjectAdvisorFollowUp(
  state: UkCareerAssistantState,
  response: UkApiResponse,
  profile: ReturnType<typeof applyInsightsToProfile>
): Promise<UkApiResponse> {
  if (response.done) return response
  if (response.phase !== 'PATH' && response.phase !== 'assessment') return response
  if (!response.question) return response
  if (response.question.id.startsWith('ai_follow_up_')) return response
  if (response.career_brain_active || response.question_source === 'career_brain') return response
  if (response.question.id.startsWith('cb_')) return response

  const trigger = findAdaptiveFollowUpTrigger(state, profile)
  if (!trigger) return response

  const question = await generateAdaptiveFollowUp(state, trigger, profile)
  const existing = state.ai_follow_up_ids ?? []

  return {
    ...response,
    question,
    assistant_message: await generateAdvisorTransition(
      { ...state, ai_follow_up_ids: [...existing, trigger.id] },
      profile,
      question
    ),
    state_updates: {
      ...response.state_updates,
      ai_follow_up_ids: [...existing, trigger.id],
      last_question_id: question.id,
    },
  }
}

/** Sync profile on state; enrich API response with JAZ dialogue + advisor outputs. */
export async function enhanceUkCareerResponse(
  state: UkCareerAssistantState,
  response: UkApiResponse
): Promise<UkApiResponse> {
  if (response.career_brain_active || response.question_source === 'career_brain') {
    const synced = syncCareerAdvisorOnState({
      ...state,
      ...(response.state_updates ?? {}),
    })
    const profile = applyInsightsToProfile(
      (synced.career_profile as ReturnType<typeof buildCareerProfile>) ??
        buildCareerProfile(synced)
    )
    const enriched: UkApiResponse = {
      ...response,
      state_updates: {
        ...(response.state_updates ?? {}),
        career_profile: profile,
      },
    }
    if (response.done && response.result) {
      const growGrowth = (
        response.result as { career_brain?: { growCareerGrowth?: import('@/lib/career-brain/types').GrowCareerGrowthOutput } }
      ).career_brain?.growCareerGrowth
      enriched.career_advisor = growGrowth
        ? buildGrowCareerAdvisorOutputs(profile, growGrowth)
        : buildCareerAdvisorOutputs(profile, response.result)
    }
    return enriched
  }

  const synced = syncCareerAdvisorOnState({
    ...state,
    ...(response.state_updates ?? {}),
    answers: {
      ...(state.answers ?? {}),
      ...((response.state_updates?.answers as Record<string, unknown>) ?? {}),
    },
  })
  const profile = applyInsightsToProfile(
    (synced.career_profile as ReturnType<typeof buildCareerProfile>) ??
      buildCareerProfile(synced)
  )

  const state_updates: Record<string, unknown> = {
    ...(response.state_updates ?? {}),
    career_profile: profile,
  }

  let assistant_message = response.assistant_message ?? ''

  if (response.done && response.result) {
    assistant_message = buildResultAdvisorMessage(profile)
    const advisorOutputs = buildCareerAdvisorOutputs(profile, response.result)
    return {
      ...response,
      assistant_message,
      state_updates,
      career_advisor: advisorOutputs,
    }
  }

  if (response.question && !response.done) {
    const phase = String(response.phase ?? synced.phase ?? 'PATH')
    const isRobotic =
      assistant_message.startsWith('Next:') ||
      assistant_message.length < 25 ||
      assistant_message === 'One quick follow-up based on what you shared:' ||
      /^great!?[.!]?\s*$/i.test(assistant_message) ||
      /^thanks for sharing/i.test(assistant_message)

    if (phase === 'CLASSIFY' || phase === 'classification') {
      assistant_message = buildClassifyAdvisorMessage(profile, response.question, synced)
    } else if (phase === 'PATH' || phase === 'assessment' || isRobotic) {
      assistant_message = await generateAdvisorTransition(synced, profile, response.question)
    }
  }

  let enriched: UkApiResponse = {
    ...response,
    assistant_message,
    state_updates,
  }

  enriched = await maybeInjectAdvisorFollowUp(synced, enriched, profile)

  const mergedForLegacy = {
    ...synced,
    ...(enriched.state_updates ?? {}),
  }
  enriched = await maybeInjectAiFollowUp(mergedForLegacy, enriched)

  if (enriched.done && enriched.result && !enriched.career_advisor) {
    enriched.career_advisor = buildCareerAdvisorOutputs(profile, enriched.result)
  }

  return enriched
}

export { syncCareerAdvisorOnState }
