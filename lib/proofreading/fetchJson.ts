/**
 * Safe JSON fetch for Writing Review client calls — never throws on HTML error pages.
 */

export type ProofreadingJsonResult<T> = {
  ok: boolean
  status: number
  data: T | null
  error: string | null
}

export async function fetchProofreadingJson<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<ProofreadingJsonResult<T>> {
  try {
    const res = await fetch(url, init)
    const text = await res.text()

    if (!text.trim()) {
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: `Request failed (${res.status})`,
        }
      }
      return { ok: true, status: res.status, data: null, error: null }
    }

    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proofreading] Non-JSON API response:', url, res.status, text.slice(0, 160))
      }
      return {
        ok: false,
        status: res.status,
        data: null,
        error: res.ok
          ? 'Server returned an invalid response. Try refreshing the page.'
          : `Request failed (${res.status}). Try refreshing the page.`,
      }
    }

    const payload = data as Record<string, unknown>
    const apiOk = payload.ok !== false && res.ok

    return {
      ok: apiOk,
      status: res.status,
      data,
      error: apiOk
        ? null
        : (typeof payload.error === 'string' && payload.error) ||
          (typeof payload.message === 'string' && payload.message) ||
          `Request failed (${res.status})`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    if (process.env.NODE_ENV === 'development') {
      console.error('[Proofreading] fetch failed:', url, message)
    }
    return { ok: false, status: 0, data: null, error: message }
  }
}
