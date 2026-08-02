/**
 * Persist Career Assistant result to Supabase (logged-in) and local plan artifacts.
 */

import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { resolveAuthenticatedUserId, logAuthUserIdMatch } from '@/lib/auth/resolveUserId'
import { recordCareerPlanSaveDebug } from '@/lib/dashboard/careerOs/debugTrace'
import { saveJourneyFromUkResult } from '@/lib/career-journey/storage'
import {
  extractGenericCourseRecommendations,
  extractUkTransitionRecommendations,
} from '@/lib/career-hub/recommendations'
import { extractTrainingPlanRoutes, saveTrainingRoutes } from '@/lib/career-hub/trainingPlan'
import { saveRecommendationsToPlan } from '@/lib/career-hub/myPlan'
import type { AiPersonalizedUkResult } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { saveUnifiedCareerAssessment } from '@/lib/jobaz-ai/memory'
import { notifyProfileUpdated } from '@/lib/jobaz-ai/emitSignal'
import { notifyCareerPlanGenerated } from '@/hooks/useGeneratedCareerPlan'

const TABLE = 'ai_career_assessments'

export type PersistAssessmentResult = {
  ok: boolean
  assessmentId?: string
  error?: string
  table: string
  userId?: string | null
}

function persistPlanArtifacts(params: {
  result: UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  aiState: Record<string, unknown>
  aiPersonalized?: AiPersonalizedUkResult | null
}): void {
  saveJourneyFromUkResult({
    result: params.result,
    answers: params.aiState.answers as Record<string, unknown> | undefined,
    aiSummary: params.aiPersonalized?.personalisedSummary ?? null,
  })

  const careerBrain = params.result.career_brain
  const ukGrowth = careerBrain?.ukTransitionGrowth
  if (ukGrowth) {
    const steps = extractUkTransitionRecommendations(ukGrowth)
    if (steps.length) {
      saveRecommendationsToPlan(
        steps.map((s) => ({
          courseName: s.courseName,
          pathId: s.pathId,
          routeLabel: s.routeLabel,
          priority: s.priority,
        }))
      )
    }
    const interestArea = String((params.aiState.answers as Record<string, unknown> | undefined)?.ntuk_interest_area ?? '')
    const trainingRoutes = extractTrainingPlanRoutes(ukGrowth, interestArea || null)
    if (trainingRoutes.length) saveTrainingRoutes(trainingRoutes)
    return
  }

  const courses = careerBrain?.recommendedCourses
  const generic = extractGenericCourseRecommendations(courses)
  if (generic.length) {
    saveRecommendationsToPlan(
      generic.map((s) => ({
        courseName: s.courseName,
        pathId: s.pathId,
        priority: s.priority,
      }))
    )
  }
}

export async function persistCareerAssistantResult(params: {
  result: UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  aiState: Record<string, unknown>
  aiPersonalized?: AiPersonalizedUkResult | null
  userId?: string | null
  source?: string
}): Promise<PersistAssessmentResult> {
  const userId = await resolveAuthenticatedUserId(params.userId)
  console.log('[persistCareerAssistantResult] save user id', userId ?? '(guest)')
  await logAuthUserIdMatch({
    label: 'save',
    saveUserId: userId,
  })
  const payloadKeys = {
    hasSummary: Boolean(params.result.summary),
    hasWorkNow: Boolean(params.result.work_now),
    hasAvoid: Array.isArray(params.result.avoid),
    hasBrain: Boolean(params.result.career_brain),
    answerKeys: Object.keys((params.aiState.answers as Record<string, unknown> | undefined) ?? {}).length,
  }

  console.log('[persistCareerAssistantResult] save started', {
    table: TABLE,
    userId,
    source: params.source ?? 'unknown',
    payloadKeys,
  })

  persistPlanArtifacts(params)

  if (!userId) {
    console.log('[persistCareerAssistantResult] no userId — local artifacts only (Supabase insert skipped)')
    recordCareerPlanSaveDebug({
      userId: null,
      lastSave: {
        ok: false,
        error: 'No authenticated user — guest local snapshot only',
        table: TABLE,
        at: new Date().toISOString(),
        source: params.source,
      },
    })
    notifyCareerPlanGenerated()
    return { ok: true, table: TABLE, userId: null }
  }

  console.log('[CA persist] saveUnifiedCareerAssessment called', {
    table: TABLE,
    userId,
    source: params.source ?? 'unknown',
    payload: payloadKeys,
  })

  const saveResult = await saveUnifiedCareerAssessment(
    {
      assessmentType: 'uk_career_assistant',
      ukState: params.aiState,
      ukRuleResult: params.result,
      aiPersonalized: params.aiPersonalized ?? null,
    },
    { userId }
  )

  recordCareerPlanSaveDebug({
    userId,
    lastSave: {
      ok: saveResult.ok,
      assessmentId: saveResult.assessmentId,
      error: saveResult.error,
      table: TABLE,
      at: new Date().toISOString(),
      source: params.source,
    },
  })

  if (saveResult.ok) {
    console.log('[persistCareerAssistantResult] save success', {
      table: TABLE,
      userId,
      assessmentId: saveResult.assessmentId,
    })
    notifyProfileUpdated()
    notifyCareerPlanGenerated()
    return { ok: true, assessmentId: saveResult.assessmentId, table: TABLE, userId }
  }

  console.error('[persistCareerAssistantResult] save error', saveResult.error)
  notifyCareerPlanGenerated()
  return { ok: false, error: saveResult.error, table: TABLE, userId }
}
