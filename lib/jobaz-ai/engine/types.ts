/**
 * Central AI Intelligence Engine — shared types.
 */

import type { CareerStage } from '@/lib/jobaz-ai/profile/careerStage'
import type { StoredRichActionPlan } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { DashboardRecommendation } from '@/lib/jobaz-ai/profile/types'

/** Unified signals from all JobAZ tools. */
export type AiSignalType =
  | 'cv_created'
  | 'cv_updated'
  | 'cv_quality_improved'
  | 'cv_exported'
  | 'writing_review_completed'
  | 'writing_review_used'
  | 'grammar_improved'
  | 'professional_writing_improved'
  | 'interview_completed'
  | 'interview_started'
  | 'interview_question_answered'
  | 'interview_training_completed'
  | 'voice_training_completed'
  | 'mock_interview_completed'
  | 'confidence_improved'
  | 'confidence_practice_completed'
  | 'jobs_viewed'
  | 'job_detail_viewed'
  | 'jobs_saved'
  | 'jobs_applied'
  | 'applied_job_saved'
  | 'skill_path_viewed'
  | 'skill_path_started'
  | 'skill_goal_selected'
  | 'lesson_completed'
  | 'ai_assessment_completed'
  | 'ai_dashboard_tool_clicked'
  | 'flow_abandoned'

export type ScoreDelta = {
  readiness?: number
  engagement?: number
  englishConfidence?: number
  jobSearchActivity?: number
}

export type ProfileEnginePatch = {
  cv_status?: string
  english_level?: string
  dominant_goal?: string
}

export type AiSignalRule = {
  readiness?: number
  engagement?: number
  journeyLabel: string
  dedupe: 'once' | 'daily' | 'none'
  patch?: ProfileEnginePatch
  metaKey?: keyof EngineProgressionMeta
}

export type EngineProgressionMeta = {
  appliedKeys?: string[]
  writingReviewCount?: number
  jobsSavedCount?: number
  jobsAppliedCount?: number
  jobSearchActivityScore?: number
  interviewSessionsCount?: number
  cvQualityImprovements?: number
  lessonsCompleted?: number
  englishConfidenceScore?: number
  previousReadinessScore?: number
  previousEngagementScore?: number
  previousCareerStage?: CareerStage
}

export type JourneyEntry = {
  id: string
  label: string
  signal: AiSignalType
  occurredAt: string
}

export type ProfileEngineRow = {
  id: string
  user_id: string | null
  anonymous_id: string | null
  dominant_goal: string | null
  english_level: string | null
  experience_level: string | null
  cv_status: string | null
  last_recommended_path: string | null
  readiness_score: number | null
  engagement_score: number | null
  assessment_count: number | null
  career_stage: string | null
  current_stage: string | null
  strongest_area: string | null
  weakest_area: string | null
  recommendation_reason: string | null
  next_action: string | null
  weekly_focus: string | null
  action_plan: unknown
  ai_journey_summary: unknown
  progression_meta: EngineProgressionMeta | null
  last_active_at: string | null
  last_ai_update: string | null
}

export type EngineInsights = {
  strongestArea: string
  weakestArea: string
  nextAction: string
  recommendationReason: string
  weeklyFocus: string
  careerStage: CareerStage
  currentStage: CareerStage
  readinessScore: number
  engagementScore: number
  actionPlan: StoredRichActionPlan
  recommendations: DashboardRecommendation[]
  journeySummary: JourneyEntry[]
}

export type EmitAiSignalOptions = {
  dedupeId?: string
  metadata?: Record<string, unknown>
  page?: string
}

export type UpdateUserProfileInput = {
  signal: AiSignalType
  userId?: string | null
  anonymousId?: string | null
  dedupeId?: string
  impact?: ScoreDelta
  metadata?: Record<string, unknown>
}

export const INACTIVITY_DAYS = 14
export const INACTIVITY_ENGAGEMENT_PENALTY = 5
