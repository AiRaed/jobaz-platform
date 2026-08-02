'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  invalidateAssessmentBundleCache,
  resolveAssessmentBundle,
} from '@/lib/dashboard/careerOs/assessmentLoader'
import { buildIntelligenceProfileFromUk } from '@/lib/career-journey/engine'
import { composeCareerJourneySnapshot } from '@/lib/career-journey/storage'
import type { AssessmentBundle } from '@/lib/dashboard/careerOs/planFromAssessment'
import type { CareerJourneySnapshot, JourneySignalInput } from '@/lib/career-journey/types'

function snapshotFromBundle(
  bundle: AssessmentBundle | null,
  signals: JourneySignalInput
): CareerJourneySnapshot {
  if (!bundle) {
    return composeCareerJourneySnapshot({ ...signals, hasAssessment: false })
  }

  const profile = buildIntelligenceProfileFromUk({
    result: bundle.ruleResult,
    answers: bundle.aiState.answers as Record<string, unknown> | undefined,
    aiSummary: bundle.brain?.personalizedSummary ?? null,
    readinessScore: bundle.brain?.employabilityScore,
  })

  const enrichedSignals: JourneySignalInput = {
    ...signals,
    hasAssessment: true,
    readinessScore: Math.max(signals.readinessScore, bundle.brain?.employabilityScore ?? 0),
  }

  return composeCareerJourneySnapshot(enrichedSignals, {
    profile,
    readinessScore: enrichedSignals.readinessScore,
    hasCompletedAssessment: true,
    updatedAt: new Date(bundle.completedAt).toISOString(),
  })
}

export function useCareerJourney(signals: JourneySignalInput) {
  const [bundle, setBundle] = useState<AssessmentBundle | null>(null)
  const [loaded, setLoaded] = useState(false)
  const signalsRef = useRef(signals)
  signalsRef.current = signals
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  const refresh = useCallback(async (force = true) => {
    const requestId = ++requestIdRef.current
    const next = await resolveAssessmentBundle({ force })
    if (!mountedRef.current || requestId !== requestIdRef.current) return
    setBundle(next)
    setLoaded(true)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void refresh(true)

    const onUpdate = () => {
      invalidateAssessmentBundleCache()
      void refresh(true)
    }
    window.addEventListener('jobaz-ai-profile-updated', onUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') return

      if (event === 'SIGNED_OUT') {
        invalidateAssessmentBundleCache()
        requestIdRef.current += 1
        setBundle(null)
        setLoaded(true)
        return
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        invalidateAssessmentBundleCache()
        setLoaded(false)
        void refresh(true)
      }
    })

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      window.removeEventListener('jobaz-ai-profile-updated', onUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
      subscription.unsubscribe()
    }
  }, [refresh])

  const snapshot = useMemo(
    () => (loaded ? snapshotFromBundle(bundle, signals) : null),
    [loaded, bundle, signals]
  )

  const primaryAction = useMemo(
    () => snapshot?.nextActions.find((a) => a.priority === 'primary') ?? snapshot?.nextActions[0] ?? null,
    [snapshot]
  )

  return {
    snapshot,
    primaryAction,
    refresh,
    hasUserAssessment: Boolean(bundle),
  }
}
