/**
 * Plan-aware CV suggestion types — backed by `@/lib/career-routes`.
 */

import type { CourseInterestStatus } from '@/lib/cv-builder/courseInterest'

export type CvPlanStageId = 'work_now' | 'after_upgrade'

export type CvSummarySuggestionId = 'work_now' | 'after_upgrade' | 'general'

export type TrainingMentionStatus =
  | 'none'
  | 'interested'
  | 'in_progress'
  | 'completed'

export type CvQualificationSuggestion = {
  label: string
  mode: 'completed_only' | 'in_progress_ok' | 'always_optional'
  match: RegExp
}

export type CvRouteSuggestionRule = {
  id: string
  matchRoute: (routeTitle: string, currentTarget?: string) => boolean
  routeLabel: string
  workNowTarget: string
  afterUpgradeTarget: string
  afterUpgradeSearchQuery: string
  workNowSearchQuery: string
  stageLabels: {
    work_now: string
    after_upgrade: string
  }
  summarySuggestions: Array<{
    id: CvSummarySuggestionId
    buttonLabel: string
    helperText: string
    requiresCompletedUpgrade?: boolean
    warning?: string
    buildSummary: (ctx: {
      trainingStatus: TrainingMentionStatus
      currentTarget: string
      nextUpgrade: string
    }) => string
  }>
  skills: string[]
  experienceBullets: string[]
  qualifications: CvQualificationSuggestion[]
  upgradeTrainingMatch: RegExp
}

export type ResolvedCvSuggestions = {
  rule: CvRouteSuggestionRule
  routeTitle: string
  trainingStatus: TrainingMentionStatus
  recommendedStage: CvPlanStageId
  activeStage: CvPlanStageId
  currentTarget: string
  nextUpgrade: string
  jobSearchQuery: string
  stageLabel: string
  summarySuggestions: CvRouteSuggestionRule['summarySuggestions']
  skills: string[]
  experienceBullets: string[]
  qualificationSuggestions: Array<CvQualificationSuggestion & { allowed: boolean; hint: string }>
  afterTrainingButtonLabel?: string
  workNowButtonLabel?: string
  afterTrainingWarning?: string | null
  routeAnalyticsKey?: string
  primaryTrainingTitle?: string
}

export type ResolveCvSuggestionsInput = {
  routeTitle?: string | null
  currentTarget?: string | null
  nextUpgrade?: string | null
  stageOverride?: CvPlanStageId | null
  upgradeTrainingStatus?: CourseInterestStatus | 'not_started' | null
  planItemStatuses?: Array<{ title: string; status: string }>
  cvCertificationTitles?: string[]
}
