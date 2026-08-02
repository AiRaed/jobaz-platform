import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import { getOrCreateAnonymousId, getOrCreateSessionId } from './identity'
export type CareerPathIdentity = {
  userId: string | null
  anonymousId: string | null
  sessionId: string | null
}

function createFallbackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Uses an active Supabase session for user_id (RLS-safe).
 * Falls back to anonymous_id, then session_id as anonymous key for public usage.
 */
export async function resolveCareerPathIdentity(): Promise<CareerPathIdentity> {
  const userId = await resolveAuthenticatedUserId()

  const anonymousRaw = getOrCreateAnonymousId()
  const sessionRaw = getOrCreateSessionId()
  const sessionId = sessionRaw.trim() || createFallbackId()

  let anonymousId: string | null = null
  if (!userId) {
    anonymousId = anonymousRaw.trim() || sessionId || createFallbackId()
  }

  return {
    userId,
    anonymousId,
    sessionId,
  }
}
