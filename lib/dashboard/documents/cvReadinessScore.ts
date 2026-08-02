/**
 * Documents tab compatibility wrapper → shared calculateCvReadiness.
 */

import {
  calculateCvReadiness,
  type CvReadinessInput,
  type CvReadinessResult,
} from '@/lib/cv/calculateCvReadiness'

export type DashboardCvLike = CvReadinessInput

export type CvReadinessItem = {
  id: string
  label: string
  status: 'good' | 'needs_work' | 'missing'
}

export type CvReadinessReport = {
  percent: number
  statusLabel: 'Ready' | 'Needs improvement' | 'Missing' | 'Ready to improve' | 'Started' | 'Needs work' | 'Application ready'
  summaryLine: string
  nextImprovement: string
  checklist: CvReadinessItem[]
  /** Full shared result */
  readiness: CvReadinessResult
}

/** @deprecated Prefer calculateCvReadiness from `@/lib/cv/calculateCvReadiness`. */
export function computeDocumentsCvReadiness(
  cv: DashboardCvLike,
  planKeywords: string[] = []
): CvReadinessReport {
  const readiness = calculateCvReadiness(cv, {
    focusKeywords: planKeywords,
  })

  const checklist: CvReadinessItem[] = readiness.checks.map((c) => ({
    id: c.key,
    label: c.label,
    status: c.passed ? 'good' : c.severity === 'critical' ? 'missing' : 'needs_work',
  }))

  return {
    percent: readiness.score,
    statusLabel: readiness.statusLabel as CvReadinessReport['statusLabel'],
    summaryLine: readiness.summaryLine,
    nextImprovement: readiness.suggestedNextStep,
    checklist,
    readiness,
  }
}
