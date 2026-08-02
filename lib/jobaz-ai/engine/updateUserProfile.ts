/**
 * Central profile updater — applies signals, recalculates intelligence, persists.
 */

import { supabase } from '@/lib/supabase'
import { getOrCreateAnonymousId, getOrCreateSessionId } from '@/lib/jobaz-ai/memory/identity'
import { createRecordId } from '@/lib/jobaz-ai/memory/createRecordId'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { careerStageFromReadiness, type CareerStage } from '@/lib/jobaz-ai/profile/careerStage'
import {
  evolveAiStage,
  legacyCareerStageFromEvolution,
  type AiEvolutionStage,
} from './evolveStage'
import {
  applyEnglishConfidenceDelta,
  englishLevelFromConfidence,
  getEnglishConfidenceScore,
} from './englishConfidence'
import { applyJobSearchActivityDelta } from './jobSearchActivity'
import { applyInactivityPenalty, deriveEngagementAfterSignal } from './calculateEngagement'
import { deriveReadinessAfterSignal, deriveStrongestWeakest } from './calculateReadiness'
import {
  generateNextAction,
  generateRecommendationReason,
  generateSmartRecommendations,
  generateWeeklyFocus,
} from './generateInsights'
import { generateWeeklyPlan } from './generateWeeklyPlan'
import { scheduleLocalAiProfileEnhancement } from '@/lib/jobaz-ai/local/scheduleEnhancement'
import { AI_SIGNAL_RULES, normalizeSignal } from './signals'
import type {
  AiSignalType,
  EngineProgressionMeta,
  JourneyEntry,
  ProfileEngineRow,
  UpdateUserProfileInput,
} from './types'

const MAX_JOURNEY_ENTRIES = 24

