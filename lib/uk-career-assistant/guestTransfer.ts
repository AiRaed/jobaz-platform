/**
 * Transfer guest Career Brain assessment into the authenticated account.
 * Best-effort — never throws.
 */

import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import { clearGuestAssessmentSnapshot } from '@/lib/career-engine/clearSharedCareerCache'
import { notifyProfileUpdated } from '@/lib/jobaz-ai/emitSignal'
import { notifyCareerPlanGenerated } from '@/hooks/useGeneratedCareerPlan'
import {
  CA_RESULT_STORAGE_KEY,
  hasPendingGuestAssessment,
  parseGuestAssessmentSnapshot,
} from './guestSession'
import { persistCareerAssistantResult } from './persistAssessmentResult'

export type GuestTransferResult = {
  attempted: boolean
  foundLocal: boolean
  supabaseSaved: boolean
  localHydrated: boolean
  error?: string
}

export { hasPendingGuestAssessment, parseGuestAssessmentSnapshot }

/**
 * Saves guest snapshot to the signed-in account (assessment, journey, courses, jobs plan).
 */
export async function transferGuestAssessmentOnAuth(
  explicitUserId?: string | null
): Promise<GuestTransferResult> {
  const outcome: GuestTransferResult = {
    attempted: false,
    foundLocal: false,
    supabaseSaved: false,
    localHydrated: false,
  }

  const userId = await resolveAuthenticatedUserId(explicitUserId)

  if (typeof window === 'undefined' || !userId) {
    console.log('[guestTransfer] skipped — missing window or auth user id')
    return outcome
  }

  console.log('[guestTransfer] save user id', userId)
  console.log('[guestTransfer] auth.uid from Supabase', userId)
  console.log('[guestTransfer] checking localStorage key', CA_RESULT_STORAGE_KEY)

  const parsed = parseGuestAssessmentSnapshot()
  if (!parsed) {
    console.log('[guestTransfer] no valid guest assessment snapshot found')
    return outcome
  }

  outcome.attempted = true
  outcome.foundLocal = true
  console.log('[guestTransfer] found local result', {
    sessionId: parsed.sessionId,
    timestamp: parsed.timestamp,
  })

  try {
    console.log('[guestTransfer] save started')
    const saveResult = await persistCareerAssistantResult({
      result: parsed.result,
      aiState: parsed.aiState,
      aiPersonalized: parsed.aiPersonalized,
      source: 'guest_transfer',
    })

    outcome.supabaseSaved = saveResult.ok
    outcome.localHydrated = true

    if (saveResult.ok) {
      console.log('[guestTransfer] save success', { assessmentId: saveResult.assessmentId })
      clearGuestAssessmentSnapshot()
      notifyProfileUpdated()
      notifyCareerPlanGenerated()
    } else {
      outcome.error = saveResult.error ?? 'Assessment save failed'
      console.error('[guestTransfer] save error', outcome.error)
      notifyCareerPlanGenerated()
    }

    return outcome
  } catch (err) {
    outcome.error = err instanceof Error ? err.message : 'Transfer failed'
    console.error('[guestTransfer] save error', err)
    notifyCareerPlanGenerated()
    return outcome
  }
}

export function getGuestTransferSyncStatus(): 'none' | 'local_only' | 'synced' {
  if (hasPendingGuestAssessment()) return 'local_only'
  return 'none'
}
