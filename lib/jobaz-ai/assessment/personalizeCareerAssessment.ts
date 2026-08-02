/**
 * AI personalization layer for Career Path Assessment (server-side).
 * Rule-based scoring remains the source of truth; AI enhances copy only.
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { AiPersonalizedAssessmentResult } from './types'

export const AI_CAREER_ASSESSMENT_FEATURE = 'ai-career-assessment-personalization'

const SYSTEM_PROMPT = `You are JobAZ AI, a UK career coach. You receive rule-based assessment results that MUST NOT be changed.
Your job is to write warmer, clearer personalized explanations in UK English.

Return ONLY valid JSON with this exact structure:
{
  "personalisedSummary": "2-3 sentences summarising their career situation and recommended path",
  "whyThisPathFits": "2-3 sentences explaining why the rule-based path fits their answers",
  "nextBestAction": "One clear next action sentence",
  "confidenceNote": "One sentence on confidence/readiness (honest, encouraging)",
  "firstWeekActionPlan": "3 short bullet-style lines for the first week (single string, use newline between items)"
}

Rules:
- Do NOT change the recommended path name or invent job titles not in the rule-based result.
- Do NOT contradict readiness scores or rule-based facts.
- Keep total output under 220 words.
- No markdown fences.`

export type PersonalizeCareerAssessmentInput = {
  answers: AssessmentAnswers
  ruleResult: CareerAssessmentResult
  richInsights: RichCareerInsights
  profileContext?: {
    readinessScore?: number
    engagementScore?: number
    strongestArea?: string
    weakestArea?: string
    dominantGoal?: string | null
    assessmentCount?: number
  }
}

function logCareerAssessmentAi(result: {
  provider: string
  tier?: string
  model: string
  fallbackUsed: boolean
}): void {
  console.info(
    '[AI Career Assessment]',
    [
      `provider=${result.provider}`,
      `tier=${result.tier ?? 'unknown'}`,
      `model=${result.model}`,
      `fallbackUsed=${result.fallbackUsed}`,
    ].join(' ')
  )
}

function buildUserPrompt(input: PersonalizeCareerAssessmentInput): string {
  const { answers, ruleResult, richInsights, profileContext } = input
  return JSON.stringify(
    {
      user_answers: answers,
      rule_based_result: {
        recommendedPath: ruleResult.recommendedPath,
        summary: ruleResult.summary,
        suggestedJobs: ruleResult.suggestedJobs,
        nextSteps: ruleResult.nextSteps,
        recommendedTools: ruleResult.recommendedTools.map((t) => t.name),
      },
      rule_based_insights: {
        recommendationReason: richInsights.recommendationReason,
        strongestArea: richInsights.strongestArea,
        weakestArea: richInsights.weakestArea,
        readinessScore: richInsights.readinessScore,
        nextAction: richInsights.nextAction,
        firstWeekFocus: richInsights.firstWeekFocus,
        careerStage: richInsights.careerStage,
      },
      profile_context: profileContext ?? null,
    },
    null,
    2
  )
}

function parsePersonalizationPayload(raw: string): AiPersonalizedAssessmentResult | null {
  try {
    const parsed = parseJsonFromText<{
      personalisedSummary?: string
      whyThisPathFits?: string
      nextBestAction?: string
      confidenceNote?: string
      firstWeekActionPlan?: string
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
    }
  } catch {
    return null
  }
}

/**
 * Generate AI personalization via aiProvider (Ollama local → OpenAI fast fallback).
 * Returns null on failure — callers must keep rule-based copy.
 */
export async function personalizeCareerAssessment(
  input: PersonalizeCareerAssessmentInput
): Promise<AiPersonalizedAssessmentResult | null> {
  try {
    const completion = await aiProvider.generateText({
      feature: AI_CAREER_ASSESSMENT_FEATURE,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.55,
      maxTokens: 500,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
    })

    const parsed = parsePersonalizationPayload(completion.text)
    if (!parsed) {
      logCareerAssessmentAi({
        provider: completion.provider,
        tier: completion.tier,
        model: completion.model,
        fallbackUsed: completion.fallbackUsed,
      })
      return null
    }

    const result: AiPersonalizedAssessmentResult = {
      ...parsed,
      provider: completion.provider,
      model: completion.model,
      tier: completion.tier,
      fallbackUsed: completion.fallbackUsed,
      latencyMs: completion.latencyMs,
    }

    logCareerAssessmentAi({
      provider: completion.provider,
      tier: completion.tier,
      model: completion.model,
      fallbackUsed: completion.fallbackUsed,
    })
    return result
  } catch (err) {
    console.warn(
      '[AI Career Assessment]',
      `provider=none tier=local model=n/a fallbackUsed=true error=${err instanceof Error ? err.message : String(err)}`
    )
    return null
  }
}
