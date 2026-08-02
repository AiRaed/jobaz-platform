/**
 * Persist AI Career Path Finder assessment results (Supabase ai_career_assessments).
 * Best-effort: never throws; failures are logged in development only.
 */

import { supabase } from '@/lib/supabase'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import type { StoredCareerAssessmentResult } from '@/lib/jobaz-ai/assessment/types'
import { getRuleResultFromStored } from '@/lib/jobaz-ai/assessment/types'
import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'
import { createRecordId } from './createRecordId'
import { profileLog, profileLogError } from './profileLog'
import { resolveCareerPathIdentity } from './resolveIdentity'
import { memoryDevLog } from './logger'
import { updateAiUserProfileFromAssessment } from './profile'
import { AI_CAREER_SOURCE } from './types'

export type SaveAiCareerAssessmentInput = {
  answers: AssessmentAnswers
  result: CareerAssessmentResult | StoredCareerAssessmentResult
  richInsights?: RichCareerInsights
  source?: string
}

export async function saveAiCareerAssessment(
  input: SaveAiCareerAssessmentInput
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { userId, anonymousId, sessionId } = await resolveCareerPathIdentity()
    const assessmentId = createRecordId()
    const source = input.source ?? AI_CAREER_SOURCE
    const ruleResult = getRuleResultFromStored(input.result)
    const storedResult =
      typeof input.result === 'object' && input.result !== null && 'rule_result' in input.result
        ? input.result
        : { rule_result: ruleResult, ai_personalized_result: null }
    const recommendedTools = ruleResult.recommendedTools.map((t) => ({
      id: t.id,
      name: t.name,
      href: t.href,
    }))

    profileLog('start', {
      step: 'saveAiCareerAssessment',
      assessmentId,
      userId,
      anonymousId,
      sessionId,
    })

    if (!userId && !anonymousId) {
      profileLogError('Cannot save — missing user_id and anonymous_id', {
        userId,
        anonymousId,
      })
      return
    }

    const assessmentRow = {
      id: assessmentId,
      user_id: userId,
      anonymous_id: anonymousId,
      session_id: sessionId,
      answers: input.answers,
      result: storedResult,
      recommended_path: ruleResult.recommendedPath,
      recommended_tools: recommendedTools,
      source,
    }

    profileLog('payload', { table: 'ai_career_assessments', row: assessmentRow })

    const { error: insertError } = await supabase
      .from('ai_career_assessments')
      .insert(assessmentRow)

    if (insertError) {
      memoryDevLog('Assessment save failed', insertError)
      profileLogError('Assessment insert failed — profile update skipped', insertError)
      return
    }

    profileLog('insert result', {
      table: 'ai_career_assessments',
      assessmentId,
      ok: true,
    })

    profileLog('start', {
      step: 'updateAiUserProfileFromAssessment',
      assessmentId,
      userId,
      anonymousId,
    })

    await updateAiUserProfileFromAssessment({
      userId,
      anonymousId,
      sessionId,
      assessmentId,
      answers: input.answers,
      result: storedResult,
      richInsights: input.richInsights,
    })
  } catch (err) {
    memoryDevLog('Assessment save error', err)
    profileLogError('saveAiCareerAssessment threw', err)
  }
}
