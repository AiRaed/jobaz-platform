/**
 * Feature → model tier routing for JobAZ AI tools.
 *
 * Tier strategy (cost vs quality):
 *   local   → Ollama (free) — coaching, summaries, insights
 *   fast    → OpenAI mini (low cost) — light checks, small rewrites
 *   quality → OpenAI quality model — CV, cover, interview, deep writing, JSON
 *
 * Rule-based scoring/routing (readiness, engagement, tool picks) lives outside this map.
 */

import type { FeatureModelTier } from './types'

export type { FeatureModelTier }

/** Ordered fallback chain when a tier attempt fails. */
export const TIER_FALLBACK_CHAIN: FeatureModelTier[] = ['local', 'fast', 'quality']

/**
 * Career Assistant / JAZ Career Engine features — Ollama only.
 * Never fall through to OpenAI (fast/quality). Rules/template fallback lives in jaz-career-engine.
 */
export const OLLAMA_ONLY_FEATURES = new Set([
  'jaz-career-analyse',
  'uk-career-assistant',
  'uk-career-assistant-repair',
  'uk-career-assessment-personalization',
  'uk-career-follow-up',
  'uk-career-advisor-dialogue',
  'uk-career-advisor-follow-up',
  'career-brain-extract',
  'career-brain-recommend',
  'career-brain-question',
])

/**
 * Canonical feature → tier map.
 * Keys use kebab-case (slashes normalized to dashes).
 */
export const FEATURE_MODEL_MAP: Record<string, FeatureModelTier> = {
  // ── OLLAMA LOCAL — coaching, insights, summaries (OpenAI FAST fallback) ──
  'dashboard-insights': 'local',
  'dashboard-summary': 'local',
  'ai-insights': 'local',
  'weekly-plan-generation': 'local',
  'weekly-plan': 'local',
  'ai-coaching': 'local',
  'motivational-summary': 'local',
  'ai-career-assessment-personalization': 'local',
  'uk-career-assessment-personalization': 'local',
  'uk-career-follow-up': 'local',
  'uk-career-advisor-dialogue': 'local',
  'uk-career-advisor-follow-up': 'local',
  'jaz-career-analyse': 'local',
  'recommended-next-action': 'local',
  'suggested-tools-explanation': 'local',
  'career-stage-explanation': 'local',
  'ai-journey-summary': 'local',
  'job-summary': 'local',
  'ai-experiment': 'local',
  'debug-ollama-test': 'local',
  // CV scoring / ATS / checks (free tier — Ollama; premium rewrite stays quality)
  'cv-readiness-score': 'local',
  'cv-quality-score': 'local',
  'cv-ats-check': 'local',
  'cv-missing-sections': 'local',
  'cv-keyword-check': 'local',
  'cv-formatting-check': 'local',
  'job-application-analyze': 'local',
  'application-readiness-score': 'local',
  'recruiter-insight': 'local',
  'cv-check-bullet-quality': 'local',
  'cv-check-skills-quality': 'local',
  'cv-check-summary-quality': 'local',
  'cv-fix-bullet-grammar': 'local',
  'cv-health-score': 'local',
  'cv-health-ats': 'local',
  'cv-auto-improve-orchestrate': 'local',

  // ── OPENAI FAST — light utility (not deep writing) ──
  rewrite: 'fast',
  'small-rewrite': 'fast',
  translate: 'fast',
  'jaz-assistant': 'fast',
  'cv-extract-role': 'fast',
  'cv-improve-bullet': 'fast',

  // ── OPENAI QUALITY — CV, cover, interview, deep writing, strict JSON ──
  'writing-review': 'quality',
  'proofreading-ai-proofread': 'quality',
  'cv-generation': 'quality',
  generate: 'quality',
  'cv-ai-summary': 'quality',
  'cv-experience-bullets': 'quality',
  'cv-improve-publication': 'quality',
  'cv-skills-suggest': 'quality',
  'cv-ai-tailor': 'quality',
  'cv-ai-tailor-analyze': 'quality',
  'cv-ai-tailor-summary': 'quality',
  'cv-ai-tailor-experience': 'quality',
  'cv-ai-tailor-skills': 'quality',
  'cover-letter': 'quality',
  cover: 'quality',
  'cover-generate': 'quality',
  'cover-rewrite': 'quality',
  'cover-compare': 'quality',
  'cv-compare': 'quality',
  'interview-evaluation': 'quality',
  'interview-evaluate': 'quality',
  'interview-evaluate-interview': 'quality',
  'interview-hard-mode': 'quality',
  'interview-memory-eval': 'quality',
  'interview-simulation-eval': 'quality',
  'interview-voice-train': 'quality',
  'career-assessment': 'quality',
  // Career Assistant / Career Brain — Ollama only (no OpenAI)
  'uk-career-assistant': 'local',
  'uk-career-assistant-repair': 'local',
  'career-brain-extract': 'local',
  'career-brain-recommend': 'local',
  'career-brain-question': 'local',
  'structured-json': 'quality',
  'apply-assistant': 'quality',
}

