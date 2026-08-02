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
import { supabase } from '@/lib/supabase'
import {
  invalidateAssessmentBundleCache,
  resolveAssessmentBundle,
} from '@/lib/dashboard/careerOs/assessmentLoader'
import { generateCareerRoadmap } from '@/lib/dashboard/careerOs/careerRoadmap'
import type { AssessmentBundle } from '@/lib/dashboard/careerOs/planFromAssessment'
import type { CareerRoadmap, PlanActivitySignals } from '@/lib/dashboard/careerOs/types'
import { isJobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'

type Input = PlanActivitySignals

export type CareerPlanSyncStatus = 'none' | 'local_only' | 'synced'

const CAREER_PLAN_REFRESH_KEYS = new Set([
  CA_RESULT_STORAGE_KEY,
  CAREER_PLAN_STORAGE_KEY,
  TRAINING_ROUTES_STORAGE_KEY,
  'jobaz_plan_v1',
  'jobaz_pending_career_plan',
])

function mergeLocalJobazPlan(bundle: AssessmentBundle | null): AssessmentBundle | null {
  if (!bundle || typeof window === 'undefined') return bundle
  try {
    const raw = localStorage.getItem('jobaz_plan_v1')
    if (!raw) return bundle
    const plan = JSON.parse(raw) as unknown
    if (!isJobAZPlan(plan)) return bundle
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

function resolveSyncStatus(transfer: GuestTransferResult | null, hasBundle: boolean): CareerPlanSyncStatus {
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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const activeUserIdRef = useRef<string | null | undefined>(undefined)
  const mountedRef = useRef(true)

  const refresh = useCallback(async (options?: { reconcile?: boolean; force?: boolean }) => {
    const requestId = ++requestIdRef.current
    setLoaded(false)

    let transferResult: GuestTransferResult | null = null
    const LOAD_TIMEOUT_MS = 12_000

    const loadPlan = async () => {
      if (options?.reconcile !== false) {
        await reconcileAuthUserCaches()
      }

      const userId = await resolveAuthenticatedUserId()
      if (!mountedRef.current || requestId !== requestIdRef.current) return null

      // Wait for a real session before treating a miss as "no plan" after login.
      // Still allow guest local loads when userId is null.
      activeUserIdRef.current = userId

      if (userId) {
        promotePendingCareerPlan()
        if (hasPendingGuestAssessment()) {
          transferResult = await transferGuestAssessmentOnAuth(userId)
          invalidateAssessmentBundleCache()
        }
      }

      if (!mountedRef.current || requestId !== requestIdRef.current) return null

      return mergeLocalJobazPlan(
        await resolveAssessmentBundle({ force: options?.force !== false })
      )
    }

    try {
      const timedOut = new Promise<never>((_, reject) => {
        const ms = LOAD_TIMEOUT_MS
        setTimeout(() => reject(new Error('Career plan load timed out')), ms)
      })
      const next = await Promise.race([loadPlan(), timedOut])
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setBundle(next)
      setSyncStatus(resolveSyncStatus(transferResult, Boolean(next)))
    } catch (error) {
      console.error('[useGeneratedCareerPlan] Failed to load career plan — showing empty fallback:', error)
      if (!mountedRef.current || requestId !== requestIdRef.current) return
      setBundle(null)
      setSyncStatus('none')
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoaded(true)
      }
    }
  }, [])

  const scheduleRefresh = useCallback(
    (options?: { reconcile?: boolean; force?: boolean }) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = setTimeout(() => {
        void refresh(options)
      }, 250)
    },
    [refresh]
  )

  useEffect(() => {
    mountedRef.current = true
    // Always force on mount so a prior logout's empty miss cannot stick
    void refresh({ reconcile: true, force: true })

    const onUpdate = () => {
      invalidateAssessmentBundleCache()
      scheduleRefresh({ reconcile: false, force: true })
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.key || !CAREER_PLAN_REFRESH_KEYS.has(event.key)) return
      invalidateAssessmentBundleCache()
      scheduleRefresh({ reconcile: false, force: true })
    }

    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
    window.addEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
    window.addEventListener('jobaz-ai-profile-updated', onUpdate)
    window.addEventListener('jobaz-applied-jobs-changed', onUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)
    window.addEventListener('storage', onStorage)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return

      const nextUserId = session?.user?.id ?? null
      const prevUserId = activeUserIdRef.current

      if (event === 'SIGNED_OUT') {
        // Clear UI immediately — do not refetch as guest (that poisoned the module cache)
        invalidateAssessmentBundleCache()
        activeUserIdRef.current = null
        requestIdRef.current += 1
        setBundle(null)
        setSyncStatus('none')
        setLoaded(true)
        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        (event === 'INITIAL_SESSION' && nextUserId && nextUserId !== prevUserId)
      ) {
        invalidateAssessmentBundleCache()
        activeUserIdRef.current = nextUserId
        setBundle(null)
        setLoaded(false)
        scheduleRefresh({ reconcile: true, force: true })
        return
      }

      // Other auth events (e.g. PASSWORD_RECOVERY) — still refresh safely
      if (nextUserId !== prevUserId) {
        invalidateAssessmentBundleCache()
        setLoaded(false)
        scheduleRefresh({ reconcile: true, force: true })
      }
    })

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
      window.removeEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
      window.removeEventListener('jobaz-ai-profile-updated', onUpdate)
      window.removeEventListener('jobaz-applied-jobs-changed', onUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
      subscription.unsubscribe()
    }
  }, [refresh, scheduleRefresh])

  const roadmap: CareerRoadmap | null = useMemo(() => {
    if (!bundle) return null
    return generateCareerRoadmap(bundle, signals)
  }, [bundle, signals])

  return {
    roadmap,
    plan: roadmap,
    hasAssessment: Boolean(bundle),
    loaded,
    refresh,
    bundle,
    syncStatus,
  }
}

/** Notify dashboard after Career Assistant completes */
export function notifyCareerPlanGenerated(): void {
  if (typeof window === 'undefined') return
  invalidateAssessmentBundleCache()
  window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
}
