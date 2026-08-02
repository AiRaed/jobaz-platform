/**
 * Persist unified career assessment (UK Career Assistant + legacy wizard).
 * Client-side best-effort; never throws.
 */

import { supabase } from '@/lib/supabase'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import {
  getRuleResultFromStored,
  type StoredCareerAssessmentResult,
} from '@/lib/jobaz-ai/assessment/types'
import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import {
  buildUnifiedStoredResult,
  getRecommendedPathLabel,
  mapUkStateToPartialAssessmentAnswers,
  type UkCareerRuleResult,
  type UkCareerAssistantState,
  type AiPersonalizedUkResult,
  type UnifiedStoredAssessmentResult,
} from '@/lib/jobaz-ai/engines/careerIntelligence'
import { ukRuleResultToProfileResult } from '@/lib/jobaz-ai/engines/careerIntelligence/mapUkAnswers'
import { createRecordId } from './createRecordId'
import { memoryDevLog } from './logger'
import { profileLog, profileLogError } from './profileLog'
import { resolveCareerPathIdentity } from './resolveIdentity'
import { updateAiUserProfileFromAssessment } from './profile'
import { AI_CAREER_SOURCE, UK_CAREER_ASSISTANT_SOURCE } from './types'

export type SaveUnifiedAssessmentInput = {
  assessmentType: 'uk_career_assistant' | 'ai_career_path_wizard'
  ukState?: UkCareerAssistantState
  ukRuleResult?: UkCareerRuleResult
  /** Legacy wizard path */
  answers?: AssessmentAnswers
  result?: CareerAssessmentResult | StoredCareerAssessmentResult
  richInsights?: RichCareerInsights
  aiPersonalized?: AiPersonalizedUkResult | null
  source?: string
}

function resolveStoredResult(input: SaveUnifiedAssessmentInput): UnifiedStoredAssessmentResult {
  if (input.assessmentType === 'uk_career_assistant' && input.ukRuleResult && input.ukState) {
    const ruleWithBrain = {
      ...input.ukRuleResult,
      career_brain:
        (input.ukRuleResult as { career_brain?: unknown }).career_brain ??
        (input.ukState as { career_brain_result?: unknown }).career_brain_result,
    }
    return buildUnifiedStoredResult({
      state: input.ukState,
      ruleResult: ruleWithBrain as typeof input.ukRuleResult,
      aiPersonalized: input.aiPersonalized ?? null,
    })
  }

  const ruleResult = input.result ? getRuleResultFromStored(input.result) : null
  if (!ruleResult) {
    throw new Error('Missing assessment result')
  }

  return {
    assessment_type: 'ai_career_path_wizard',
    rule_result: ruleResult,
    ai_personalized_result:
      typeof input.result === 'object' &&
      input.result !== null &&
      'ai_personalized_result' in input.result
        ? input.result.ai_personalized_result ?? null
        : input.aiPersonalized ?? null,
  }
}

function resolveRecommendedPath(
  stored: UnifiedStoredAssessmentResult,
  input: SaveUnifiedAssessmentInput
): string {
  if (input.assessmentType === 'uk_career_assistant' && input.ukRuleResult) {
    return getRecommendedPathLabel(input.ukRuleResult)
  }
  const rule = getRuleResultFromStored(stored.rule_result as CareerAssessmentResult)
  return rule.recommendedPath
}

export type SaveUnifiedAssessmentResult = {
  ok: boolean
  assessmentId?: string
  error?: string
}

