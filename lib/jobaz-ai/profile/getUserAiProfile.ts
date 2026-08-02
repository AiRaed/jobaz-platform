/**
 * Fetches the latest AI profile for the logged-in user (by user_id).
 * Client-safe; returns null when logged out, missing, or on error — never throws.
 */

import { supabase } from '@/lib/supabase'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import {
  careerStageFromReadiness,
  computeProgressTrend,
  type CareerStage,
} from './careerStage'
import type { StoredRichActionPlan } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { JourneyEntry } from '@/lib/jobaz-ai/engine'
import { parseEvolutionStage } from '@/lib/jobaz-ai/engine/evolveStage'
import type { AiPersonalizedAssessmentResult } from '@/lib/jobaz-ai/assessment/types'
import type { AiUserProfile, AiUserProfileTool, ProgressionMeta } from './types'

type ProfileRow = {
  id: string
  user_id: string | null
  anonymous_id: string | null
  session_id: string | null
  dominant_goal: string | null
  english_level: string | null
  experience_level: string | null
  cv_status: string | null
  last_recommended_path: string | null
  preferred_tools: unknown
  recommended_jobs: unknown
  readiness_score: number | null
  engagement_score: number | null
  assessment_count: number | null
  last_assessment_id: string | null
  career_stage: string | null
  strongest_area: string | null
  weakest_area: string | null
  progression_meta: unknown
  recommendation_reason: string | null
  next_action: string | null
  action_plan: unknown
  ai_journey_summary: unknown
  weekly_focus: string | null
  last_ai_update: string | null
  current_stage: string | null
  last_active_at: string
  created_at: string
  updated_at: string
}

function parseTools(raw: unknown): AiUserProfileTool[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (t): t is AiUserProfileTool =>
      typeof t === 'object' &&
      t !== null &&
      typeof (t as AiUserProfileTool).id === 'string' &&
      typeof (t as AiUserProfileTool).name === 'string' &&
      typeof (t as AiUserProfileTool).href === 'string'
  )
}

function parseJobs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((j): j is string => typeof j === 'string' && j.trim().length > 0)
}

function parseCareerStage(raw: string | null, readiness: number): CareerStage {
  const allowed: CareerStage[] = ['Beginner', 'Active', 'Prepared', 'Job Ready']
  if (raw && allowed.includes(raw as CareerStage)) return raw as CareerStage
  return careerStageFromReadiness(readiness)
}

function parseAiPersonalizedAssessment(raw: unknown): AiPersonalizedAssessmentResult | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as AiPersonalizedAssessmentResult
  if (
    typeof m.personalisedSummary !== 'string' ||
    typeof m.whyThisPathFits !== 'string' ||
    typeof m.nextBestAction !== 'string'
  ) {
    return null
  }
  return m
}

function parseProgressionMeta(raw: unknown): ProgressionMeta {
  if (!raw || typeof raw !== 'object') return {}
  const m = raw as ProgressionMeta
  return {
    appliedKeys: Array.isArray(m.appliedKeys) ? m.appliedKeys : [],
    writingReviewCount:
      typeof m.writingReviewCount === 'number' ? m.writingReviewCount : 0,
    previousReadinessScore:
      typeof m.previousReadinessScore === 'number' ? m.previousReadinessScore : undefined,
    previousEngagementScore:
      typeof m.previousEngagementScore === 'number' ? m.previousEngagementScore : undefined,
    previousCareerStage: m.previousCareerStage,
    aiPersonalizedAssessment: parseAiPersonalizedAssessment(m.aiPersonalizedAssessment),
  }
}

function parseJourney(raw: unknown): JourneyEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is JourneyEntry =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as JourneyEntry).label === 'string' &&
      typeof (e as JourneyEntry).occurredAt === 'string'
  )
}

function parseStoredActionPlan(raw: unknown): StoredRichActionPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const plan = raw as StoredRichActionPlan
  if (!Array.isArray(plan.weeklyTasks) || plan.weeklyTasks.length === 0) return null
  const weeklyTasks = plan.weeklyTasks.filter(
    (t) =>
      typeof t === 'object' &&
      t !== null &&
      typeof t.label === 'string' &&
      typeof t.route === 'string'
  )
  if (weeklyTasks.length === 0) return null
  return {
    title: typeof plan.title === 'string' ? plan.title : "This Week's AI Action Plan",
    summary: typeof plan.summary === 'string' ? plan.summary : '',
    weeklyTasks,
  }
}

function mapRow(row: ProfileRow): AiUserProfile {
  const readinessScore = row.readiness_score ?? 0
  const progressionMeta = parseProgressionMeta(row.progression_meta)
  const careerStage = parseCareerStage(row.career_stage, readinessScore)
  const evolutionStage = parseEvolutionStage(row.current_stage)

  return {
    id: row.id,
    userId: row.user_id,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    dominantGoal: row.dominant_goal,
    englishLevel: row.english_level,
    experienceLevel: row.experience_level,
    cvStatus: row.cv_status,
    lastRecommendedPath: row.last_recommended_path,
    preferredTools: parseTools(row.preferred_tools),
    recommendedJobs: parseJobs(row.recommended_jobs),
    readinessScore,
    engagementScore: row.engagement_score ?? 0,
    assessmentCount: row.assessment_count ?? 0,
    lastAssessmentId: row.last_assessment_id,
    careerStage,
    evolutionStage,
    strongestArea: row.strongest_area,
    weakestArea: row.weakest_area,
    progressionMeta,
    aiPersonalizedAssessment: progressionMeta.aiPersonalizedAssessment ?? null,
    recommendationReason: row.recommendation_reason,
    nextAction: row.next_action,
    weeklyFocus: row.weekly_focus,
    storedActionPlan: parseStoredActionPlan(row.action_plan),
    journeySummary: parseJourney(row.ai_journey_summary),
    lastAiUpdate: row.last_ai_update,
    progressTrend: computeProgressTrend(
      readinessScore,
      progressionMeta.previousReadinessScore
    ),
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getUserAiProfile(): Promise<AiUserProfile | null> {
  if (typeof window === 'undefined') return null

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const userId = session?.user?.id
    if (!userId) return null

    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      memoryDevLog('Profile fetch by user_id failed', error)
      return null
    }

    return data ? mapRow(data as ProfileRow) : null
  } catch (err) {
    memoryDevLog('Profile fetch error', err)
    return null
  }
}
