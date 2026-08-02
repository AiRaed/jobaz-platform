'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CAREER_PLAN_UPDATED_EVENT } from '@/lib/career-hub/myPlan'
import { SAVED_PLAN_UPDATED_EVENT } from '@/lib/career-hub/marketplace/savedPlan'
import { TRAINING_ROUTES_UPDATED_EVENT } from '@/lib/career-hub/trainingPlan'
import { CAREER_PLAN_REFRESH_EVENT } from '@/lib/dashboard/careerOs/types'
import { resolveAssessmentBundle } from '@/lib/dashboard/careerOs/assessmentLoader'
import type { AssessmentBundle } from '@/lib/dashboard/careerOs/planFromAssessment'
import { composeTrainingCentre } from '@/lib/training/composeTrainingCentre'
import type { TrainingCentreState } from '@/lib/training/types'
import { supabase } from '@/lib/supabase'

export function useTrainingCentre() {
  const [bundle, setBundle] = useState<AssessmentBundle | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setLoaded(false)
    const next = await resolveAssessmentBundle()
    setBundle(next)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh()
    const onUpdate = () => {
      void refresh()
    }
    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
    window.addEventListener(SAVED_PLAN_UPDATED_EVENT, onUpdate)
    window.addEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
    window.addEventListener(CAREER_PLAN_REFRESH_EVENT, onUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)
    window.addEventListener('storage', onUpdate)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })

    return () => {
      window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
      window.removeEventListener(SAVED_PLAN_UPDATED_EVENT, onUpdate)
      window.removeEventListener(TRAINING_ROUTES_UPDATED_EVENT, onUpdate)
      window.removeEventListener(CAREER_PLAN_REFRESH_EVENT, onUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
      subscription.unsubscribe()
    }
  }, [refresh])

  const state: TrainingCentreState = useMemo(
    () => composeTrainingCentre(bundle),
    [bundle, loaded]
  )

  return { state, loaded, refresh, hasAssessment: Boolean(bundle) }
}
