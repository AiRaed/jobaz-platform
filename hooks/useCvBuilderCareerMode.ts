'use client'

import { useEffect, useMemo, useState } from 'react'
import { invalidateAssessmentBundleCache } from '@/lib/dashboard/careerOs/assessmentLoader'
import {
  loadCvCareerPlanContext,
  loadCvCareerPlanContextAsync,
  getCvRoleHeadline,
  type CvCareerPlanContext,
} from '@/lib/cv-builder/careerPlanContext'
import { CAREER_PLAN_UPDATED_EVENT } from '@/lib/career-hub/myPlan'
import { useMissionProgress } from '@/hooks/useMissionProgress'

export function useCvBuilderCareerMode() {
  const [plan, setPlan] = useState<CvCareerPlanContext | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const mission = useMissionProgress()

  useEffect(() => {
    let cancelled = false

    const refresh = (forceBundle = false) => {
      if (forceBundle) invalidateAssessmentBundleCache()
      setPlan(loadCvCareerPlanContext())
      void loadCvCareerPlanContextAsync().then((next) => {
        if (!cancelled) setPlan(next)
      })
    }

    refresh(false)
    setHydrated(true)

    const onPlanUpdate = () => refresh(true)
    const onSoftRefresh = () => refresh(false)

    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onPlanUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onPlanUpdate)
    // CV save does not change active assessment — soft refresh only
    window.addEventListener('jobaz-cv-saved', onSoftRefresh)
    window.addEventListener('jobaz-cv-qualifications-updated', onSoftRefresh)
    return () => {
      cancelled = true
      window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onPlanUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onPlanUpdate)
      window.removeEventListener('jobaz-cv-saved', onSoftRefresh)
      window.removeEventListener('jobaz-cv-qualifications-updated', onSoftRefresh)
    }
  }, [])

  const isCareerMode = Boolean(plan?.active)

  const roleHeadline = useMemo(
    () => (plan ? getCvRoleHeadline(plan) : 'Build your CV for your next UK role.'),
    [plan]
  )

  return { hydrated, isCareerMode, plan, roleHeadline, mission }
}
