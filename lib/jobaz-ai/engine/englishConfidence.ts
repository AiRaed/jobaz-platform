/**
 * English confidence metric — rule-based progression from Writing Review activity.
 */

import { clampScore } from '@/lib/jobaz-ai/profile/careerStage'
import type { EngineProgressionMeta } from './types'

const ENGLISH_LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  basic: 2,
  intermediate: 3,
  good: 4,
}

/** Baseline confidence score inferred from stored english_level. */
export function baselineEnglishConfidence(englishLevel: string | null): number {
  switch (englishLevel) {
    case 'good':
      return 75
    case 'intermediate':
      return 50
    case 'basic':
      return 25
    case 'beginner':
      return 10
    default:
      return 0
  }
}

export function getEnglishConfidenceScore(
  meta: EngineProgressionMeta,
  englishLevel: string | null
): number {
  if (typeof meta.englishConfidenceScore === 'number') {
    return clampScore(meta.englishConfidenceScore)
  }
  return baselineEnglishConfidence(englishLevel)
}

export function applyEnglishConfidenceDelta(
  meta: EngineProgressionMeta,
  englishLevel: string | null,
  delta: number
): EngineProgressionMeta {
  if (!delta) return meta
  const current = getEnglishConfidenceScore(meta, englishLevel)
  return {
    ...meta,
    englishConfidenceScore: clampScore(current + delta),
  }
}

/** Maps confidence score to english_level — never downgrades existing level. */
export function englishLevelFromConfidence(
  score: number,
  current: string | null
): string | null {
  let suggested: string | null = current
  if (score >= 75) suggested = 'good'
  else if (score >= 50) suggested = 'intermediate'
  else if (score >= 25) suggested = 'basic'
  else if (score >= 10) suggested = 'beginner'

  if (!suggested) return current
  if (!current) return suggested

  const currentRank = ENGLISH_LEVEL_RANK[current] ?? 0
  const suggestedRank = ENGLISH_LEVEL_RANK[suggested] ?? 0
  return suggestedRank > currentRank ? suggested : current
}

/** True when Writing Review should be deprioritised in favour of jobs/interviews. */
export function isEnglishConfidenceStrong(
  meta: EngineProgressionMeta | undefined,
  englishLevel: string | null
): boolean {
  const score = getEnglishConfidenceScore(meta ?? {}, englishLevel)
  return (
    score >= 45 ||
    englishLevel === 'intermediate' ||
    englishLevel === 'good'
  )
}