/** Human-readable routing groups for audits and dev tooling. */
export const FEATURE_ROUTING_GROUPS = {
  local: [
    'dashboard-insights',
    'dashboard-summary',
    'ai-insights',
    'weekly-plan',
    'weekly-plan-generation',
    'ai-coaching',
    'motivational-summary',
    'ai-career-assessment-personalization',
    'uk-career-assessment-personalization',
    'uk-career-follow-up',
    'jaz-career-analyse',
    'uk-career-assistant',
    'career-brain-extract',
    'career-brain-recommend',
    'career-brain-question',
    'recommended-next-action',
    'suggested-tools-explanation',
    'career-stage-explanation',
    'ai-journey-summary',
    'job-summary',
  ],
  fast: [
    'rewrite',
    'small-rewrite',
    'translate',
    'jaz-assistant',
    'cv-extract-role',
    'cv-check-bullet-quality',
    'cv-check-skills-quality',
    'cv-check-summary-quality',
    'cv-fix-bullet-grammar',
    'cv-improve-bullet',
    'cv-grammar-check',
  ],
  quality: [
    'writing-review',
    'proofreading-ai-proofread',
    'cv-generation',
    'generate',
    'cv-ai-summary',
    'cv-experience-bullets',
    'cv-improve-publication',
    'cv-skills-suggest',
    'cv-ai-tailor',
    'cover',
    'cover-generate',
    'cover-rewrite',
    'cover-compare',
    'interview-evaluate',
    'interview-memory-eval',
    'interview-simulation-eval',
    'interview-voice-train',
    'structured-json',
    'apply-assistant',
  ],
  ruleBased: [
    'readiness-score',
    'engagement-score',
    'career-stage',
    'tool-routing',
    'basic-recommended-tools',
    'weekly-plan-skeleton',
    'assessment-rule-result',
  ],
} as const

export function normalizeFeatureKey(feature: string): string {
  return feature
    .trim()
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function lookupFeatureTier(feature: string): FeatureModelTier | undefined {
  const key = normalizeFeatureKey(feature)
  return FEATURE_MODEL_MAP[key]
}

/**
 * Resolve the model tier for a feature.
 * Feature map wins when the feature is known; otherwise uses explicit tier (legacy `default` → fast).
 */
export function resolveModelTier(
  feature?: string,
  explicitTier?: string
): FeatureModelTier {
  if (feature) {
    const mapped = lookupFeatureTier(feature)
    if (mapped) return mapped
  }

  return normalizeModelTier(explicitTier)
}

export function normalizeModelTier(tier?: string): FeatureModelTier {
  const raw = (tier ?? 'fast').trim().toLowerCase()
  if (raw === 'quality') return 'quality'
  if (raw === 'local') return 'local'
  if (raw === 'fallback') return 'fallback'
  if (raw === 'default') return 'fast'
  return 'fast'
}

/** Build tier attempt chain starting from the resolved tier. */
export function getTierFallbackChain(
  preferredTier: FeatureModelTier,
  feature?: string
): FeatureModelTier[] {
  if (feature && OLLAMA_ONLY_FEATURES.has(normalizeFeatureKey(feature))) {
    return ['local']
  }

  if (preferredTier === 'fallback') {
    return [...TIER_FALLBACK_CHAIN]
  }

  const start = TIER_FALLBACK_CHAIN.indexOf(preferredTier)
  if (start === -1) return ['fast', 'quality']
  return TIER_FALLBACK_CHAIN.slice(start)
}

/** Which backend serves a tier (future providers extend this table). */
export function resolveProviderIdForTier(tier: FeatureModelTier): 'ollama' | 'openai' {
  if (tier === 'local') return 'ollama'
  return 'openai'
}

/** Map routing tier to provider-native model tier (openai/ollama resolveModel). */
export function mapTierToProviderModelTier(
  tier: FeatureModelTier
): 'fast' | 'quality' | 'local' {
  if (tier === 'local') return 'local'
  if (tier === 'quality') return 'quality'
  return 'fast'
}