function parseMeta(raw: unknown): EngineProgressionMeta {
  if (!raw || typeof raw !== 'object') return {}
  const m = raw as EngineProgressionMeta
  return {
    appliedKeys: Array.isArray(m.appliedKeys) ? m.appliedKeys : [],
    writingReviewCount: typeof m.writingReviewCount === 'number' ? m.writingReviewCount : 0,
    jobsSavedCount: typeof m.jobsSavedCount === 'number' ? m.jobsSavedCount : 0,
    jobsAppliedCount: typeof m.jobsAppliedCount === 'number' ? m.jobsAppliedCount : 0,
    jobSearchActivityScore:
      typeof m.jobSearchActivityScore === 'number' ? m.jobSearchActivityScore : undefined,
    interviewSessionsCount:
      typeof m.interviewSessionsCount === 'number' ? m.interviewSessionsCount : 0,
    cvQualityImprovements:
      typeof m.cvQualityImprovements === 'number' ? m.cvQualityImprovements : 0,
    lessonsCompleted: typeof m.lessonsCompleted === 'number' ? m.lessonsCompleted : 0,
    englishConfidenceScore:
      typeof m.englishConfidenceScore === 'number' ? m.englishConfidenceScore : undefined,
    previousReadinessScore: m.previousReadinessScore,
    previousEngagementScore: m.previousEngagementScore,
    previousCareerStage: m.previousCareerStage,
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

function hasKey(meta: EngineProgressionMeta, key: string): boolean {
  return (meta.appliedKeys ?? []).includes(key)
}

function withKey(meta: EngineProgressionMeta, key: string): EngineProgressionMeta {
  return { ...meta, appliedKeys: [...(meta.appliedKeys ?? []), key].slice(-100) }
}

function bumpEnglish(current: string | null, count: number): string | null {
  if (!current) return 'basic'
  if (current === 'beginner' && count >= 2) return 'basic'
  if (current === 'basic' && count >= 4) return 'intermediate'
  if (current === 'intermediate' && count >= 8) return 'good'
  return current
}

function buildDedupeKey(
  signal: AiSignalType,
  rule: (typeof AI_SIGNAL_RULES)[AiSignalType],
  dedupeId?: string
): string {
  const day = new Date().toISOString().slice(0, 10)
  if (rule.dedupe === 'once') return `${signal}:${dedupeId ?? 'once'}`
  if (rule.dedupe === 'daily') return `${signal}:${dedupeId ?? day}`
  return `${signal}:${dedupeId ?? `${Date.now()}`}`
}

function appendJourney(
  existing: JourneyEntry[],
  signal: AiSignalType,
  label: string
): JourneyEntry[] {
  const entry: JourneyEntry = {
    id: `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    signal,
    occurredAt: new Date().toISOString(),
  }
  return [entry, ...existing].slice(0, MAX_JOURNEY_ENTRIES)
}

async function findProfileRow(
  userId: string | null,
  anonymousId: string | null
): Promise<ProfileEngineRow | null> {
  const select =
    'id, user_id, anonymous_id, dominant_goal, english_level, experience_level, cv_status, last_recommended_path, readiness_score, engagement_score, assessment_count, career_stage, current_stage, strongest_area, weakest_area, recommendation_reason, next_action, weekly_focus, action_plan, ai_journey_summary, progression_meta, last_active_at, last_ai_update'

  if (userId) {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select(select)
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      memoryDevLog('Engine profile lookup failed', error)
      return null
    }
    return data as ProfileEngineRow | null
  }

  if (anonymousId) {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select(select)
      .eq('anonymous_id', anonymousId)
      .is('user_id', null)
      .maybeSingle()
    if (error) {
      memoryDevLog('Engine anonymous lookup failed', error)
      return null
    }
    return data as ProfileEngineRow | null
  }

  return null
}

/** Creates a minimal profile row when a tool signal arrives before assessment. */
async function ensureProfileRow(
  userId: string | null,
  anonymousId: string | null,
  sessionId: string | null
): Promise<ProfileEngineRow | null> {
  const existing = await findProfileRow(userId, anonymousId)
  if (existing) return existing

  const now = new Date().toISOString()
  const profileId = createRecordId()
  const insertRow = {
    id: profileId,
    user_id: userId,
    anonymous_id: userId ? null : anonymousId,
    session_id: sessionId,
    readiness_score: 0,
    engagement_score: 0,
    assessment_count: 0,
    career_stage: 'Beginner',
    current_stage: 'beginner',
    progression_meta: {},
    last_active_at: now,
    last_ai_update: now,
    created_at: now,
    updated_at: now,
  }

  const { error } = await supabase.from('ai_user_profiles').insert(insertRow)
  if (error) {
    memoryDevLog('Engine profile bootstrap failed', error)
    return null
  }

  return findProfileRow(userId, anonymousId)
}

async function trackEngineAnalytics(params: {
  userId: string | null
  anonymousId: string | null
  sessionId: string | null
  signal: AiSignalType
  scoreBefore: number
  scoreAfter: number
  engagementBefore: number
  engagementAfter: number
  oldStage: CareerStage
  newStage: CareerStage
}): Promise<void> {
  const base = {
    source: 'ai_intelligence_engine',
    trigger_event: params.signal,
    score_before: params.scoreBefore,
    score_after: params.scoreAfter,
    engagement_before: params.engagementBefore,
    engagement_after: params.engagementAfter,
  }

  const rows: Array<{ event_name: string; metadata: Record<string, unknown> }> = []

  if (
    params.scoreBefore !== params.scoreAfter ||
    params.engagementBefore !== params.engagementAfter
  ) {
    rows.push({
      event_name: 'ai_profile_progressed',
      metadata: { ...base, old_stage: params.oldStage, new_stage: params.newStage },
    })
  }

  if (params.oldStage !== params.newStage) {
    rows.push({
      event_name: 'ai_stage_changed',
      metadata: {
        old_stage: params.oldStage,
        new_stage: params.newStage,
        score_before: params.scoreBefore,
        score_after: params.scoreAfter,
      },
    })
  }

  for (const row of rows) {
    const { error } = await supabase.from('ai_career_events').insert({
      user_id: params.userId,
      anonymous_id: params.anonymousId,
      session_id: params.sessionId,
      event_name: row.event_name,
      page: '/dashboard',
      metadata: row.metadata,
    })
    if (error) memoryDevLog(`Engine analytics failed: ${row.event_name}`, error)
  }
}

export function notifyProfileUpdated(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('jobaz-ai-profile-updated'))
}

/**
 * Applies a unified AI signal and refreshes all profile intelligence fields.
 */
export async function updateUserProfile(input: UpdateUserProfileInput): Promise<void> {
  if (typeof window === 'undefined') return

  const userId = input.userId ?? null
  const anonymousId = input.anonymousId?.trim() || null
  if (!userId && !anonymousId) return

  const signal = normalizeSignal(input.signal)
  const rule = AI_SIGNAL_RULES[signal]

  try {
    let row = await findProfileRow(userId, anonymousId)
    if (!row) {
      const sessionId = getOrCreateSessionId() || null
      row = await ensureProfileRow(userId, anonymousId, sessionId)
    }
    if (!row) return

    let meta = parseMeta(row.progression_meta)
    const dedupeKey = buildDedupeKey(signal, rule, input.dedupeId)

    if (rule.dedupe !== 'none' && hasKey(meta, dedupeKey)) {
      await applyInactivityRefresh(row, userId, anonymousId)
      return
    }

    const scoreBefore = row.readiness_score ?? 0
    const engagementBefore = row.engagement_score ?? 0
    const oldStage = careerStageFromReadiness(scoreBefore)

    let readiness = deriveReadinessAfterSignal(
      row,
      input.impact?.readiness ?? rule.readiness ?? 0
    )
    let engagement = deriveEngagementAfterSignal(
      row,
      input.impact?.engagement ?? rule.engagement ?? 0
    )

    const readinessDelta = input.impact?.readiness ?? rule.readiness ?? 0
    const engagementDelta = input.impact?.engagement ?? rule.engagement ?? 0
    if (readinessDelta || engagementDelta) {
      meta = withKey(meta, dedupeKey)
    }

    const patch: Partial<ProfileEngineRow> = { ...row }

    if (rule.patch?.cv_status && (row.cv_status === 'no' || !row.cv_status || row.cv_status === 'needs_improvement')) {
      patch.cv_status = rule.patch.cv_status
    } else if (rule.patch?.cv_status && signal === 'cv_updated') {
      patch.cv_status =
        input.metadata?.cvCompleted === true
          ? 'yes'
          : row.cv_status === 'yes'
            ? 'yes'
            : rule.patch.cv_status
    }

    if (rule.patch?.dominant_goal && !row.dominant_goal) {
      patch.dominant_goal = rule.patch.dominant_goal
    }

    if (rule.metaKey) {
      const current = meta[rule.metaKey] ?? 0
      if (typeof current === 'number') {
        meta = { ...meta, [rule.metaKey]: current + 1 }
      }
    }

    if (
      signal === 'writing_review_completed' ||
      signal === 'writing_review_used' ||
      signal === 'grammar_improved' ||
      signal === 'professional_writing_improved'
    ) {
      const count = meta.writingReviewCount ?? 0
      const nextEnglish = bumpEnglish(row.english_level, count)
      if (nextEnglish && nextEnglish !== row.english_level) {
        patch.english_level = nextEnglish
      }
    }

    const englishConfidenceDelta = input.impact?.englishConfidence ?? 0
    if (englishConfidenceDelta) {
      meta = applyEnglishConfidenceDelta(meta, row.english_level, englishConfidenceDelta)
      const confidenceScore = getEnglishConfidenceScore(meta, row.english_level)
      const levelFromConfidence = englishLevelFromConfidence(
        confidenceScore,
        patch.english_level ?? row.english_level
      )
      if (levelFromConfidence) {
        patch.english_level = levelFromConfidence
      }
    }

    const jobSearchDelta = input.impact?.jobSearchActivity ?? 0
    if (jobSearchDelta) {
      meta = applyJobSearchActivityDelta(meta, jobSearchDelta)
    }

    const inactivity = applyInactivityPenalty(
      engagement,
      row.last_active_at,
      meta.appliedKeys ?? []
    )
    if (inactivity.applied && inactivity.dedupeKey) {
      engagement = inactivity.engagement
      meta = withKey(meta, inactivity.dedupeKey)
    }

    const mergedRow: ProfileEngineRow = {
      ...row,
      ...patch,
      readiness_score: readiness,
      engagement_score: engagement,
      progression_meta: meta,
    }

    const areas = deriveStrongestWeakest(mergedRow, readiness)
    const evolutionStage: AiEvolutionStage = evolveAiStage({
      readiness,
      engagement,
      cvStatus: mergedRow.cv_status,
      dominantGoal: mergedRow.dominant_goal,
      meta,
      readinessBefore: scoreBefore,
    })
    const legacyStage = legacyCareerStageFromEvolution(evolutionStage) as CareerStage
    const now = new Date().toISOString()

    const journeyLabel =
      signal === 'cv_updated' && input.metadata?.cvCompleted === true
        ? 'CV improved'
        : signal === 'writing_review_completed' && input.metadata?.reviewCompleted === true
          ? 'Writing reviewed'
          : signal === 'grammar_improved' && input.metadata?.fixesApplied === true
            ? 'English confidence improved'
            : signal === 'professional_writing_improved'
              ? 'Professional writing improved'
              : rule.journeyLabel

    const journey = appendJourney(
      parseJourney(row.ai_journey_summary),
      signal,
      journeyLabel
    )

    const tempForInsights: ProfileEngineRow = {
      ...mergedRow,
      strongest_area: areas.strongest_area,
      weakest_area: areas.weakest_area,
      career_stage: legacyStage,
      current_stage: evolutionStage,
    }

    const recommendations = generateSmartRecommendations(tempForInsights)
    const actionPlan = generateWeeklyPlan(tempForInsights, { forceRegenerate: true })
    const nextAction = generateNextAction(tempForInsights, recommendations)
    const recommendationReason = generateRecommendationReason(tempForInsights)
    const weeklyFocus = generateWeeklyFocus(tempForInsights, { forceRegenerate: true })

    const preferred_tools = recommendations.map((r) => ({
      id: r.toolId,
      name: r.toolName,
      href: r.href,
    }))

    meta = {
      ...meta,
      previousReadinessScore: scoreBefore,
      previousEngagementScore: engagementBefore,
      previousCareerStage: oldStage,
    }

    const updatePayload = {
      readiness_score: readiness,
      engagement_score: engagement,
      career_stage: legacyStage,
      current_stage: evolutionStage,
      strongest_area: areas.strongest_area,
      weakest_area: areas.weakest_area,
      recommendation_reason: recommendationReason,
      next_action: nextAction,
      weekly_focus: weeklyFocus,
      action_plan: actionPlan,
      preferred_tools,
      ai_journey_summary: journey,
      progression_meta: meta,
      last_active_at: now,
      last_ai_update: now,
      updated_at: now,
      ...(patch.dominant_goal ? { dominant_goal: patch.dominant_goal } : {}),
      ...(patch.english_level ? { english_level: patch.english_level } : {}),
      ...(patch.cv_status ? { cv_status: patch.cv_status } : {}),
    }

    const { error } = await supabase
      .from('ai_user_profiles')
      .update(updatePayload)
      .eq('id', row.id)

    if (error) {
      memoryDevLog('Engine profile update failed', error)
      return
    }

    const sessionId = getOrCreateSessionId() || null
    await trackEngineAnalytics({
      userId,
      anonymousId,
      sessionId,
      signal,
      scoreBefore,
      scoreAfter: readiness,
      engagementBefore,
      engagementAfter: engagement,
      oldStage,
      newStage: legacyStage,
    })

    notifyProfileUpdated()

    scheduleLocalAiProfileEnhancement({
      profileId: row.id,
      readinessScore: readiness,
      weakestArea: areas.weakest_area,
      strongestArea: areas.strongest_area,
      dominantGoal: mergedRow.dominant_goal,
      weeklyFocus,
      nextAction,
    })
  } catch (err) {
    memoryDevLog('updateUserProfile error', err)
  }
}

/** Refresh inactivity penalty without a new tool signal. */
async function applyInactivityRefresh(
  row: ProfileEngineRow,
  userId: string | null,
  anonymousId: string | null
): Promise<void> {
  let meta = parseMeta(row.progression_meta)
  const engagementBefore = row.engagement_score ?? 0
  const inactivity = applyInactivityPenalty(
    engagementBefore,
    row.last_active_at,
    meta.appliedKeys ?? []
  )
  if (!inactivity.applied || !inactivity.dedupeKey) return

  meta = withKey(meta, inactivity.dedupeKey)
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('ai_user_profiles')
    .update({
      engagement_score: inactivity.engagement,
      progression_meta: meta,
      last_ai_update: now,
      updated_at: now,
    })
    .eq('id', row.id)

  if (!error) notifyProfileUpdated()
}
