/**
 * After signup/login: merge anonymous ai_user_profiles (and linked rows) into the authenticated user.
 * Best-effort — never throws.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId, getOrCreateSessionId } from './identity'
import { memoryDevLog } from './logger'
import { profileLog, profileLogError } from './profileLog'

type StoredTool = { id: string; name: string; href: string }

type ProfileRow = {
  id: string
  user_id: string | null
  anonymous_id: string | null
  dominant_goal: string | null
  english_level: string | null
  experience_level: string | null
  cv_status: string | null
  last_recommended_path: string | null
  preferred_tools: unknown
  recommended_jobs: unknown
  readiness_score: number
  engagement_score: number
  assessment_count: number
  last_assessment_id: string | null
  career_stage: string | null
  strongest_area: string | null
  weakest_area: string | null
  progression_meta: unknown
  recommendation_reason: string | null
  next_action: string | null
  action_plan: unknown
  weekly_focus: string | null
  ai_journey_summary: unknown
  current_stage: string | null
  last_ai_update: string | null
  last_active_at: string
  created_at: string
}

function parseTools(raw: unknown): StoredTool[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (t): t is StoredTool =>
      typeof t === 'object' &&
      t !== null &&
      typeof (t as StoredTool).id === 'string' &&
      typeof (t as StoredTool).name === 'string' &&
      typeof (t as StoredTool).href === 'string'
  )
}

function parseJobs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((j): j is string => typeof j === 'string' && j.trim().length > 0)
}

function mergeTools(a: unknown, b: unknown): StoredTool[] {
  const map = new Map<string, StoredTool>()
  for (const t of [...parseTools(a), ...parseTools(b)]) map.set(t.id, t)
  return Array.from(map.values())
}

function mergeJobs(a: unknown, b: unknown): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const j of [...parseJobs(a), ...parseJobs(b)]) {
    if (!seen.has(j)) {
      seen.add(j)
      out.push(j)
    }
  }
  return out
}

function pickNewer(primary: ProfileRow, secondary: ProfileRow): ProfileRow {
  return new Date(primary.last_active_at) >= new Date(secondary.last_active_at)
    ? primary
    : secondary
}

function buildMergedPayload(
  userId: string,
  primary: ProfileRow,
  secondary: ProfileRow
): Record<string, unknown> {
  const newer = pickNewer(primary, secondary)
  const older = newer.id === primary.id ? secondary : primary
  const now = new Date().toISOString()

  return {
    user_id: userId,
    anonymous_id: null,
    dominant_goal: newer.dominant_goal ?? older.dominant_goal,
    english_level: newer.english_level ?? older.english_level,
    experience_level: newer.experience_level ?? older.experience_level,
    cv_status: newer.cv_status ?? older.cv_status,
    last_recommended_path:
      newer.last_recommended_path ?? older.last_recommended_path,
    preferred_tools: mergeTools(primary.preferred_tools, secondary.preferred_tools),
    recommended_jobs: mergeJobs(primary.recommended_jobs, secondary.recommended_jobs),
    readiness_score: Math.max(primary.readiness_score, secondary.readiness_score),
    engagement_score: Math.max(primary.engagement_score, secondary.engagement_score),
    assessment_count: primary.assessment_count + secondary.assessment_count,
    last_assessment_id:
      newer.last_assessment_id ?? older.last_assessment_id,
    career_stage: newer.career_stage ?? older.career_stage,
    strongest_area: newer.strongest_area ?? older.strongest_area,
    weakest_area: newer.weakest_area ?? older.weakest_area,
    progression_meta: newer.progression_meta ?? older.progression_meta,
    recommendation_reason:
      newer.recommendation_reason ?? older.recommendation_reason,
    next_action: newer.next_action ?? older.next_action,
    action_plan: newer.action_plan ?? older.action_plan,
    weekly_focus: newer.weekly_focus ?? older.weekly_focus,
    ai_journey_summary: newer.ai_journey_summary ?? older.ai_journey_summary,
    current_stage: newer.current_stage ?? older.current_stage,
    last_ai_update: now,
    updated_at: now,
  }
}

async function linkAnonymousRows(
  userId: string,
  anonymousId: string,
  sessionId?: string | null
): Promise<void> {
  const { error: assessmentError } = await supabase
    .from('ai_career_assessments')
    .update({ user_id: userId })
    .eq('anonymous_id', anonymousId)
    .is('user_id', null)

  if (assessmentError) {
    profileLogError('Link assessments to user failed', assessmentError)
  }

  if (sessionId) {
    const { error: sessionAssessmentError } = await supabase
      .from('ai_career_assessments')
      .update({ user_id: userId })
      .eq('session_id', sessionId)
      .is('user_id', null)

    if (sessionAssessmentError) {
      profileLogError('Link session assessments to user failed', sessionAssessmentError)
    }
  }

  const { error: eventsError } = await supabase
    .from('ai_career_events')
    .update({ user_id: userId })
    .eq('anonymous_id', anonymousId)
    .is('user_id', null)

  if (eventsError) {
    profileLogError('Link events to user failed', eventsError)
  }
}

/**
 * Merges local anonymous AI profile into the signed-in user account.
 */
