/**
 * Guest session persistence for UK Career Assistant (pre-auth conversion flow).
 */

import {
  buildAuthLoginUrl,
  buildAuthSignupUrl,
  GUEST_CAREER_DASHBOARD_PATH,
  UK_CAREER_ASSISTANT_RESUME_PATH,
} from '@/lib/auth/redirect'
import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { normalizeCareerBrainOutput } from '@/lib/career-brain/normalizeOutput'
import type { AiPersonalizedUkResult } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { isUkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'

export const CA_RESULT_STORAGE_KEY = 'jobaz_ca_last_result_v1'

export type CaResultSnapshot = {
  timestamp: number
  sessionId: string
  result: {
    path: string | null
    result: unknown
  }
  aiState: Record<string, unknown>
  conversation: Array<{ role: 'assistant' | 'user'; content: string }>
  aiEnrichment?: unknown
}

export function getUkCareerAuthUrls() {
  return {
    resumePath: GUEST_CAREER_DASHBOARD_PATH,
    signupUrl: buildAuthSignupUrl(GUEST_CAREER_DASHBOARD_PATH),
    loginUrl: buildAuthLoginUrl(GUEST_CAREER_DASHBOARD_PATH),
  }
}

/** @deprecated Prefer getUkCareerAuthUrls — kept for resume deep-links. */
export function getUkCareerResumeAuthUrls() {
  return {
    resumePath: UK_CAREER_ASSISTANT_RESUME_PATH,
    signupUrl: buildAuthSignupUrl(UK_CAREER_ASSISTANT_RESUME_PATH),
    loginUrl: buildAuthLoginUrl(UK_CAREER_ASSISTANT_RESUME_PATH),
  }
}

export function saveCaResultSnapshot(snapshot: CaResultSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CA_RESULT_STORAGE_KEY, JSON.stringify(snapshot))
    if (process.env.NODE_ENV === 'development') {
      console.log('[CA persist] localStorage write (guestSession)', {
        key: CA_RESULT_STORAGE_KEY,
        sessionId: snapshot.sessionId,
        hasResult: Boolean(snapshot.result?.result),
      })
    }
  } catch (err) {
    console.error('[CA persist] localStorage write failed (guestSession)', err)
  }
}

export function loadCaResultSnapshot(sessionId?: string | null): CaResultSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CA_RESULT_STORAGE_KEY)
    if (!raw) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[guestSession] no local result at key', CA_RESULT_STORAGE_KEY)
      }
      return null
    }
    const snapshot = JSON.parse(raw) as CaResultSnapshot
    if (!snapshot?.result?.result) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[guestSession] local result missing nested result payload')
      }
      return null
    }
    if (sessionId && snapshot.sessionId !== sessionId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[guestSession] local result session mismatch', {
          expected: sessionId,
          found: snapshot.sessionId,
        })
      }
      return null
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[guestSession] found local result', {
        key: CA_RESULT_STORAGE_KEY,
        sessionId: snapshot.sessionId,
        timestamp: snapshot.timestamp,
      })
    }
    return snapshot
  } catch (err) {
    console.error('[guestSession] failed to parse local result', err)
    return null
  }
}

/**
 * Clears Career Assistant draft/result snapshot only.
 * Does not touch My Plan (`jobaz_plan_v1`), CV, or account data.
 */
export function clearCaResultSnapshot(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CA_RESULT_STORAGE_KEY)
    if (process.env.NODE_ENV === 'development') {
      console.log('[guestSession] cleared CA snapshot', CA_RESULT_STORAGE_KEY)
    }
  } catch (err) {
    console.error('[guestSession] failed to clear CA snapshot', err)
  }
}

/** True when a previous CA assessment exists in local guest storage. */
export function hasCaResultSnapshot(): boolean {
  return Boolean(loadCaResultSnapshot()?.result?.result)
}

/** Ensure latest assessment answers are persisted before navigating to auth. */
export function preserveAssessmentBeforeAuth(snapshot: CaResultSnapshot): void {
  saveCaResultSnapshot(snapshot)
}

export function normalizeStoredRuleResult(
  raw: unknown,
  aiState: Record<string, unknown>
): (UkCareerRuleResult & { career_brain?: CareerBrainOutput }) | null {
  if (!raw || typeof raw !== 'object') return null

  const candidate = raw as UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  const brain =
    normalizeCareerBrainOutput(candidate.career_brain ?? aiState.career_brain_result) ?? null

  const summary =
    typeof candidate.summary === 'string' && candidate.summary.trim()
      ? candidate.summary
      : brain?.whyThisPath ??
        brain?.growCareerGrowth?.finalReport?.careerSummary ??
        brain?.businessDiscoveryGrowth?.summary ??
        'Your personalised career plan'

  const workNowDirections = candidate.work_now?.directions ?? []
  const normalized: UkCareerRuleResult & { career_brain?: CareerBrainOutput } = {
    summary,
    work_now: {
      directions: Array.isArray(workNowDirections) ? workNowDirections : [],
    },
    improve_later: candidate.improve_later ?? null,
    avoid: Array.isArray(candidate.avoid) ? candidate.avoid : [],
    next_step: candidate.next_step ?? 'Continue your career plan',
    ...(brain ? { career_brain: brain } : {}),
  }

  return isUkCareerRuleResult(normalized) ? normalized : null
}

export function parseGuestAssessmentSnapshot(
  snapshot: CaResultSnapshot | null = loadCaResultSnapshot()
): {
  result: UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  aiState: Record<string, unknown>
  aiPersonalized: AiPersonalizedUkResult | null
  sessionId: string
  timestamp: number
} | null {
  if (!snapshot?.result?.result) return null

  const aiState = (snapshot.aiState ?? {}) as Record<string, unknown>
  const result = normalizeStoredRuleResult(snapshot.result.result, aiState)
  if (!result) return null

  return {
    result,
    aiState,
    aiPersonalized: (snapshot.aiEnrichment ?? null) as AiPersonalizedUkResult | null,
    sessionId: snapshot.sessionId,
    timestamp: snapshot.timestamp,
  }
}

export function hasPendingGuestAssessment(): boolean {
  return Boolean(parseGuestAssessmentSnapshot())
}
