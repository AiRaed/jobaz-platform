/**
 * Career Brain turn orchestrator — PATH/RESULT without legacy scoreAllDirections.
 */

import {
  applyAnswerToProfile,
  getAnsweredCareerBrainQuestionIds,
  shouldFinalizeProfile,
} from './adaptiveQuestions'
import { buildDiscoveryProfile, pickNextDiscoveryQuestion } from './discoveryEngine'
import {
  applyEntryAnswersToProfile,
  isStructuredEntryComplete,
  syncEntryClassification,
} from './entryClassification'
import { isFieldFirstMode } from './domains'
import { extractCareerProfile } from './extractProfile'
import { generateCareerRecommendations } from './recommendations'
import { mapOutputToLegacyResult, buildBlockedCareerBrainOutput } from './resultBuilder'
import {
  ensureGrowCareerBrainOutput,
  normalizeGrowCareerLegacyResult,
} from './growCareerResultNormalizer'
import { canGenerateJobPathways } from './rightToWork'
import {
  isCareerBrainStructuredAnswerKey,
  isGrowCareerAssessmentAnswerKey,
  saveGrowCareerJobTitle,
} from './growCareerPath'
import { saveJazJobTitle } from './jaz/jazEngine'
import type {
  CareerBrainDebug,
  CareerBrainState,
  CareerBrainTurnResult,
  CareerProfile,
} from './types'

export type CareerBrainTurnInput = {
  state: CareerBrainState
  user_input?: string | string[]
  current_question_id?: string | null
  free_text?: string
  path_story_only?: boolean
}

function logDev(debug: CareerBrainDebug, mode: 'question' | 'result') {
  if (process.env.NODE_ENV !== 'development') return
  console.log('[Career Brain]', {
    mode,
    detectedDomain: debug.detectedDomain,
    discovery_profile: debug.discovery_profile,
    missing_fields: debug.missing_fields,
    question_chosen: debug.question_chosen,
    question_reason: debug.question_reason,
    legacy_flow_skipped: debug.legacy_flow_skipped,
    field_first_mode: debug.field_first_mode,
    finalize_reason: debug.finalize_reason,
  })
}

function assistantMessageForQuestion(text: string): string {
  return text
}

