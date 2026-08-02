/**
 * Anonymous and session identifiers for public AI Career Path Finder.
 */

const ANONYMOUS_ID_KEY = 'jobaz_ai_anonymous_id'
const SESSION_ID_KEY = 'jobaz_ai_session_id'

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function normalizeStoredId(raw: string | null): string | null {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : null
}

/** Persisted across visits (localStorage). Never returns an empty string. */
export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = normalizeStoredId(localStorage.getItem(ANONYMOUS_ID_KEY))
    if (!id) {
      id = createId()
      localStorage.setItem(ANONYMOUS_ID_KEY, id)
    }
    return id
  } catch {
    return createId()
  }
}

/** One ID per browser tab session (sessionStorage). Never returns an empty string. */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = normalizeStoredId(sessionStorage.getItem(SESSION_ID_KEY))
    if (!id) {
      id = createId()
      sessionStorage.setItem(SESSION_ID_KEY, id)
    }
    return id
  } catch {
    return createId()
  }
}
