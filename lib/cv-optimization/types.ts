import type { CvScoreResult } from '@/lib/cv-score'

export type CvHealthMetric = {
  id: string
  label: string
  value: number | string
  display: string
  tone: 'good' | 'medium' | 'low' | 'neutral'
  tooltip: string
  progress?: number
}

export type CvWorkflowStep = {
  id: 'build' | 'ats' | 'impact' | 'cover' | 'interview'
  label: string
  status: 'complete' | 'active' | 'locked' | 'recommended'
  progress: number
  hint: string
}

export type CvAiButtonHint = {
  id: 'summary' | 'experience' | 'skills' | 'grammar' | 'analyze'
  label: string
  impactLabel: string
  estimatedDelta: number
}

export type CvHealthReport = {
  overallScore: number
  metrics: CvHealthMetric[]
  workflowSteps: CvWorkflowStep[]
  aiHints: CvAiButtonHint[]
  missingSections: string[]
  cvScore: CvScoreResult
  atsMatch: number
  /** Potential readiness after recommended improvements */
  potentialScore: number
  statusLabel: string
  planCvMatch: 'no_cv' | 'empty_cv' | 'mismatch' | 'partial_match' | 'good_match' | 'none'
  suggestedNextStep: string
}

export type AutoImproveStage =
  | 'idle'
  | 'analyze'
  | 'keywords'
  | 'summary'
  | 'experience'
  | 'skills'
  | 'grammar'
  | 'done'

export type AutoImproveResult = {
  stagesCompleted: string[]
  improvements: string[]
  scoreBefore: number
  scoreAfter: number
}