export async function mergeAnonymousAiProfileOnAuth(userId: string): Promise<void> {
  if (typeof window === 'undefined' || !userId) return

  const anonymousId = getOrCreateAnonymousId()?.trim()
  const sessionId = getOrCreateSessionId()?.trim() || null
  if (!anonymousId) return

  try {
    profileLog('start', { step: 'mergeAnonymousAiProfileOnAuth', userId, anonymousId, sessionId })

    const { data: anonProfile, error: anonError } = await supabase
      .from('ai_user_profiles')
      .select('*')
      .eq('anonymous_id', anonymousId)
      .is('user_id', null)
      .maybeSingle()

    if (anonError) {
      profileLogError('Anonymous profile lookup failed', anonError)
      return
    }

    if (!anonProfile) {
      await linkAnonymousRows(userId, anonymousId, sessionId)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
      }
      return
    }

    const anon = anonProfile as ProfileRow

    const { data: userProfile, error: userError } = await supabase
      .from('ai_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (userError) {
      profileLogError('User profile lookup failed', userError)
      return
    }

    if (!userProfile) {
      const { error: claimError } = await supabase
        .from('ai_user_profiles')
        .update({
          user_id: userId,
          anonymous_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', anon.id)

      if (claimError) {
        profileLogError('Claim anonymous profile failed', claimError)
        memoryDevLog('Claim anonymous profile failed', claimError)
        return
      }

      await linkAnonymousRows(userId, anonymousId, sessionId)
      profileLog('update result', { step: 'merge_claimed', profileId: anon.id })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
      }
      return
    }

    const user = userProfile as ProfileRow
    const merged = buildMergedPayload(userId, user, anon)

    const { error: updateError } = await supabase
      .from('ai_user_profiles')
      .update(merged)
      .eq('id', user.id)

    if (updateError) {
      profileLogError('Merge into user profile failed', updateError)
      return
    }

    const { error: deleteError } = await supabase
      .from('ai_user_profiles')
      .delete()
      .eq('id', anon.id)

    if (deleteError) {
      profileLogError('Delete merged anonymous profile failed', deleteError)
    }

    await linkAnonymousRows(userId, anonymousId, sessionId)
    profileLog('update result', {
      step: 'merge_combined',
      userProfileId: user.id,
      removedAnonId: anon.id,
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jobaz-career-plan-generated-updated'))
    }
  } catch (err) {
    memoryDevLog('mergeAnonymousAiProfileOnAuth error', err)
    profileLogError('mergeAnonymousAiProfileOnAuth threw', err)
  }
}
