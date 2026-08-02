'use client'

import { useEffect, useState } from 'react'
import { logAuthUserIdMatch, resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import {
  getCareerPlanDebugDisplay,
  readCareerPlanDebugTrace,
  type CareerPlanDebugTrace,
} from '@/lib/dashboard/careerOs/debugTrace'
import { supabase } from '@/lib/supabase'
import { hasPendingGuestAssessment } from '@/lib/uk-career-assistant/guestSession'

type Props = {
  planHydrated?: boolean
  assessmentId?: string | null
  /** Dev-only: pass true to surface the panel locally. Never shown in production. */
  showDebug?: boolean
}

export default function CareerPlanDebugPanel({
  planHydrated,
  assessmentId,
  showDebug = false,
}: Props) {
  const [trace, setTrace] = useState<CareerPlanDebugTrace | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [idsMatch, setIdsMatch] = useState<boolean | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !showDebug) return

    const refresh = async () => {
      const authUid = await resolveAuthenticatedUserId()
      const nextTrace = readCareerPlanDebugTrace()
      setAuthUserId(authUid)

      await logAuthUserIdMatch({
        label: 'dashboard debug',
        dashboardUserId: authUid,
        saveUserId: nextTrace?.userId ?? null,
        loadUserId: nextTrace?.userId ?? null,
      })

      setTrace(nextTrace)
      setIdsMatch(
        !authUid
          ? !nextTrace?.userId
          : !nextTrace?.userId || nextTrace.userId === authUid
      )
    }

    void refresh()

    const onPlanUpdate = () => {
      void refresh()
    }
    window.addEventListener('jobaz-career-plan-generated-updated', onPlanUpdate)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })

    return () => {
      window.removeEventListener('jobaz-career-plan-generated-updated', onPlanUpdate)
      subscription.unsubscribe()
    }
  }, [showDebug])

  if (process.env.NODE_ENV !== 'development' || !showDebug) return null

  const display = getCareerPlanDebugDisplay(trace, { planHydrated, assessmentId })
  const traceUserId = trace?.userId ?? null
  const staleTrace = Boolean(authUserId && traceUserId && authUserId !== traceUserId)

  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-[11px] font-mono text-cyan-100/90 space-y-1">
      <p className="font-semibold text-cyan-200">Career Plan Debug (dev)</p>
      <p>auth.uid from Supabase: {authUserId ?? 'none'}</p>
      <p>dashboard user id: {authUserId ?? 'none'}</p>
      <p>trace user id: {traceUserId ?? 'none'}{staleTrace ? ' (STALE)' : ''}</p>
      <p>ids match: {idsMatch === null ? '…' : idsMatch && !staleTrace ? 'yes' : 'no'}</p>
      <p>localStorage result found: {display.localFound ? 'yes' : 'no'}</p>
      <p>Supabase assessment found: {display.supabaseFound ? 'yes' : 'no'}</p>
      <p>last save: {display.lastSaveLabel}</p>
      <p>last load: {display.lastLoadLabel}</p>
      <p>pending guest transfer: {hasPendingGuestAssessment() ? 'yes' : 'no'}</p>
      {planHydrated && display.supabaseFound && (
        <p className="text-emerald-300/90">dashboard plan hydrated: yes</p>
      )}
    </div>
  )
}
