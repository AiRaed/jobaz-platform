/**
 * In-memory AI usage tracker — development diagnostics only.
 * Resets on server restart; not persisted.
 */

import type { AiProviderId, FeatureModelTier } from './types'

export type AiCostBucket = 'free' | 'low' | 'high'

export type AiUsageRecord = {
  feature: string
  tier: FeatureModelTier
  provider: AiProviderId
  model: string
  fallbackUsed: boolean
  latencyMs: number
  costBucket: AiCostBucket
  timestamp: number
}

export type AiUsageSummary = {
  totalCalls: number
  openaiCalls: number
  ollamaCalls: number
  fallbackCalls: number
  localSkipped: number
  costBuckets: Record<AiCostBucket, number>
  byFeature: Record<string, { count: number; costBucket: AiCostBucket }>
  recent: AiUsageRecord[]
}

const MAX_RECORDS = 500

const records: AiUsageRecord[] = []
let localSkippedCount = 0

export function resolveCostBucket(
  provider: AiProviderId,
  tier: FeatureModelTier
): AiCostBucket {
  if (provider === 'ollama') return 'free'
  if (tier === 'quality') return 'high'
  return 'low'
}

export function recordLocalSkipped(): void {
  localSkippedCount += 1
}

export function recordAiUsage(entry: Omit<AiUsageRecord, 'timestamp'>): void {
  records.push({ ...entry, timestamp: Date.now() })
  if (records.length > MAX_RECORDS) {
    records.splice(0, records.length - MAX_RECORDS)
  }
}

export function getAiUsageSummary(limit = 25): AiUsageSummary {
  const byFeature: AiUsageSummary['byFeature'] = {}
  let openaiCalls = 0
  let ollamaCalls = 0
  let fallbackCalls = 0
  const costBuckets: Record<AiCostBucket, number> = { free: 0, low: 0, high: 0 }

  for (const row of records) {
    if (row.provider === 'openai') openaiCalls += 1
    if (row.provider === 'ollama') ollamaCalls += 1
    if (row.fallbackUsed) fallbackCalls += 1
    costBuckets[row.costBucket] += 1

    const key = row.feature || 'unknown'
    if (!byFeature[key]) {
      byFeature[key] = { count: 0, costBucket: row.costBucket }
    }
    byFeature[key].count += 1
  }

  return {
    totalCalls: records.length,
    openaiCalls,
    ollamaCalls,
    fallbackCalls,
    localSkipped: localSkippedCount,
    costBuckets,
    byFeature,
    recent: records.slice(-limit).reverse(),
  }
}

export function resetAiUsageSummary(): void {
  records.length = 0
  localSkippedCount = 0
}
