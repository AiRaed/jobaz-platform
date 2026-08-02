'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  findCvSuggestionRule,
  resolveCvSuggestions,
  type CvPlanStageId,
  type ResolvedCvSuggestions,
} from '@/lib/cv-builder/suggestions'
import { getCourseInterestForMatch } from '@/lib/cv-builder/courseInterest'
import { loadCareerPlanItems } from '@/lib/career-hub/myPlan'
import { certificationTitle } from '@/lib/cv/cvCertification'
import type { CvCareerPlanContext } from '@/lib/cv-builder/careerPlanContext'
import type { CvData } from '@/app/cv-builder-v2/page'

const STAGE_OVERRIDE_KEY = 'jobaz_cv_plan_stage_v1'

function readStageOverride(): CvPlanStageId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STAGE_OVERRIDE_KEY)
    if (raw === 'work_now' || raw === 'after_upgrade') return raw
  } catch {
    // ignore
  }
  return null
}

function writeStageOverride(stage: CvPlanStageId | null) {
  if (typeof window === 'undefined') return
  try {
    if (!stage) localStorage.removeItem(STAGE_OVERRIDE_KEY)
    else localStorage.setItem(STAGE_OVERRIDE_KEY, stage)
  } catch {
    // ignore
  }
}

type Args = {
  plan: CvCareerPlanContext | null
  routeTitle?: string | null
  currentTarget?: string | null
  nextUpgrade?: string | null
  cvData: CvData
}

/**
 * Plan-aware CV suggestions. Resolves only after mount so SSR/CSR HTML matches
 * (localStorage course interest / career plan items must not run during hydration).
 */
export function useCvPlanSuggestions({
  plan,
  routeTitle,
  currentTarget,
  nextUpgrade,
  cvData,
}: Args) {
  const [hydrated, setHydrated] = useState(false)
  const [stageOverride, setStageOverrideState] = useState<CvPlanStageId | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setStageOverrideState(readStageOverride())
    setHydrated(true)
    const refresh = () => setTick((n) => n + 1)
    window.addEventListener('jobaz-course-interest-updated', refresh)
    window.addEventListener('jobaz-career-plan-updated', refresh)
    return () => {
      window.removeEventListener('jobaz-course-interest-updated', refresh)
      window.removeEventListener('jobaz-career-plan-updated', refresh)
    }
  }, [])

  const setStageOverride = (stage: CvPlanStageId) => {
    setStageOverrideState(stage)
    writeStageOverride(stage)
  }

  const suggestions: ResolvedCvSuggestions | null = useMemo(() => {
    if (!hydrated) return null

    void tick
    const title = routeTitle || plan?.planTitle || plan?.pathLabel || null
    const target = currentTarget || plan?.currentTarget || plan?.targetRole || null
    const upgrade = nextUpgrade || plan?.nextUpgrade || null

    const matched = findCvSuggestionRule(title, target)
    const interest = matched
      ? getCourseInterestForMatch(matched.upgradeTrainingMatch)
      : null
    const planItems = loadCareerPlanItems().map((i) => ({
      title: i.courseName,
      status: i.status,
    }))
    const certTitles = (cvData.certifications ?? []).map((c) =>
      typeof c === 'string' ? c : certificationTitle(c)
    )

    return resolveCvSuggestions({
      routeTitle: title,
      currentTarget: target,
      nextUpgrade: upgrade,
      stageOverride,
      upgradeTrainingStatus: interest?.status ?? null,
      planItemStatuses: planItems,
      cvCertificationTitles: certTitles,
    })
  }, [
    hydrated,
    plan,
    routeTitle,
    currentTarget,
    nextUpgrade,
    cvData.certifications,
    stageOverride,
    tick,
  ])

  return {
    suggestions,
    stageOverride,
    setStageOverride,
    hydrated,
  }
}
