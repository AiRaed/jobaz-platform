/**
 * Build public/admin assessment-shaped result from a library-path match.
 */

import type { WorkInEducationMatchResult } from '../types'
import type { WorkInEducationAssessmentResult } from './types'
import { WIE_ASSESSMENT_BLUEPRINT_VERSION } from './types'
import { buildAssessmentPresentation } from './build-assessment-result'

export function assessmentResultFromLibraryMatch(
  match: WorkInEducationMatchResult,
  selection: {
    field: { name: string }
    specialism: { name: string }
    stage: { label: string }
  }
): WorkInEducationAssessmentResult {
  const presentation = buildAssessmentPresentation(match, { assessment_status: 'complete' })
  presentation.headline = `${selection.specialism.name} · ${selection.stage.label}`
  presentation.headline_key = 'library_path.headline'

  return {
    pathway: 'work_in_my_education',
    blueprint_version: WIE_ASSESSMENT_BLUEPRINT_VERSION,
    assessment_status: 'complete',
    profile: {
      education_level: match.profile_summary.education_level,
      qualification_title: match.profile_summary.qualification_title,
      subject: match.profile_summary.subject,
      specialisation: match.profile_summary.specialisation,
      qualification_country: match.profile_summary.qualification_country,
      years_relevant_experience: match.profile_summary.years_relevant_experience,
    },
    mapping: null,
    match,
    resolution: match.resolution,
    recommendations: match.recommendations,
    clarification: { required: false, reason: '', options: [] },
    summary: {
      matched_education: `${selection.field.name} → ${selection.specialism.name}`,
      primary_direction: selection.stage.label,
      immediate_count: match.recommendations.immediate.length,
      realistic_next_count: match.recommendations.realistic_next.length,
      future_count: match.recommendations.future_progression.length,
      academic_count: match.recommendations.academic_or_research.length,
      blocked_count: match.recommendations.blocked_or_needs_review.length,
    },
    presentation,
    next_actions: presentation.next_action_items,
    warnings: match.warnings,
    validation_errors: [],
    visible_question_keys: ['field_id', 'specialism_id', 'stage_id'],
    trace: {
      mapping_ms: 0,
      matcher_ms: match.meta.elapsed_ms,
      total_ms: match.meta.elapsed_ms,
      query_count: match.meta.query_count,
      forced_specialism_id: match.resolution.primary_specialism?.id ?? null,
    },
  }
}
