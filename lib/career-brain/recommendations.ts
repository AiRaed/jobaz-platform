/**
 * AI recommendations — structured output, field-first validation.
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import { CAREER_BRAIN_RECOMMEND_FEATURE } from './config'
import { domainLabel, isFieldFirstMode, isGenericJobTitle } from './domains'
import { buildFallbackRecommendations } from './fallbackRecommendations'
import { buildCareerBrainOutput, filterFieldFirstRecs } from './resultBuilder'
import { getDeterministicCareerRecommendations } from './pathwayRecommendations'
import { getCareerChangeDeterministicResult } from './careerChangeIntelligence'
import { isCareerChangePath, isCareerChangePathComplete } from './careerChangePath'
import { getGrowCareerDeterministicResult } from './growCareerIntelligence'
import { isGrowCareerPath } from './growCareerPath'
import { buildBridgeRoleRecommendations, wantsBridgeRoleDiscovery } from './bridgeRoleIntelligence'
import { buildDualPathRecommendations, wantsDualPathMode } from './dualPathMode'
import { buildSpeedDevelopmentReasoning, wantsSkillUnlockMode } from './speedDevelopmentMode'
import {
  buildFlexibleEmploymentRecommendations,
  wantsFlexibleEmploymentMode,
} from './flexibleEmploymentMode'
import { buildCareerPathPlannerSystemPrompt } from './careerPathDecisionRules'
import type { CareerBrainOutput, CareerBrainRecommendation, CareerProfile, CareerBrainState } from './types'

const RECOMMEND_SYSTEM = buildCareerPathPlannerSystemPrompt()

function parseAiRecs(raw: string, domain: CareerProfile['domain']): CareerBrainRecommendation[] | null {
  try {
    const p = parseJsonFromText<{ recommendations?: unknown[] }>(raw)
    if (!Array.isArray(p.recommendations) || p.recommendations.length < 3) return null

    const tracks = new Set(['work_now', 'build_next', 'long_term', 'backup_income'])
    const out: CareerBrainRecommendation[] = []

    for (const item of p.recommendations) {
      if (!item || typeof item !== 'object') continue
      const r = item as Record<string, unknown>
      const track = String(r.track ?? '')
      if (!tracks.has(track)) continue
      const title = String(r.title ?? '').trim()
      const why = String(r.why ?? '').trim()
      if (!title || !why) continue
      out.push({
        title,
        why,
        track: track as CareerBrainRecommendation['track'],
        field_tag: domain,
        domain,
        source: 'ai',
      })
    }

    return out.length >= 3 ? out : null
  } catch {
    return null
  }
}

function validateFieldFirst(profile: CareerProfile, recs: CareerBrainRecommendation[]): boolean {
  if (!isFieldFirstMode(profile)) return true
  const primary = recs.filter((r) => r.track !== 'backup_income')
  return !primary.some((r) => isGenericJobTitle(r.title))
}

export type RecommendResult = {
  output: CareerBrainOutput
  source: 'ai' | 'fallback'
  reason: string
}

export async function generateCareerRecommendations(
  profile: CareerProfile,
  priorReasoning: string[] = [],
  state?: CareerBrainState
): Promise<RecommendResult> {
  const reasoning = [...priorReasoning]
  const flexible = buildFlexibleEmploymentRecommendations(profile, state)
  if (flexible) reasoning.push(...flexible.reasoning)
  const dual = buildDualPathRecommendations(profile, state)
  if (dual) reasoning.push(...dual.dualPathReasoning)
  const bridge = buildBridgeRoleRecommendations(profile, state)
  if (bridge) reasoning.push(...bridge.bridgeReasoning)
  reasoning.push(...buildSpeedDevelopmentReasoning(profile, state))

  if (state && isCareerChangePath(state) && isCareerChangePathComplete(state)) {
    const careerChange = getCareerChangeDeterministicResult(profile, state)
    if (careerChange) {
      const lockedProfile: CareerProfile = {
        ...profile,
        constraints: [...new Set([...profile.constraints, ...careerChange.extraConstraints])],
      }
      const output = buildCareerBrainOutput(
        lockedProfile,
        careerChange.recommendations,
        [...reasoning, ...careerChange.reasoning],
        'fallback',
        state
      )
      return { output, source: 'fallback', reason: 'Career change transition plan' }
    }
  }

  if (state && isGrowCareerPath(state)) {
    const growCareer = getGrowCareerDeterministicResult(profile, state)
    if (growCareer) {
      const lockedProfile: CareerProfile = {
        ...profile,
        constraints: [...new Set([...profile.constraints, ...growCareer.extraConstraints])],
      }
      const output = buildCareerBrainOutput(
        lockedProfile,
        growCareer.recommendations,
        [...reasoning, ...growCareer.reasoning],
        'fallback',
        state
      )
      return { output, source: 'fallback', reason: 'Grow career progression plan' }
    }
  }

  const answers = state?.answers ?? {}
  const deterministic = getDeterministicCareerRecommendations(answers, profile, state)
  if (deterministic) {
    const lockedProfile: CareerProfile = {
      ...profile,
      constraints: [...new Set([...profile.constraints, ...(deterministic.extraConstraints ?? [])])],
    }
    const pathwayReasoning = [
      ...reasoning,
      ...deterministic.result.explanationContext,
      ...deterministic.result.warningNotes.map((w) => `Note: ${w}`),
      deterministic.reason,
      'Recommendations locked to deterministic pathway buckets — AI explains only, does not invent job titles.',
    ]
    const output = buildCareerBrainOutput(
      lockedProfile,
      deterministic.recommendations,
      pathwayReasoning,
      'fallback',
      state
    )
    return { output, source: 'fallback', reason: deterministic.reason }
  }

  if (!aiProvider.isConfigured()) {
    const fb = buildFallbackRecommendations(profile, state)
    const output = buildCareerBrainOutput(
      profile,
      fb.recommendations,
      [...reasoning, fb.reason],
      'fallback',
      state
    )
    return { output, source: 'fallback', reason: fb.reason }
  }

  const payload = {
    ...profile,
    domainLabel: domainLabel(profile.domain),
    fieldFirst: isFieldFirstMode(profile),
    hybridPathMode: wantsDualPathMode(profile, state),
    flexibleEmploymentMode: wantsFlexibleEmploymentMode(profile, state),
    bridgeRoleDiscovery: wantsBridgeRoleDiscovery(profile, state),
    skillUnlockMode: wantsSkillUnlockMode(profile, state),
    bridgeField: bridge?.field ?? dual?.field ?? null,
  }

  try {
    const completion = await aiProvider.generateText({
      feature: CAREER_BRAIN_RECOMMEND_FEATURE,
      messages: [
        { role: 'system', content: RECOMMEND_SYSTEM },
        {
          role: 'user',
          content: `Profile:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      temperature: 0.25,
      maxTokens: 1000,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 60_000),
    })

    let parsed = parseAiRecs(completion.text, profile.domain)
    if (parsed) parsed = filterFieldFirstRecs(profile, parsed)

    if (!parsed || !validateFieldFirst(profile, parsed)) {
      const fb = buildFallbackRecommendations(profile, state)
      const output = buildCareerBrainOutput(
        profile,
        fb.recommendations,
        [...reasoning, parsed ? 'AI failed field-first validation' : 'AI parse failed', fb.reason],
        'fallback',
        state
      )
      return {
        output,
        source: 'fallback',
        reason: parsed ? `AI rejected — ${fb.reason}` : fb.reason,
      }
    }

    let extraKeywords: string[] = []
    let extraMissing: string[] = []
    let extraReasoning: string[] = []
    try {
      const full = parseJsonFromText<{
        jobSearchKeywords?: string[]
        missingSkills?: string[]
        reasoning?: string[]
      }>(completion.text)
      extraKeywords = full.jobSearchKeywords ?? []
      extraMissing = full.missingSkills ?? []
      extraReasoning = full.reasoning ?? []
    } catch {
      /* optional fields */
    }

    const output = buildCareerBrainOutput(profile, parsed, [...reasoning, ...extraReasoning], 'ai', state)
    if (extraKeywords.length) {
      output.jobSearchKeywords = [...new Set([...output.jobSearchKeywords, ...extraKeywords])]
    }
    if (extraMissing.length) {
      output.missingSkills = [...new Set([...output.missingSkills, ...extraMissing])]
    }

    return { output, source: 'ai', reason: 'AI field-aligned recommendations' }
  } catch {
    const fb = buildFallbackRecommendations(profile, state)
    const output = buildCareerBrainOutput(profile, fb.recommendations, [...reasoning, fb.reason], 'fallback', state)
    return { output, source: 'fallback', reason: `AI error — ${fb.reason}` }
  }
}
