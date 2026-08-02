'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { analyzeApplication, computeScoreDeltas } from '@/lib/job-application'
import type { ApplicationAnalysis, ApplicationAnalysisInput, ScoreDelta } from '@/lib/job-application'

export function useApplicationAnalysis(input: ApplicationAnalysisInput) {
  const analysis = useMemo(() => analyzeApplication(input), [
    input.job.title,
    input.job.description,
    input.cvSummary,
    input.coverLetterText,
    input.cvSkills?.join(','),
    input.statuses.cvStatus,
    input.statuses.coverStatus,
    input.statuses.applicationStatus,
    input.statuses.trainingStatus,
    input.aiFitScore,
    input.aiStrengths?.join('|'),
    input.aiWeaknesses?.join('|'),
    input.aiMissingSkills?.join('|'),
  ])

  const prevRef = useRef<ApplicationAnalysis | null>(null)
  const [deltas, setDeltas] = useState<ScoreDelta[]>([])

  useEffect(() => {
    const nextDeltas = computeScoreDeltas(prevRef.current, analysis)
    if (nextDeltas.length > 0 && prevRef.current) {
      setDeltas(nextDeltas)
      const t = setTimeout(() => setDeltas([]), 4000)
      prevRef.current = analysis
      return () => clearTimeout(t)
    }
    prevRef.current = analysis
  }, [analysis])

  return { analysis, deltas }
}
