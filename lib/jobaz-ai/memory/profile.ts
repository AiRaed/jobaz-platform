/**
 * AI User Profile Layer — long-term intelligence per visitor/user.
 *
 * Future consumers (not wired yet):
 * - Private AI context for providers
 * - Returning-user personalization on /ai-career-path
 * - Dashboard recommendations
 * - JobAZ AI memory / RAG context
 */

import { supabase } from '@/lib/supabase'
import type { AssessmentAnswers, CareerAssessmentResult, RecommendedTool } from '@/lib/jobaz-ai/types'
import {
  getAiPersonalizedFromStored,
  getRuleResultFromStored,
  type StoredCareerAssessmentResult,
} from '@/lib/jobaz-ai/assessment/types'
import { profileFieldsFromPersonalization } from '@/lib/jobaz-ai/assessment/mergePersonalization'
import { createRecordId } from './createRecordId'
import { memoryDevLog } from './logger'
import { profileLog, profileLogError } from './profileLog'
import { isUniqueViolation, isValidUuid, sanitizeProfilePayload } from './profilePayload'
import { generateRichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import { careerStageFromReadiness } from '@/lib/jobaz-ai/profile/careerStage'
import { computeEngagementScore, computeReadinessScore } from './profileScoring'

export type UpdateAiUserProfileInput = {
  userId?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  assessmentId: string | null
  answers: AssessmentAnswers
  result: CareerAssessmentResult | StoredCareerAssessmentResult
  richInsights?: RichCareerInsights
}

type StoredTool = { id: string; name: string; href: string }

type ProfileRow = {
  id: string
  assessment_count: number
  preferred_tools: unknown
  progression_meta: unknown
}

function extractProfileFields(answers: AssessmentAnswers) {
  return {
    dominant_goal: answers.helpNext,
    english_level: answers.english,
    experience_level: answers.experience,
    cv_status: answers.cv,
  }
}

function normalizeTools(tools: RecommendedTool[]): StoredTool[] {
  return tools.map((t) => ({ id: t.id, name: t.name, href: t.href }))
}

function parseStoredTools(raw: unknown): StoredTool[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (t): t is StoredTool =>
      typeof t === 'object' &&
      t !== null &&
      typeof (t as StoredTool).id === 'string' &&
      typeof (t as StoredTool).name === 'string'
  )
}

function mergePreferredTools(existing: unknown, incoming: RecommendedTool[]): StoredTool[] {
  const map = new Map<string, StoredTool>()
  for (const t of parseStoredTools(existing)) map.set(t.id, t)
  for (const t of normalizeTools(incoming)) map.set(t.id, t)
  return Array.from(map.values())
}

function isForeignKeyViolation(error: { code?: string } | null): boolean {
  return error?.code === '23503'
}

async function hasCareerEvent(
  eventName: string,
  userId: string | null,
  anonymousId: string | null
): Promise<boolean> {
  let query = supabase
    .from('ai_career_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', eventName)

  if (userId) {
    query = query.eq('user_id', userId)
  } else if (anonymousId) {
    query = query.eq('anonymous_id', anonymousId)
  } else {
    return false
  }

  const { count, error } = await query
  if (error) {
    profileLogError(`Event check failed: ${eventName}`, error)
    return false
  }
  return (count ?? 0) > 0
}

async function findExistingProfile(
  userId: string | null,
  anonymousId: string | null,
  sessionId: string | null
): Promise<ProfileRow | null> {
  const select =
    'id, assessment_count, preferred_tools, progression_meta'

  if (userId && isValidUuid(userId)) {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select(select)
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      profileLogError('Profile lookup by user_id', error)
    } else if (data) {
      return data as ProfileRow
    }
  }

  if (anonymousId) {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select(select)
      .eq('anonymous_id', anonymousId)
      .is('user_id', null)
      .order('last_active_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      profileLogError('Profile lookup by anonymous_id', error)
    } else if (data) {
      return data as ProfileRow
    }
  }

  if (sessionId) {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select(select)
      .eq('session_id', sessionId)
      .is('user_id', null)
      .order('last_active_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      profileLogError('Profile lookup by session_id', error)
    } else if (data) {
      return data as ProfileRow
    }
  }

  return null
}

/**
 * Upserts AI user profile from a completed career assessment.
 * Best-effort: never throws; failures are logged in development only.
 */
