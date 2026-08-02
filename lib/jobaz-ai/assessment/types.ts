/**
 * AI Career Path Assessment — stored result + AI personalization types.
 */

import type { CareerAssessmentResult } from '@/lib/jobaz-ai/types'

export type AiPersonalizedAssessmentResult = {
  personalisedSummary: string
  whyThisPathFits: string
  nextBestAction: string
  confidenceNote: string
  firstWeekActionPlan: string
  provider?: string
  model?: string
  tier?: string
  fallbackUsed?: boolean
  latencyMs?: number
}

export type StoredCareerAssessmentResult = {
  rule_result: CareerAssessmentResult
  ai_personalized_result?: AiPersonalizedAssessmentResult | null
}

export function isStoredCareerAssessmentResult(
  value: unknown
): value is StoredCareerAssessmentResult {
  if (!value || typeof value !== 'object') return false
  return 'rule_result' in value && typeof (value as StoredCareerAssessmentResult).rule_result === 'object'
}

/** Accept legacy flat CareerAssessmentResult or wrapped stored shape. */
export function normalizeStoredAssessmentResult(
  value: CareerAssessmentResult | StoredCareerAssessmentResult
): StoredCareerAssessmentResult {
  if (isStoredCareerAssessmentResult(value)) return value
  return {
    rule_result: value,
    ai_personalized_result: null,
  }
}

export function getRuleResultFromStored(
  value: CareerAssessmentResult | StoredCareerAssessmentResult
): CareerAssessmentResult {
  return normalizeStoredAssessmentResult(value).rule_result
}

export function getAiPersonalizedFromStored(
  value: CareerAssessmentResult | StoredCareerAssessmentResult | unknown
): AiPersonalizedAssessmentResult | null {
  if (!isStoredCareerAssessmentResult(value)) return null
  return value.ai_personalized_result ?? null
}
