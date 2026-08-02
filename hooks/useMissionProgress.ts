'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CAREER_PLAN_UPDATED_EVENT } from '@/lib/career-hub/myPlan'

export type MissionProgress = {
  hasBaseCv: boolean
  cvReady: boolean
  appliedJobsCount: number
  savedJobsCount: number
  trainingStarted: boolean
  loaded: boolean
}

const CV_DRAFT_KEY = 'jobaz-cv-v2-draft'

function readCvFromStorage(): { hasBaseCv: boolean; cvReady: boolean } {
  if (typeof window === 'undefined') return { hasBaseCv: false, cvReady: false }
  try {
    const raw = localStorage.getItem(CV_DRAFT_KEY)
    if (!raw) return { hasBaseCv: false, cvReady: false }
    const draft = JSON.parse(raw) as { summary?: string; experience?: unknown[]; skills?: unknown[] }
    const hasBaseCv = Boolean(
      draft.summary?.trim() ||
        (Array.isArray(draft.experience) && draft.experience.length > 0) ||
        (Array.isArray(draft.skills) && draft.skills.length > 0)
    )
    return { hasBaseCv, cvReady: hasBaseCv && Boolean(draft.summary?.trim()) }
  } catch {
    return { hasBaseCv: false, cvReady: false }
  }
}

function readTrainingStarted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('jobaz_career_plan_v1')
    if (!raw) return false
    const items = JSON.parse(raw) as Array<{ status?: string }>
    return Array.isArray(items) && items.some((i) => i.status === 'in_progress' || i.status === 'completed')
  } catch {
    return false
  }
}

export function useMissionProgress(): MissionProgress {
  const [state, setState] = useState<MissionProgress>({
    hasBaseCv: false,
    cvReady: false,
    appliedJobsCount: 0,
    savedJobsCount: 0,
    trainingStarted: false,
    loaded: false,
  })

  const refresh = useCallback(async () => {
    const cv = readCvFromStorage()
    const trainingStarted = readTrainingStarted()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setState({
        ...cv,
        appliedJobsCount: 0,
        savedJobsCount: 0,
        trainingStarted,
        loaded: true,
      })
      return
    }

    let appliedJobsCount = 0
    let savedJobsCount = 0

    try {
      const [appliedRes, savedRes] = await Promise.all([
        fetch('/api/jobs/applied/list', { cache: 'no-store' }),
        fetch('/api/saved-jobs/list', { cache: 'no-store' }),
      ])
      if (appliedRes.ok) {
        const body = (await appliedRes.json()) as { jobs?: unknown[] }
        appliedJobsCount = body.jobs?.length ?? 0
      }
      if (savedRes.ok) {
        const body = (await savedRes.json()) as { jobs?: unknown[] }
        savedJobsCount = body.jobs?.length ?? 0
      }
    } catch {
      // keep zeros
    }

    setState({
      ...cv,
      appliedJobsCount,
      savedJobsCount,
      trainingStarted,
      loaded: true,
    })
  }, [])

  useEffect(() => {
    void refresh()
    const onUpdate = () => {
      void refresh()
    }
    window.addEventListener('jobaz-applied-jobs-changed', onUpdate)
    window.addEventListener('jobaz-cv-saved', onUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)
    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onUpdate)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => {
      window.removeEventListener('jobaz-applied-jobs-changed', onUpdate)
      window.removeEventListener('jobaz-cv-saved', onUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
      window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
      window.removeEventListener('storage', onUpdate)
      subscription.unsubscribe()
    }
  }, [refresh])

  return state
}