export async function updateAiUserProfileFromAssessment(
  input: UpdateAiUserProfileInput
): Promise<void> {
  if (typeof window === 'undefined') return

  const userId = input.userId && isValidUuid(input.userId) ? input.userId : null
  const anonymousId = userId ? null : input.anonymousId?.trim() || input.sessionId?.trim() || null
  const sessionId = input.sessionId?.trim() || null
  const assessmentId = input.assessmentId?.trim() || null

  profileLog('start', {
    userId,
    anonymousId,
    sessionId,
    assessmentId,
  })

  if (!assessmentId) {
    profileLog('start', { note: 'profile upsert without assessment FK', userId, anonymousId })
  }

  if (!userId && !anonymousId) {
    profileLogError('Missing user_id and anonymous_id', input)
    return
  }

  try {
    const existing = await findExistingProfile(userId, anonymousId, sessionId)
    profileLog('existing profile', existing)

    const ruleResult = getRuleResultFromStored(input.result)
    const aiPersonalized = getAiPersonalizedFromStored(input.result)

    const nextAssessmentCount = (existing?.assessment_count ?? 0) + 1
    const now = new Date().toISOString()

    const [hasSignupClick, hasToolClick] = await Promise.all([
      hasCareerEvent('ai_path_signup_clicked', userId, anonymousId),
      hasCareerEvent('ai_path_tool_clicked', userId, anonymousId),
    ])

    const readiness_score = computeReadinessScore(input.answers)
    const engagement_score = computeEngagementScore({
      assessmentCount: nextAssessmentCount,
      hasSignupClick,
      hasToolClick,
    })

    const rich =
      input.richInsights ??
      generateRichCareerInsights(input.answers, ruleResult, {
        assessmentCount: nextAssessmentCount,
        hasSignupClick,
        hasToolClick,
      })

    const profileCopy = profileFieldsFromPersonalization(rich, aiPersonalized)

    const fields = extractProfileFields(input.answers)
    const preferred_tools = mergePreferredTools(
      existing?.preferred_tools,
      ruleResult.recommendedTools
    )
    const recommended_jobs = ruleResult.suggestedJobs ?? []

    const existingMeta =
      existing?.progression_meta && typeof existing.progression_meta === 'object'
        ? (existing.progression_meta as Record<string, unknown>)
        : {}
    const progression_meta = aiPersonalized
      ? { ...existingMeta, aiPersonalizedAssessment: aiPersonalized }
      : existingMeta

    const payload = sanitizeProfilePayload({
      user_id: userId,
      anonymous_id: userId ? null : anonymousId,
      session_id: sessionId,
      ...fields,
      last_recommended_path: ruleResult.recommendedPath,
      preferred_tools,
      recommended_jobs,
      readiness_score,
      engagement_score,
      assessment_count: nextAssessmentCount,
      last_assessment_id: assessmentId && isValidUuid(assessmentId) ? assessmentId : null,
      career_stage: rich.careerStage ?? careerStageFromReadiness(readiness_score),
      current_stage: rich.careerStage ?? careerStageFromReadiness(readiness_score),
      strongest_area: rich.strongestArea,
      weakest_area: rich.weakestArea,
      recommendation_reason: profileCopy.recommendation_reason,
      next_action: profileCopy.next_action,
      weekly_focus: profileCopy.weekly_focus,
      progression_meta,
      action_plan: rich.actionPlan,
      ai_journey_summary: [
        {
          id: `j_assessment_${assessmentId}`,
          label: 'Completed AI Career Path assessment',
          signal: 'ai_assessment_completed',
          occurredAt: now,
        },
      ],
      last_ai_update: now,
      last_active_at: now,
      updated_at: now,
    })

    profileLog('payload', payload)

    if (existing) {
      const { error } = await supabase.from('ai_user_profiles').update(payload).eq('id', existing.id)

      profileLog('update result', { profileId: existing.id, error })

      if (error) {
        profileLogError('Profile update', error)
        memoryDevLog('Profile update failed', error)
      }
      return
    }

    const profileId = createRecordId()
    const insertRow = sanitizeProfilePayload({ id: profileId, ...payload, created_at: now })

    let { error } = await supabase.from('ai_user_profiles').insert(insertRow)

    profileLog('insert result', { profileId, error })

    if (error && isForeignKeyViolation(error)) {
      const { last_assessment_id: _removed, ...withoutFk } = payload
      profileLogError('FK on last_assessment_id — retrying insert without FK', error)
      const retryRow = sanitizeProfilePayload({
        id: profileId,
        ...withoutFk,
        last_assessment_id: null,
        created_at: now,
      })
      ;({ error } = await supabase.from('ai_user_profiles').insert(retryRow))
      profileLog('insert result', { profileId, retry: true, error })
    }

    if (error && isUniqueViolation(error)) {
      profileLogError('Profile insert unique conflict — retrying as update', error)
      const retryExisting = await findExistingProfile(userId, anonymousId, sessionId)
      if (retryExisting) {
        const { error: updateError } = await supabase
          .from('ai_user_profiles')
          .update(payload)
          .eq('id', retryExisting.id)
        profileLog('update result', { profileId: retryExisting.id, error: updateError, afterConflict: true })
        if (updateError) {
          profileLogError('Profile update after conflict', updateError)
          memoryDevLog('Profile update after conflict failed', updateError)
        }
        return
      }
    }

    if (error) {
      profileLogError('Profile insert', error)
      memoryDevLog('Profile insert failed', error)
    }
  } catch (err) {
    memoryDevLog('Profile update error', err)
    profileLogError('updateAiUserProfileFromAssessment threw', err)
  }
}
