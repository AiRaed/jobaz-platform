/**
 * Writing Review 2.0 — shared types for API, client, and UI.
 */

export type ProofreadingAnalyzeMode = 'general' | 'academic' | 'academic_research'

export type IssueSeverity = 'low' | 'moderate' | 'high'

export type IssueDisplaySeverity = 'Critical' | 'Important' | 'Minor'

export type AnalyzedIssue = {
  id?: string
  type: string
  severity: IssueSeverity
  message: string
  original_text: string
  suggestion_text?: string
  start_index?: number
  end_index?: number
  startIndex?: number
  endIndex?: number
  action?: 'replace' | 'delete' | 'insert'
  status?: 'open' | 'applied' | 'rejected'
}

export type DocumentInsight = {
  id: string
  label: string
  score: number
  description?: string
}

export type JobAZRecommendedAction = {
  id: string
  label: string
  href: string
  why: string
  icon?: 'cv' | 'interview' | 'career' | 'translate' | 'jobs' | 'courses'
}

export type WritingReviewReport = {
  scoreLabel: string
  score: number
  estimatedScoreAfterFixes: number
  strengths: string[]
  areasToImprove: string[]
  issueCounts: {
    total: number
    critical: number
    important: number
    minor: number
    open: number
    applied: number
  }
  documentInsights: DocumentInsight[]
  recommendedActions: JobAZRecommendedAction[]
  recommendedTools: JobAZRecommendedAction[]
  recommendedCareerResources: JobAZRecommendedAction[]
  nextJobAZStep: JobAZRecommendedAction | null
  documentKind: 'cv' | 'cover_letter' | 'academic' | 'business' | 'general'
}

export type WritingReviewAnalyzeResponse = {
  ok: true
  issues: AnalyzedIssue[]
  review: WritingReviewReport
  metadata?: Record<string, unknown>
}
