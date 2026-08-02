/**
 * In-memory ring buffer for JAZ Career Engine logs (dev / when DB unavailable).
 */

import type { JazCareerEngineLogEntry, JazLogAdminFeedback } from './types'

const MAX = 120

export type JazOllamaRuntimeStatus = {
  last_success_at: string | null
  last_success_latency_ms: number | null
  last_error: string | null
  last_error_kind: string | null
  last_error_detail: string | null
  last_fallback_reason: string | null
  last_model: string | null
}

declare global {
  // eslint-disable-next-line no-var
  var __jazCareerEngineLogBuffer: JazCareerEngineLogEntry[] | undefined
  // eslint-disable-next-line no-var
  var __jazCareerEngineLastError: string | null | undefined
  // eslint-disable-next-line no-var
  var __jazCareerEngineLastOllamaError: string | null | undefined
  // eslint-disable-next-line no-var
  var __jazOllamaRuntimeStatus: JazOllamaRuntimeStatus | undefined
}

function runtimeStatus(): JazOllamaRuntimeStatus {
  if (!globalThis.__jazOllamaRuntimeStatus) {
    globalThis.__jazOllamaRuntimeStatus = {
      last_success_at: null,
      last_success_latency_ms: null,
      last_error: null,
      last_error_kind: null,
      last_error_detail: null,
      last_fallback_reason: null,
      last_model: null,
    }
  }
  return globalThis.__jazOllamaRuntimeStatus
}

function buffer(): JazCareerEngineLogEntry[] {
  if (!globalThis.__jazCareerEngineLogBuffer) {
    globalThis.__jazCareerEngineLogBuffer = []
  }
  return globalThis.__jazCareerEngineLogBuffer
}

export function pushMemoryLog(entry: JazCareerEngineLogEntry): void {
  const buf = buffer()
  buf.unshift(entry)
  if (buf.length > MAX) buf.length = MAX
}

export function listMemoryLogs(limit = 50): JazCareerEngineLogEntry[] {
  return buffer().slice(0, limit)
}

export function getMemoryLog(id: string): JazCareerEngineLogEntry | null {
  return buffer().find((e) => e.id === id) ?? null
}

export function updateMemoryFeedback(
  id: string,
  feedback: JazLogAdminFeedback,
  note?: string
): JazCareerEngineLogEntry | null {
  const entry = getMemoryLog(id)
  if (!entry) return null
  entry.admin_feedback = feedback
  entry.admin_feedback_note = note ?? null
  entry.admin_feedback_at = new Date().toISOString()
  return entry
}

export function setLastEngineError(message: string | null): void {
  globalThis.__jazCareerEngineLastError = message
}

export function getLastEngineError(): string | null {
  return globalThis.__jazCareerEngineLastError ?? null
}

export function setLastOllamaError(message: string | null): void {
  globalThis.__jazCareerEngineLastOllamaError = message
}

export function getLastOllamaError(): string | null {
  return globalThis.__jazCareerEngineLastOllamaError ?? null
}

export function recordOllamaSuccess(opts: {
  latencyMs: number
  model?: string | null
}): void {
  const s = runtimeStatus()
  s.last_success_at = new Date().toISOString()
  s.last_success_latency_ms = opts.latencyMs
  s.last_model = opts.model ?? s.last_model
  s.last_error = null
  s.last_error_kind = null
  s.last_error_detail = null
  s.last_fallback_reason = null
  setLastOllamaError(null)
}

export function recordOllamaFailure(opts: {
  error: string
  kind?: string | null
  detail?: string | null
  model?: string | null
}): void {
  const s = runtimeStatus()
  s.last_error = opts.error
  s.last_error_kind = opts.kind ?? null
  s.last_error_detail = opts.detail ?? null
  s.last_fallback_reason = `${opts.kind || 'other'}: ${opts.error}`
  if (opts.model) s.last_model = opts.model
  setLastOllamaError(opts.error)
}

export function getOllamaRuntimeStatus(): JazOllamaRuntimeStatus {
  return { ...runtimeStatus() }
}
