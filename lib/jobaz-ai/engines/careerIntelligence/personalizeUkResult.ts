/**
 * AI personalization for UK Career Assistant results (local tier, OpenAI fallback).
 * Rule-based Work Now / Improve Later / Avoid remain unchanged.
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import type {
  AiPersonalizedUkResult,
  PartialProfileContext,
  UkCareerAssistantState,
  UkCareerRuleResult,
} from './types'

export const UK_CAREER_PERSONALIZATION_FEATURE = 'uk-career-assessment-personalization'

const SYSTEM_PROMPT = `You are JobAZ AI, a UK career coach. You receive rule-based UK career assessment results.
Do NOT change recommended directions, job titles, or avoid items.

Return ONLY valid JSON:
{
  "personalisedSummary": "2-3 sentences summarising their situation",
  "whyThisPathFits": "2-3 sentences on why Work Now directions fit",
  "nextBestAction": "One clear next action sentence",
  "confidenceNote": "One honest encouraging sentence about readiness",
  "firstWeekActionPlan": "3 short first-week tasks (newline separated)",
  "toolsExplanation": "One sentence on why suggested JobAZ tools help",
  "careerStageNote": "One sentence explaining their career stage"
}

Rules:
- UK English, practical, warm
- Reference their answers where relevant
- Do not invent job titles not in the rule result
- Max 220 words total
- No markdown fences`

export type PersonalizeUkResultInput = {
  state: UkCareerAssistantState
  ruleResult: UkCareerRuleResult
  profileContext?: PartialProfileContext
}

function parsePayload(raw: string): AiPersonalizedUkResult | null {
  try {
    const parsed = parseJsonFromText<{
      personalisedSummary?: string
      whyThisPathFits?: string
      nextBestAction?: string
      confidenceNote?: string
      firstWeekActionPlan?: string
      toolsExplanation?: string
      careerStageNote?: string
    }>(raw)

    if (
      !parsed.personalisedSummary?.trim() ||
      !parsed.whyThisPathFits?.trim() ||
      !parsed.nextBestAction?.trim()
    ) {
      return null
    }

    return {
      personalisedSummary: parsed.personalisedSummary.trim(),
      whyThisPathFits: parsed.whyThisPathFits.trim(),
      nextBestAction: parsed.nextBestAction.trim(),
      confidenceNote: parsed.confidenceNote?.trim() ?? '',
      firstWeekActionPlan: parsed.firstWeekActionPlan?.trim() ?? '',
      toolsExplanation: parsed.toolsExplanation?.trim() ?? '',
      careerStageNote: parsed.careerStageNote?.trim() ?? '',
    }
  } catch {
    return null
  }
}

export async function personalizeUkCareerResult(
  input: PersonalizeUkResultInput
): Promise<AiPersonalizedUkResult | null> {
  try {
    const completion = await aiProvider.generateText({
      feature: UK_CAREER_PERSONALIZATION_FEATURE,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(
            {
              path: input.state.path,
              answers: input.state.answers,
              career_profile: input.state.career_profile ?? null,
              rule_result: input.ruleResult,
              profile_context: input.profileContext ?? null,
            },
            null,
            2
          ),
        },
      ],
      temperature: 0.55,
      maxTokens: 550,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
    })

    const parsed = parsePayload(completion.text)
    if (!parsed) return null

    return {
      ...parsed,
      provider: completion.provider,
      model: completion.model,
      tier: completion.tier,
      fallbackUsed: completion.fallbackUsed,
      latencyMs: completion.latencyMs,
    }
  } catch (err) {
    console.warn(
      '[UK Career Intelligence]',
      `personalize failed: ${err instanceof Error ? err.message : String(err)}`
    )
    return null
  }
}