export async function runCareerBrainTurn(
  input: CareerBrainTurnInput
): Promise<CareerBrainTurnResult> {
  const reasons: string[] = []
  let state: CareerBrainState = { ...input.state }

  let profile: CareerProfile =
    state.career_brain_profile ?? {
      educationLevel: null,
      studyField: null,
      workExperienceField: null,
      targetField: null,
      yearsOfExperience: null,
      experienceCountry: null,
      toolsAndSkills: [],
      hasPortfolio: null,
      certificates: [],
      licences: [],
      englishLevel: null,
      ukLocation: null,
      urgencyLevel: 'low',
      wantsSameField: null,
      wantsCareerChange: null,
      domain: 'no_experience_general',
      domainConfidence: 0,
      detectedRoles: [],
      transferableSkills: [],
      constraints: [],
      confidence: 0,
    }

  const qid = input.current_question_id
  const skipAnswerCommit =
    input.path_story_only ||
    (input.free_text?.trim() &&
      qid &&
      !isCareerBrainStructuredAnswerKey(qid) &&
      String(input.user_input) === input.free_text.trim())

  if (qid === 'jaz_job_title' && input.user_input && !skipAnswerCommit) {
    state = saveJazJobTitle(state, input.user_input)
    profile = applyAnswerToProfile(profile, qid, String(input.user_input).trim())
    state.career_brain_asked = [...new Set([...(state.career_brain_asked ?? []), qid])]
    reasons.push('Applied answer: jaz_job_title')
  } else if (qid === 'currentJobTitle' && input.user_input && !skipAnswerCommit) {
    state = saveGrowCareerJobTitle(state, input.user_input, 'orchestrator')
    profile = applyAnswerToProfile(profile, qid, String(input.user_input).trim())
    state.career_brain_asked = [...new Set([...(state.career_brain_asked ?? []), qid])]
    reasons.push('Applied answer: currentJobTitle')
  } else if (qid && isCareerBrainStructuredAnswerKey(qid) && input.user_input && !skipAnswerCommit) {
    const val = input.user_input
    state.answers = { ...(state.answers ?? {}), [qid]: val }
    profile = applyAnswerToProfile(profile, qid, val)
    state.career_brain_asked = [...new Set([...(state.career_brain_asked ?? []), qid])]
    reasons.push(`Applied answer: ${qid}`)
  }

  if (
    input.free_text?.trim() &&
    qid &&
    !isCareerBrainStructuredAnswerKey(qid) &&
    !isGrowCareerAssessmentAnswerKey(qid)
  ) {
    const story = (state.path_story ?? '').trim()
    const addition = input.free_text.trim()
    state.path_story = story ? `${story}\n${addition}` : addition
    reasons.push(`path_story +${addition.length} chars`)
  }

  state = syncEntryClassification(state)
  profile = applyEntryAnswersToProfile(profile, state)

  const { profile: extracted, source: profileSource } = await extractCareerProfile(state)
  profile = {
    ...extracted,
    ...profile,
    confidence: Math.max(extracted.confidence, profile.confidence),
    domain: extracted.domain,
    domainConfidence: extracted.domainConfidence,
  }
  state.career_brain_profile = profile

  const asked = getAnsweredCareerBrainQuestionIds(state)
  const backgroundDone = isStructuredEntryComplete(state)

  if (backgroundDone) {
    state.classification_done = true
    state.phase = 'PATH'
  } else {
    state.phase = 'CLASSIFY'
  }

  const finalizeCheck = shouldFinalizeProfile(profile, asked, state)
  const fieldFirst = isFieldFirstMode(profile)

  const debugBase: CareerBrainDebug = {
    careerProfile: profile,
    detectedDomain: profile.domain,
    domainConfidence: profile.domainConfidence,
    profile_source: profileSource,
    recommendation_reasons: reasons,
    questions_asked: asked,
    path_story_length: (state.path_story ?? '').length,
    field_first_mode: fieldFirst,
    finalize_reason: finalizeCheck.reason,
  }

  if (!finalizeCheck.finalize) {
    const discoveryPick = pickNextDiscoveryQuestion(profile, asked, state)
    const question = discoveryPick.question
    const reason = discoveryPick.reason
    debugBase.discovery_profile = buildDiscoveryProfile(state, profile) as unknown as Record<
      string,
      unknown
    >
    debugBase.missing_fields = discoveryPick.missingFields
    debugBase.legacy_flow_skipped = discoveryPick.legacyFlowSkipped

    if (question) {
      debugBase.question_chosen = question.id
      debugBase.question_reason = reason
      logDev(debugBase, 'question')

      return {
        response: {
          path: state.path ?? null,
          phase: backgroundDone ? 'PATH' : 'CLASSIFY',
          assistant_message: assistantMessageForQuestion(question.text),
          question,
          allow_free_text: true,
          state_updates: {
            ...state,
            career_brain_profile: profile,
            career_brain_asked: state.career_brain_asked,
            last_question_id: question.id,
          },
          done: false,
          confidence_score: Math.round(profile.confidence * 10),
          result: null,
        },
        debug: debugBase,
      }
    }
  }

  const recResult = canGenerateJobPathways(state)
    ? await generateCareerRecommendations(profile, reasons, state)
    : {
        output: buildBlockedCareerBrainOutput(profile, state),
        source: 'fallback' as const,
      }
  const finalOutput = ensureGrowCareerBrainOutput(profile, recResult.output, state)
  const legacyResult = normalizeGrowCareerLegacyResult(
    mapOutputToLegacyResult(finalOutput, state),
    finalOutput,
    state
  )
  state.career_brain_result = finalOutput

  debugBase.recommendation_source = recResult.source
  debugBase.careerBrainOutput = finalOutput
  logDev(debugBase, 'result')

  return {
    response: {
      path: state.path ?? null,
      phase: 'RESULT',
      assistant_message: legacyResult.summary,
      question: null,
      allow_free_text: false,
      state_updates: {
        ...state,
        phase: 'RESULT',
        classification_done: true,
        career_brain_profile: profile,
        career_brain_result: recResult.output,
      },
      done: true,
      confidence_score: finalOutput.employabilityScore || Math.round(Math.max(profile.confidence, 0.65) * 10),
      result: legacyResult,
    },
    debug: debugBase,
  }
}
