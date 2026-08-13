/**
 * runWorkInEducationAssessment — blueprint → validate → map → matcher → present.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { matchWorkInEducation } from '../match'
import type { WorkInEducationMatchResult } from '../types'
import {
  getWorkInEducationAssessmentBlueprint,
  listVisibleQuestions,
  WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT,
} from './blueprint'
import { mapWorkInEducationAnswersToProfile } from './map-answers-to-profile'
import { buildAssessmentPresentation } from './build-assessment-result'
import { validateWorkInEducationAnswers } from './validate-answers'
import type { AssessmentRequest, WorkInEducationAssessmentResult } from './types'
import { WIE_ASSESSMENT_BLUEPRINT_VERSION } from './types'

export type AssessmentRunResult =
  | { ok: true; result: WorkInEducationAssessmentResult }
  | { ok: false; errors: string[]; status: number; result?: WorkInEducationAssessmentResult }

function emptySummary() {
  return {
    matched_education: '',
    primary_direction: '',
    immediate_count: 0,
    realistic_next_count: 0,
    future_count: 0,
    academic_count: 0,
    blocked_count: 0,
  }
}

export async function runWorkInEducationAssessment(
  supabase: SupabaseClient,
  request: AssessmentRequest
): Promise<AssessmentRunResult> {
  const started = Date.now()
  let mapping_ms = 0
  let matcher_ms = 0

  const blueprint = request.blueprint_version
    ? getWorkInEducationAssessmentBlueprint(request.blueprint_version)
    : WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT

  if (!blueprint) {
    return {
      ok: false,
      status: 400,
      errors: [`Unknown blueprint_version: ${request.blueprint_version}`],
    }
  }

  const validated = validateWorkInEducationAnswers(request.answers, blueprint)
  const visible_question_keys = validated.visible_keys

  if (!validated.ok) {
    const presentation = buildAssessmentPresentation(null, { assessment_status: 'invalid' })
    const result: WorkInEducationAssessmentResult = {
      pathway: 'work_in_my_education',
      blueprint_version: blueprint.version,
      assessment_status: 'invalid',
      profile: null,
      mapping: null,
      match: null,
      resolution: null,
      recommendations: null,
      clarification: { required: false, reason: '', options: [] },
      summary: emptySummary(),
      presentation,
      next_actions: [],
      warnings: validated.unknown_keys.map((k) => `Stripped unknown answer key: ${k}`),
      validation_errors: validated.errors,
      visible_question_keys,
      trace: {
        mapping_ms: 0,
        matcher_ms: 0,
        total_ms: Date.now() - started,
        query_count: 0,
        forced_specialism_id: null,
      },
    }
    return { ok: false, status: 400, errors: validated.errors, result }
  }

  const validAnswers = validated.answers
  const unknownKeys = validated.unknown_keys

  const mapStarted = Date.now()
  let mapping = mapWorkInEducationAnswersToProfile(validAnswers)
  mapping_ms = Date.now() - mapStarted

  const forceSpecialismId =
    request.clarification_answers?.selected_specialism_id?.trim() || null

  const matchStarted = Date.now()
  const run = await matchWorkInEducation(supabase, mapping.profile, {
    includeDrafts: request.includeDrafts !== false,
    forceSpecialismId,
  })
  matcher_ms = Date.now() - matchStarted

  if (!run.ok) {
    return { ok: false, status: run.status, errors: run.errors }
  }

  return finish(run.result)

  function finish(matchResult: WorkInEducationMatchResult): AssessmentRunResult {
    if (forceSpecialismId && matchResult.resolution.primary_specialism) {
      const name = matchResult.resolution.primary_specialism.name
      if (mapping.profile.specialisation !== name) {
        mapping = {
          ...mapping,
          profile: { ...mapping.profile, specialisation: name },
          mapping_provenance: [
            ...mapping.mapping_provenance,
            {
              answer_key: 'clarification_answers.selected_specialism_id',
              profile_path: 'specialisation',
              transformation: `forced specialism name: ${name}`,
            },
          ],
        }
      }
    }

    const needsClarify = matchResult.resolution.needs_clarification
    const assessment_status = needsClarify ? 'needs_clarification' : 'complete'

    const presentation = buildAssessmentPresentation(matchResult, {
      assessment_status,
      subject: mapping.profile.subject,
    })

    const warnings = [
      ...mapping.mapping_warnings,
      ...matchResult.warnings,
      ...unknownKeys.map((k) => `Stripped unknown answer key: ${k}`),
    ]

    const result: WorkInEducationAssessmentResult = {
      pathway: 'work_in_my_education',
      blueprint_version: blueprint!.version,
      assessment_status,
      profile: mapping.profile,
      mapping,
      match: matchResult,
      resolution: matchResult.resolution,
      recommendations: matchResult.recommendations,
      clarification: {
        required: needsClarify,
        reason: matchResult.resolution.clarification_reason ?? '',
        options: matchResult.resolution.clarification_options.map((o) => ({
          specialism_id: o.id,
          name: o.name,
          slug: o.slug,
          score: o.score,
          reason: o.reason,
        })),
      },
      summary: {
        matched_education:
          matchResult.resolution.primary_specialism?.name ||
          matchResult.resolution.primary_field?.name ||
          mapping.profile.subject,
        primary_direction:
          matchResult.resolution.primary_specialism?.name ||
          matchResult.resolution.primary_field?.name ||
          '',
        immediate_count: matchResult.recommendations.immediate.length,
        realistic_next_count: matchResult.recommendations.realistic_next.length,
        future_count: matchResult.recommendations.future_progression.length,
        academic_count: matchResult.recommendations.academic_or_research.length,
        blocked_count: matchResult.recommendations.blocked_or_needs_review.length,
      },
      presentation,
      next_actions: presentation.next_action_items,
      warnings,
      validation_errors: [],
      visible_question_keys: listVisibleQuestions(validAnswers, blueprint!).map((q) => q.key),
      trace: {
        mapping_ms,
        matcher_ms,
        total_ms: Date.now() - started,
        query_count: matchResult.meta.query_count,
        forced_specialism_id: forceSpecialismId,
      },
    }

    return { ok: true, result }
  }
}

export { WIE_ASSESSMENT_BLUEPRINT_VERSION }
