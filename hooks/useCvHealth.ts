'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { analyzeCvHealth } from '@/lib/cv-optimization'
import type { CvData } from '@/app/cv-builder-v2/page'
import type { CareerPlanForCvReadiness } from '@/lib/cv/calculateCvReadiness'

export function useCvHealth(
  cvData: CvData,
  jobDescription: string,
  careerPlan?: CareerPlanForCvReadiness
) {
  const report = useMemo(
    () => analyzeCvHealth(cvData, jobDescription, careerPlan ?? null),
    [cvData, jobDescription, careerPlan]
  )

  const prevScore = useRef(report.overallScore)
  const [scoreDelta, setScoreDelta] = useState<number | null>(null)

  useEffect(() => {
    const delta = report.overallScore - prevScore.current
    if (delta !== 0 && prevScore.current !== report.overallScore) {
      setScoreDelta(delta)
      const t = setTimeout(() => setScoreDelta(null), 3500)
      prevScore.current = report.overallScore
      return () => clearTimeout(t)
    }
    prevScore.current = report.overallScore
  }, [report.overallScore])

  return { report, scoreDelta }
}
