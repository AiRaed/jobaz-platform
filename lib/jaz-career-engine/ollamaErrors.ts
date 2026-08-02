/**
 * Classify Ollama failures for JAZ Learning Loop / admin diagnostics.
 */

export type OllamaFailureKind =
  | 'not_configured'
  | 'connection_refused'
  | 'model_missing'
  | 'timeout'
  | 'aborted'
  | 'invalid_json'
  | 'http_error'
  | 'unavailable'
  | 'other'

export function classifyOllamaError(err: unknown): {
  kind: OllamaFailureKind
  message: string
  detail: string
} {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : String(err ?? 'unknown')
  const lower = raw.toLowerCase()
  const name =
    err instanceof Error && 'name' in err ? String((err as Error).name) : ''

  if (/not configured/i.test(raw)) {
    return { kind: 'not_configured', message: 'Ollama not configured', detail: raw }
  }
  if (/model .+ not found|model_missing|not pulled|pull /i.test(raw)) {
    return { kind: 'model_missing', message: 'Model missing or not pulled', detail: raw }
  }
  if (
    name === 'AbortError' ||
    /timed out|timeout|operation was aborted|aborted/i.test(lower)
  ) {
    const isTimeout = /timed out|timeout/i.test(lower) || /operation was aborted/i.test(lower)
    return {
      kind: isTimeout ? 'timeout' : 'aborted',
      message: isTimeout
        ? 'Ollama timed out (generation took too long or was aborted)'
        : 'Ollama request aborted',
      detail: raw,
    }
  }
  if (
    /econnrefused|connection refused|fetch failed|network|enotfound|econnreset/i.test(
      lower
    )
  ) {
    return { kind: 'connection_refused', message: 'Cannot connect to Ollama', detail: raw }
  }
  if (/no json|invalid .*json|unexpected token|json object/i.test(lower)) {
    return { kind: 'invalid_json', message: 'Ollama returned invalid JSON', detail: raw }
  }
  if (/ollama generate failed \(\d+\)|http \d{3}/i.test(lower)) {
    return { kind: 'http_error', message: 'Ollama HTTP error', detail: raw }
  }
  if (/unavailable/i.test(lower)) {
    return { kind: 'unavailable', message: 'Ollama unavailable', detail: raw }
  }
  return { kind: 'other', message: raw.slice(0, 200), detail: raw }
}

/**
 * JAZ Ollama timeout (ms).
 * Local llama3 career JSON often needs 90–180s on CPU; default 180s, hard cap 240s.
 */
export function resolveJazOllamaTimeoutMs(): number {
  const raw = Number(
    process.env.JAZ_OLLAMA_TIMEOUT_MS ||
      process.env.OLLAMA_TIMEOUT_MS ||
      process.env.AI_PROVIDER_TIMEOUT_MS ||
      180_000
  )
  if (!Number.isFinite(raw) || raw <= 0) return 180_000
  return Math.min(Math.max(raw, 30_000), 240_000)
}