export async function saveUnifiedCareerAssessment(
  input: SaveUnifiedAssessmentInput,
  options?: { userId?: string | null }
): Promise<SaveUnifiedAssessmentResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Not in browser' }
  }

  try {
    const identity = await resolveCareerPathIdentity()
    const userId = await resolveAuthenticatedUserId(options?.userId)
    const anonymousId = userId ? null : identity.anonymousId
    const authUid = userId

    console.log('[CA persist] auth.uid from Supabase', authUid ?? '(none)')
    console.log('[CA persist] save user id', userId ?? '(guest — anonymous insert)')
    if (userId && !authUid) {
      console.warn('[CA persist] save user id set but auth.uid missing — insert will fail RLS')
    }

    const sessionId = identity.sessionId
    const assessmentId = createRecordId()
    const source =
      input.source ??
      (input.assessmentType === 'uk_career_assistant'
        ? UK_CAREER_ASSISTANT_SOURCE
        : AI_CAREER_SOURCE)

    const storedResult = resolveStoredResult(input)
    const recommendedPath = resolveRecommendedPath(storedResult, input)

    profileLog('start', {
      step: 'saveUnifiedCareerAssessment',
      assessmentType: input.assessmentType,
      assessmentId,
      userId,
      anonymousId,
    })

    if (!userId && !anonymousId) {
      profileLogError('Cannot save — missing user_id and anonymous_id', { userId, anonymousId })
      return { ok: false, error: 'Missing user_id and anonymous_id' }
    }

    const assessmentRow = {
      id: assessmentId,
      user_id: userId,
      anonymous_id: anonymousId,
      session_id: sessionId,
      answers:
        input.answers ??
        mapUkStateToPartialAssessmentAnswers(input.ukState ?? {}) ??
        input.ukState?.answers ??
        {},
      result: storedResult,
      recommended_path: recommendedPath,
      recommended_tools: [],
      source,
    }

    console.log('[CA persist] saveUnifiedCareerAssessment called', {
      assessmentType: input.assessmentType,
      assessmentId,
    })
    console.log('[CA persist] Payload', {
      assessmentId,
      userId,
      anonymousId,
      assessmentType: input.assessmentType,
      payloadKeys: {
        hasUkState: Boolean(input.ukState),
        hasUkRuleResult: Boolean(input.ukRuleResult),
        hasAnswers: Boolean(input.answers),
        storedAssessmentType: storedResult.assessment_type,
        hasRuleResult: Boolean((storedResult as { rule_result?: unknown }).rule_result),
      },
      recommendedPath,
    })
    console.log('[CA persist] userId written to payload', userId ?? '(null — anonymous insert)')
    console.log('[CA persist] anonymousId written to payload', anonymousId ?? '(null — auth insert)')

    const { data: inserted, error: insertError } = await supabase
      .from('ai_career_assessments')
      .insert(assessmentRow)
      .select('id, user_id, anonymous_id, created_at')
      .single()

    if (insertError) {
      memoryDevLog('Unified assessment save failed', insertError)
      profileLogError('Assessment insert failed — continuing with profile upsert', insertError)
      console.error('[CA persist] Supabase response — insert error', {
        table: 'ai_career_assessments',
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        userId,
        attemptedAssessmentId: assessmentId,
      })
    } else {
      console.log('[CA persist] Supabase response — insert success', {
        returnedRowId: inserted?.id,
        returnedUserId: inserted?.user_id,
        returnedAnonymousId: inserted?.anonymous_id,
        authUid: userId,
        userIdMatchesAuth: inserted?.user_id === userId,
        created_at: inserted?.created_at,
      })
    }

    const profileAssessmentId = insertError ? null : (inserted?.id ?? assessmentId)

    if (input.assessmentType === 'ai_career_path_wizard' && input.answers && input.result) {
      const wizardStored: StoredCareerAssessmentResult =
        typeof input.result === 'object' && input.result !== null && 'rule_result' in input.result
          ? (input.result as StoredCareerAssessmentResult)
          : { rule_result: getRuleResultFromStored(input.result), ai_personalized_result: null }

      await updateAiUserProfileFromAssessment({
        userId,
        anonymousId,
        sessionId,
        assessmentId: profileAssessmentId,
        answers: input.answers,
        result: wizardStored,
        richInsights: input.richInsights,
      })
      return insertError
        ? { ok: false, assessmentId, error: insertError.message }
        : { ok: true, assessmentId }
    }

    if (input.assessmentType === 'uk_career_assistant' && input.ukState && input.ukRuleResult) {
      const partialAnswers = mapUkStateToPartialAssessmentAnswers(input.ukState)
      const fullAnswers = {
        situation: partialAnswers.situation ?? 'need_job_quickly',
        experience: partialAnswers.experience ?? 'some',
        english: partialAnswers.english ?? 'intermediate',
        cv: partialAnswers.cv ?? 'needs_improvement',
        helpNext: partialAnswers.helpNext ?? 'find_jobs',
      } as AssessmentAnswers

      await updateAiUserProfileFromAssessment({
        userId,
        anonymousId,
        sessionId,
        assessmentId: profileAssessmentId,
        answers: fullAnswers,
        result: {
          rule_result: ukRuleResultToProfileResult(input.ukRuleResult),
          ai_personalized_result: input.aiPersonalized ?? null,
        },
        richInsights: input.richInsights,
      })
    }

    if (insertError) {
      return { ok: false, assessmentId, error: insertError.message }
    }
    return { ok: true, assessmentId: inserted?.id ?? assessmentId }
  } catch (err) {
    memoryDevLog('Unified assessment save error', err)
    profileLogError('saveUnifiedCareerAssessment threw', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown save error',
    }
  }
}
