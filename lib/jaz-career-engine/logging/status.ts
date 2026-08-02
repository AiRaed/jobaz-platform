/**
 * Build admin status snapshot for JAZ Career Engine control room.
 */

import {
  getOllamaBaseUrl,
  isOllamaAvailable,
  resolveOllamaModelName,
} from '@/lib/jobaz-ai/providers/ollama'
import { JAZ_ENGINE_VERSION } from '../types'
import { resolveJazOllamaTimeoutMs } from '../ollamaErrors'
import {
  getLastEngineError,
  getLastOllamaError,
  getOllamaRuntimeStatus,
  listJazCareerLogs,
} from './persist'
import type { JazEngineStatusSnapshot } from './types'

export async function buildJazEngineStatusSnapshot(): Promise<JazEngineStatusSnapshot> {
  const { logs, source, note, table_ready } = await listJazCareerLogs(80)
  const runtime = getOllamaRuntimeStatus()
  const ollama_base_url = getOllamaBaseUrl()
  const ollama_model = resolveOllamaModelName('local')
  const ollama_timeout_ms = resolveJazOllamaTimeoutMs()

  let ollama_status: JazEngineStatusSnapshot['ollama_status'] = 'unknown'
  try {
    ollama_status = (await isOllamaAvailable()) ? 'connected' : 'not_connected'
  } catch {
    ollama_status = 'unknown'
  }

  const provider_counts = { jaz: 0, jaz_fallback: 0, legacy: 0 }
  let durationSum = 0
  let durationN = 0
  let last_success_at: string | null = null
  let last_fallback_reason: string | null = runtime.last_fallback_reason

  for (const log of logs) {
    if (log.plan_source === 'jaz') provider_counts.jaz += 1
    else if (log.plan_source === 'jaz_fallback') provider_counts.jaz_fallback += 1
    else provider_counts.legacy += 1

    if (log.duration_ms != null && Number.isFinite(log.duration_ms)) {
      durationSum += log.duration_ms
      durationN += 1
    }

    if (!last_success_at && log.ai_provider !== 'error') {
      last_success_at = log.created_at
    }

    if (!last_fallback_reason && log.plan_source === 'jaz_fallback' && log.ollama_error) {
      last_fallback_reason = log.ollama_error
    }
  }

  const total = provider_counts.jaz + provider_counts.jaz_fallback + provider_counts.legacy
  const fallback_usage_percent =
    total === 0
      ? null
      : Math.round(
          ((provider_counts.jaz_fallback + provider_counts.legacy) / total) * 1000
        ) / 10

  const lastError = getLastEngineError()
  const engine_status: JazEngineStatusSnapshot['engine_status'] =
    lastError && !last_success_at ? 'error' : logs.length || ollama_status !== 'unknown' ? 'active' : 'unknown'

  return {
    engine_status,
    api_endpoint: '/api/jaz-career/analyse',
    engine_version: JAZ_ENGINE_VERSION,
    openai_in_career_assistant: 'disabled',
    ollama_status,
    ollama_base_url,
    ollama_model,
    ollama_timeout_ms,
    fallback_enabled: true,
    last_success_at,
    last_ollama_success_at: runtime.last_success_at,
    last_ollama_success_latency_ms: runtime.last_success_latency_ms,
    last_error: lastError,
    provider_counts,
    fallback_usage_percent,
    last_ollama_error: getLastOllamaError() || runtime.last_error,
    last_ollama_error_kind: runtime.last_error_kind,
    last_ollama_error_detail: runtime.last_error_detail,
    last_fallback_reason,
    average_duration_ms: durationN ? Math.round(durationSum / durationN) : null,
    logs_source: source,
    logs_available: logs.length > 0,
    table_ready,
    note,
  }
}

export function aggregateMissingAffiliates(
  logs: Awaited<ReturnType<typeof listJazCareerLogs>>['logs']
): Array<{
  course_type: string
  route_category: string
  reason: string
  priority: string
  count: number
  suggested_admin_action: string
}> {
  const map = new Map<
    string,
    {
      course_type: string
      route_category: string
      reason: string
      priority: string
      count: number
    }
  >()

  for (const log of logs) {
    for (const m of log.missing_affiliate_opportunities) {
      const key = `${m.course_type}::${log.route_category || m.suggested_category || ''}`
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, {
          course_type: m.course_type,
          route_category: log.route_category || m.suggested_category || 'unknown',
          reason: m.reason || 'No matched Admin course with affiliate link',
          priority: m.priority || 'medium',
          count: 1,
        })
      }
    }
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      ...row,
      suggested_admin_action: /link|referral/i.test(row.reason)
        ? 'Add referral link'
        : /provider/i.test(row.reason)
          ? 'Find provider'
          : 'Create course entry',
    }))
}
