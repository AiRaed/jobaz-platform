/**
 * AI User Profile — dashboard and personalization types.
 *
 * Future: AI-generated plans, conversations, memory context, predictive recs, custom journeys.
 */

import type { AiEvolutionStage } from '@/lib/jobaz-ai/engine/evolveStage'
import type { JourneyEntry } from '@/lib/jobaz-ai/engine'
import type { AiPersonalizedAssessmentResult } from '@/lib/jobaz-ai/assessment/types'
import type { StoredRichActionPlan } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { CareerStage, ProgressTrend } from './careerStage'

export type ProgressionMeta = {
  appliedKeys?: string[]
  writingReviewCount?: number
  jobsSavedCount?: number
  jobsAppliedCount?: number
  interviewSessionsCount?: number
  cvQualityImprovements?: number
  lessonsCompleted?: number
  previousReadinessScore?: number
  previousEngagementScore?: number
  previousCareerStage?: CareerStage
  aiPersonalizedAssessment?: AiPersonalizedAssessmentResult | null
}

export type AiUserProfileTool = {
  id: string
  name: string
  href: string
}

export type AiUserProfile = {
  id: string
  userId: string | null
  anonymousId: string | null
  sessionId: string | null
  dominantGoal: string | null
  englishLevel: string | null
  experienceLevel: string | null
  cvStatus: string | null
  lastRecommendedPath: string | null
  preferredTools: AiUserProfileTool[]
  recommendedJobs: string[]
  readinessScore: number
  engagementScore: number
  assessmentCount: number
  lastAssessmentId: string | null
  careerStage: CareerStage
  evolutionStage: AiEvolutionStage | null
  strongestArea: string | null
  weakestArea: string | null
  progressionMeta: ProgressionMeta
  progressTrend: ProgressTrend
  aiPersonalizedAssessment: AiPersonalizedAssessmentResult | null
  recommendationReason: string | null
  nextAction: string | null
  weeklyFocus: string | null
  storedActionPlan: StoredRichActionPlan | null
  journeySummary: JourneyEntry[]
  lastAiUpdate: string | null
  lastActiveAt: string
  createdAt: string
  updatedAt: string
}

export type DashboardRecommendationType =
  | 'cv'
  | 'english'
  | 'jobs'
  | 'interview'
  | 'path'
  | 'skills'
  | 'general'

export type DashboardRecommendation = {
  id: string
  type: DashboardRecommendationType
  title: string
  description: string
  href: string
  toolId: string
  toolName: string
}

export type AiActionPlanPriority = 'high' | 'medium' | 'low'

export type AiActionPlanTask = {
  label: string
  toolName: string
  route: string
  priority: AiActionPlanPriority
  estimatedMinutes?: number
}

export type AiActionPlan = {
  title: string
  summary: string
  weeklyTasks: AiActionPlanTask[]
}

export type DashboardAiInsights = {
  currentPath: string | null
  careerStage: CareerStage
  evolutionStage: AiEvolutionStage | null
  evolutionStageLabel: string | null
  progressTrend: ProgressTrend
  progressTrendLabel: string
  strongestArea: string | null
  readinessScore: number
  nextAction: string
  suggestedTools: DashboardRecommendation[]
  continuePathHref: string
  continueToolId: string
  continueToolName: string
  weakestArea: string
  retakeAssessmentHref: string
  goalLabel: string | null
  isReturning: boolean
  lastRecommendedPath: string | null
  recommendations: DashboardRecommendation[]
  personalizedSummary: string | null
  whyThisPathFits: string | null
  confidenceNote: string | null
  weeklyFocus: string | null
}
