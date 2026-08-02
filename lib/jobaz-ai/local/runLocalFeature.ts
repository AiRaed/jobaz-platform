/**
 * Server-side LOCAL feature execution via Ollama (with OpenAI FAST fallback via router).
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import type { AiGenerateResult } from '@/lib/jobaz-ai/providers'

export const LOCAL_FEATURE_IDS = [
  'dashboard-insights',
  'dashboard-summary',
  'ai-insights',
  'weekly-plan',
  'weekly-plan-generation',
  'ai-coaching',
  'motivational-summary',
  'recommended-next-action',
  'suggested-tools-explanation',
  'career-stage-explanation',
  'ai-journey-summary',
  'job-summary',
] as const

export type LocalFeatureId = (typeof LOCAL_FEATURE_IDS)[number]

const LOCAL_FEATURE_PROMPTS: Record<LocalFeatureId, string> = {
  'dashboard-insights':
    'You are JobAZ AI. Write 2-3 concise dashboard insight bullets for a UK job seeker. Be practical, encouraging, and specific. No markdown headings.',
  'dashboard-summary':
    'You are JobAZ AI. Write a one-paragraph dashboard summary (max 80 words) for a UK job seeker based on their profile context.',
  'ai-insights':
    'You are JobAZ AI. Suggest one clear career insight and one recommended next step. Keep it under 100 words total.',
  'weekly-plan':
    'You are JobAZ AI. Suggest a focused weekly career plan with 3 actionable tasks for a UK job seeker. Use short bullet-style lines.',
  'weekly-plan-generation':
    'You are JobAZ AI. Suggest a focused weekly career plan with 3 actionable tasks for a UK job seeker. Use short bullet-style lines.',
  'ai-coaching':
    'You are JobAZ AI career coach. Give brief, supportive coaching (max 120 words) tailored to the user context.',
  'motivational-summary':
    'You are JobAZ AI. Write a short motivational career message (max 60 words). Professional and warm tone.',
  'recommended-next-action':
    'You are JobAZ AI. Write one clear recommended next action sentence for a UK job seeker based on their profile context.',
  'suggested-tools-explanation':
    'You are JobAZ AI. Briefly explain why the suggested JobAZ tools fit this user (max 80 words). Be practical.',
  'career-stage-explanation':
    'You are JobAZ AI. Explain their career stage and readiness in 2-3 encouraging sentences for a UK job seeker.',
  'ai-journey-summary':
    'You are JobAZ AI. Summarize their recent career journey progress in 2-3 short sentences.',
  'job-summary':
    'You are JobAZ AI. Write a concise plain-English summary of a job posting for a UK job seeker (max 100 words).',
}

export function isLocalFeatureId(value: string): value is LocalFeatureId {
  return (LOCAL_FEATURE_IDS as readonly string[]).includes(value)
}

export type LocalFeatureContext = {
  readinessScore?: number
  weakestArea?: string | null
  strongestArea?: string | null
  dominantGoal?: string | null
  weeklyFocus?: string | null
  nextAction?: string | null
  ruleBasedFallback?: string
}

function buildContextPrompt(context: LocalFeatureContext): string {
  const lines = [
    context.readinessScore != null ? `Readiness score: ${context.readinessScore}/100` : null,
    context.strongestArea ? `Strongest area: ${context.strongestArea}` : null,
    context.weakestArea ? `Weakest area: ${context.weakestArea}` : null,
    context.dominantGoal ? `Primary goal: ${context.dominantGoal}` : null,
    context.weeklyFocus ? `Current weekly focus: ${context.weeklyFocus}` : null,
    context.nextAction ? `Current next action: ${context.nextAction}` : null,
    context.ruleBasedFallback
      ? `Rule-based baseline (improve on this, do not copy verbatim): ${context.ruleBasedFallback}`
      : null,
  ].filter(Boolean)

  return lines.length > 0 ? lines.join('\n') : 'General UK job seeker preparing for work.'
}

/**
 * Execute a LOCAL-tier feature through the provider router (Ollama → OpenAI FAST fallback).
 */
export async function runLocalFeature(
  feature: LocalFeatureId,
  context: LocalFeatureContext = {}
): Promise<AiGenerateResult> {
  return aiProvider.generateText({
    feature,
    messages: [
      { role: 'system', content: LOCAL_FEATURE_PROMPTS[feature] },
      { role: 'user', content: buildContextPrompt(context) },
    ],
    temperature: 0.6,
    maxTokens: 350,
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
  })
}

/**
 * Enhance rule-based dashboard copy with LOCAL AI when available.
 * Falls back to ruleBased text when AI fails or returns empty.
 */
export async function enhanceWithLocalAi(
  feature: LocalFeatureId,
  context: LocalFeatureContext,
  ruleBasedFallback: string
): Promise<{ text: string; aiUsed: boolean; result?: AiGenerateResult }> {
  try {
    const result = await runLocalFeature(feature, {
      ...context,
      ruleBasedFallback,
    })
    const text = result.text?.trim()
    if (!text) {
      return { text: ruleBasedFallback, aiUsed: false }
    }
    return { text, aiUsed: true, result }
  } catch {
    return { text: ruleBasedFallback, aiUsed: false }
  }
}
