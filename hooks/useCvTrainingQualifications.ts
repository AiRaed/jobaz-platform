'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CAREER_PLAN_UPDATED_EVENT } from '@/lib/career-hub/myPlan'
import {
  invalidateAssessmentBundleCache,
  resolveAssessmentBundle,
} from '@/lib/dashboard/careerOs/assessmentLoader'
import { generateCareerRoadmap } from '@/lib/dashboard/careerOs/careerRoadmap'
import {
  qualificationFromRequirement,
  type CvTrainingQualification,
} from '@/lib/cv-builder/trainingQualifications'
import { useCareerPlan } from './useCareerPlan'

export function useCvTrainingQualifications() {
  const { items: planItems } = useCareerPlan()
  const planItemsRef = useRef(planItems)
  planItemsRef.current = planItems
  const [qualifications, setQualifications] = useState<CvTrainingQualification[]>([])
  const [roadmapReadinessPercent, setRoadmapReadinessPercent] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async (force = false) => {
    if (force) invalidateAssessmentBundleCache()
    const bundle = await resolveAssessmentBundle({ force })
    if (!bundle) {
      setQualifications([])
      setRoadmapReadinessPercent(0)
      setLoaded(true)
      return
    }

    const signals = {
      planItems: planItemsRef.current,
      savedJobsCount: 0,
      appliedJobsCount: 0,
      interviewConfidence: 0,
      cvQualityScore: 0,
      hasBaseCv: true,
      cvReady: false,
    }

    const roadmap = generateCareerRoadmap(bundle, signals)
    setQualifications(roadmap.requirements.map(qualificationFromRequirement))
    setRoadmapReadinessPercent(roadmap.careerReadinessPercent)
    setLoaded(true)
  }, [])

  useEffect(() => {
    void refresh(false)

    const onUpdate = () => {
      void refresh(true)
    }

    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
    window.addEventListener('jobaz-career-plan-generated-updated', onUpdate)
    window.addEventListener('jobaz-cv-qualifications-updated', onUpdate)
    return () => {
      window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
      window.removeEventListener('jobaz-career-plan-generated-updated', onUpdate)
      window.removeEventListener('jobaz-cv-qualifications-updated', onUpdate)
    }
  }, [refresh])

  const completedCount = qualifications.filter((q) => q.status === 'completed').length

  return {
    qualifications,
    completedCount,
    totalCount: qualifications.length,
    roadmapReadinessPercent,
    loaded,
    refresh,
  }
}
