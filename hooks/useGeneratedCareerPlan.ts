'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAREER_PLAN_STORAGE_KEY, CAREER_PLAN_UPDATED_EVENT } from '@/lib/career-hub/myPlan'
import { TRAINING_ROUTES_STORAGE_KEY, TRAINING_ROUTES_UPDATED_EVENT } from '@/lib/career-hub/trainingPlan'
import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import { reconcileAuthUserCaches } from '@/lib/auth/clearStaleAuthCache'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import {
  transferGuestAssessmentOnAuth,
  hasPendingGuestAssessment,
  type GuestTransferResult,
} from '@/lib/uk-career-assistant/guestTransfer'
import { promotePendingCareerPlan } from '@/lib/uk-career-assistant/pendingCareerPlan'
import { promotePendingPlanItems } from '@/lib/career-assistant/add-to-my-plan/promotePendingPlanItems'
import {
  fetchActivePlanFromServer,
  syncLocalMirrorAfterServerSave,
  type ActivePlanClientPayload,
} from '@/lib/career-assistant/add-to-my-plan/activePlanClient'
import { supabase } from '@/lib/supabase'
import {
  invalidateAssessmentBundleCache,
  resolveAssessmentBundle,
} from '@/lib/dashboard/careerOs/assessmentLoader'
import { generateCareerRoadmap } from '@/lib/dashboard/careerOs/careerRoadmap'
import type { AssessmentBundle } from '@/lib/dashboard/careerOs/planFromAssessment'
import type { CareerRoadmap, PlanActivitySignals } from '@/lib/dashboard/careerOs/types'
import { normalizeJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'

type Input = PlanActivitySignals

export type CareerPlanSyncStatus = 'none' | 'local_only' | 'synced'

const CAREER_PLAN_REFRESH_KEYS = new Set([
  CA_RESULT_STORAGE_KEY,
  CAREER_PLAN_STORAGE_KEY,
  TRAINING_ROUTES_STORAGE_KEY,
  'jobaz_plan_v1',
  'jobaz_pending_career_plan',
])

/** Guest-only: overlay local jobaz_plan_v1. Logged-in users must use Supabase. */
function mergeLocalJobazPlanForGuest(bundle: AssessmentBundle | null): AssessmentBundle | null {
  if (!bundle || typeof window === 'undefined') return bundle
  try {
    const raw = localStorage.getItem('jobaz_plan_v1')
    if (!raw) return bundle
    const plan = normalizeJobAZPlan(JSON.parse(raw) as unknown)
    if (!plan) return bundle
    return {
      ...bundle,
      aiState: {
        ...bundle.aiState,
        jobaz_plan: plan,
      },
    }
  } catch {
    return bundle
  }
}

function mergeServerJobazPlan(
  bundle: AssessmentBundle | null,
  jobazPlan: unknown,
  userId?: string | null
): AssessmentBundle | null {
  const plan = normalizeJobAZPlan(jobazPlan)
  if (!plan) return bundle
  if (bundle) {
    return {
      ...bundle,
      aiState: {
        ...bundle.aiState,
        jobaz_plan: plan,
      },
    }
  }
  // Allow My Plan to render from Supabase JobAZ plan even without an assessment row
  return {
    ruleResult: {
      pathId: plan.source_path_id,
      goal: plan.source_path_id,
    } as AssessmentBundle['ruleResult'],
    brain: null,
    aiState: { jobaz_plan: plan },
    trainingRoutes: [],
    completedAt: Date.now(),
    userId: userId ?? null,
  }
}

function resolveSyncStatus(
  transfer: GuestTransferResult | null,
  hasBundle: boolean,
  fromServer: boolean
): CareerPlanSyncStatus {
  if (fromServer) return 'synced'
  if (transfer?.supabaseSaved) return 'synced'
  if (transfer?.foundLocal && !transfer.supabaseSaved && hasBundle) return 'local_only'
  if (hasPendingGuestAssessment() && hasBundle) return 'local_only'
  if (hasBundle) return 'synced'
  return 'none'
}

export function useGeneratedCareerPlan(signals: Input) {
  const [bundle, setBundle] = useState<AssessmentBundle | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [syncStatus, setSyncStatus] = useState<CareerPlanSyncStatus>('none')
  const [activeMeta, setActiveMeta] = useState<ActivePlanClientPayload | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const activeUserIdRef = useRef<string | null | undefined>(undefined)
  const mountedRef = useRef(true)
  const bundleRef = useRef<AssessmentBundle | null>(null)
  bundleRef.current = bundle

  const refresh = useCallback(async (options?: { reconcile?: boolean; force?: boolean; soft?: boolean }) => {
    const requestId = ++requestIdRef.current
    // Soft refresh keeps the previous plan visible (avoids blank My Plan during HMR / auth churn).
    // Hard blank only on first load or explicit user-switch.
    if (!options?.soft && !bundleRef.current) {
      setLoaded(false)
    }

    let transferResult: GuestTransferResult | null = null
    let fromServer = false
    const LOAD_TIMEOUT_MS = 12_000

    const loadPlan = async () => {
      if (options?.reconcile !== false) {
        await reconcileAuthUserCaches()
      }

      const userId = await resolveAuthenticatedUserId()
      if (!mountedRef.current || requestId !== requestIdRef.current) return null

      activeUserIdRef.current = userId

      if (userId) {
        promotePendingCareerPlan()
        await promotePendingPlanItems()
        if (hasPendingGuestAssessment()) {
          transferResult = await transferGuestAssessmentOnAuth(userId)
          invalidateAssessmentBundleCache()
        }
      }

      if (!mountedRef.current || requestId !== requestIdRef.current) return null

      const assessment = await resolveAssessmentBundle({ force: options?.force !== false })

      if (userId) {
        // Supabase is the source of truth for logged-in users — never prefer stale localStorage.
        const active = await fetchActivePlanFromServer()
        if (!mountedRef.current || requestId !== requestIdRef.current) return null
        setActiveMeta(active)
        if (active?.jobaz_plan) {
          fromServer = true
          syncLocalMirrorAfterServerSave(active.jobaz_plan)
          return mergeServerJobazPlan(assessment, active.jobaz_plan, userId)
        }
        // No server JobAZ plan yet — do not overlay stale localStorage from another session
        return assessment
      }

      setActiveMeta(null)
      return mergeLocalJobazPlanForGuest(assessment)
    }

    try {
      const timedOut = new Promise<never>((_, reject) => {
        const ms = LOAD_TIMEOUT_MS
        setTimeout(() => reject(new Error('Career plan load timed out')), ms)
      })
      const next = await Promise.race([loadPlan(), timedOut])
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setBundle(next)
      setSyncStatus(resolveSyncStatus(transferResult, Boolean(next), fromServer))
    } catch (error) {
      console.error('[useGeneratedCareerPlan] Failed to load career plan — keeping previous plan if any:', error)
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      // Only clear when we had nothing — avoid blanking a working plan after a flaky refresh
      if (!bundleRef.current) {
        setBundle(null)
        setSyncStatus('none')
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoaded(true)
      }
    }
  }, [])

  const scheduleRefresh = useCallback(
    (options?: { reconcile?: boolean; force?: boolean; soft?: boolean }) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = setTimeout(() => {
        void refresh({ soft: true, ...options })
      }, 250)
    },
    [refresh]
  )

  useEffect(() => {
    mountedRef.current = true
    void refresh({ reconcile: true, force: true, soft: false })

    const onUpdate = () => {
      invalidateAssessmentBundleCache()
      scheduleRefresh({ reconcile: false, force: true, soft: true })
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.key || !CAREER_PLAN_REFRESH_KEYS.has(event.key)) return
      invalidateAssessmentBundleCache()
      scheduleRefresh({ reconcile: false, force: true, soft: true })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
      window.addEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
      window.addEventListener('jobaz-ai-profile-updated', onUpdate)
      window.addEventListener('jobaz-applied-jobs-changed', onUpdate)
      window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)
      window.addEventListener('storage', onStorage)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return

      const nextUserId = session?.user?.id ?? null
      const prevUserId = activeUserIdRef.current

      if (event === 'SIGNED_OUT') {
        invalidateAssessmentBundleCache()
        activeUserIdRef.current = null
        requestIdRef.current += 1
        setBundle(null)
        setActiveMeta(null)
        setSyncStatus('none')
        setLoaded(true)
        return
      }

      // Ignore INITIAL_SESSION when user id unchanged — prevents Fast Refresh blanking
      if (event === 'INITIAL_SESSION' && nextUserId === prevUserId) {
        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        (event === 'INITIAL_SESSION' && nextUserId && nextUserId !== prevUserId)
      ) {
        invalidateAssessmentBundleCache()
        activeUserIdRef.current = nextUserId
        // Soft: keep previous plan visible while reloading for the same browser session
        if (nextUserId !== prevUserId) {
          setBundle(null)
          setLoaded(false)
          scheduleRefresh({ reconcile: true, force: true, soft: false })
        } else {
          scheduleRefresh({ reconcile: true, force: true, soft: true })
        }
        return
      }

      if (nextUserId !== prevUserId) {
        invalidateAssessmentBundleCache()
        setBundle(null)
        setLoaded(false)
        scheduleRefresh({ reconcile: true, force: true, soft: false })
      }
    })

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
        window.removeEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
        window.removeEventListener('jobaz-ai-profile-updated', onUpdate)
        window.removeEventListener('jobaz-applied-jobs-changed', onUpdate)
        window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
        window.removeEventListener('storage', onStorage)
      }
      subscription.unsubscribe()
    }
  }, [refresh, scheduleRefresh])

  const roadmap: CareerRoadmap | null = useMemo(() => {
    if (!bundle) return null
    try {
      return generateCareerRoadmap(bundle, signals)
    } catch (error) {
      console.error('[useGeneratedCareerPlan] generateCareerRoadmap failed:', error)
      return null
    }
  }, [bundle, signals])

  return {
    roadmap,
    plan: roadmap,
    hasAssessment: Boolean(bundle),
    loaded,
    refresh,
    bundle,
    syncStatus,
    activePlanMeta: activeMeta,
  }
}

/** Notify dashboard after Career Assistant completes */
export function notifyCareerPlanGenerated(): void {
  if (typeof window === 'undefined') return
  invalidateAssessmentBundleCache()
  window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
}
