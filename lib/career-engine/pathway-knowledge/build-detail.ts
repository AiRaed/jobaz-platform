/**
 * Build PathwayDetailResponse from library knowledge + optional match context.
 * Does not re-run the matcher. Does not invent eligibility.
 */

import type { CareerPathwayKnowledge } from './types'
import type {
  PathwayDetailMatchExplanation,
  PathwayDetailResponse,
  PathwayDetailRole,
  PathwayMatchContextPayload,
  PathwayMatchStatusLabel,
} from './detail-types'

function humaniseEnum(raw: string | null | undefined): string | null {
  if (!raw || raw === 'none') return null
  return raw.replace(/_/g, ' ')
}

export function resolveMatchStatusLabel(input: {
  category?: string | null
  eligibility_label?: string | null
}): PathwayMatchStatusLabel {
  const elig = (input.eligibility_label || '').trim().toLowerCase()
  const cat = (input.category || '').trim().toLowerCase()

  if (elig.includes('needs review') || cat.includes('needs review')) return 'Needs review'
  if (cat.includes('future') || elig.includes('future')) return 'Future career option'
  if (cat.includes('academic') || cat.includes('research') || elig.includes('academic'))
    return 'Academic / research option'
  if (
    cat.includes('requirements') ||
    elig.includes('requirements') ||
    elig.includes('not yet') ||
    cat.includes('long-term')
  ) {
    return 'Requirements still needed'
  }
  if (elig.includes('developing') || cat.includes('developing') || cat.includes('realistic')) {
    return 'Conditionally eligible'
  }
  // Safety: only "Eligible now" when the assessment eligibility badge says so.
  if (elig === 'eligible now') return 'Eligible now'
  if (cat.includes('strong match') || cat.includes('good match')) return 'Conditionally eligible'
  return 'Match'
}

export function buildMatchExplanationFromContext(
  ctx: PathwayMatchContextPayload | null
): PathwayDetailMatchExplanation | null {
  if (!ctx) return null

  const match_status = resolveMatchStatusLabel({
    category: ctx.category,
    eligibility_label: ctx.eligibility_label,
  })

  const assessment_says_accessible_now =
    ctx.eligibility_label.trim().toLowerCase() === 'eligible now' &&
    match_status === 'Eligible now'

  const blockers: string[] = []
  const warnings: string[] = []
  for (const item of ctx.why) {
    if (item.kind === 'gap') blockers.push(item.text)
    if (item.kind === 'warning') warnings.push(item.text)
  }
  for (const r of ctx.requirements) {
    if (!blockers.includes(r)) blockers.push(r)
  }

  // Safety: never claim accessible now for review / requirements / future statuses
  const safeAccessible =
    assessment_says_accessible_now &&
    match_status === 'Eligible now' &&
    !match_status.includes('review') &&
    !match_status.includes('Requirements')

  return {
    bucket_label: ctx.category || null,
    eligibility_label: ctx.eligibility_label || null,
    match_status,
    score: typeof ctx.match_score === 'number' ? ctx.match_score : null,
    lead_in: ctx.lead_in || null,
    why: Array.isArray(ctx.why) ? ctx.why : [],
    requirements_still_needed: Array.isArray(ctx.requirements) ? ctx.requirements : [],
    next_step: ctx.next_step,
    assessment_says_accessible_now: Boolean(safeAccessible),
    warnings,
    blockers,
  }
}

export function missingSectionsFromKnowledge(knowledge: CareerPathwayKnowledge | null): string[] {
  if (!knowledge) return ['all']
  const missing: string[] = []
  if (knowledge.about.is_placeholder) missing.push('overview')
  if (knowledge.responsibilities.is_placeholder) missing.push('responsibilities')
  if (knowledge.salary.is_placeholder) missing.push('salary')
  if (knowledge.required_skills.is_placeholder) missing.push('skills')
  if (knowledge.required_qualifications.is_placeholder) missing.push('qualifications')
  if (knowledge.professional_registrations.is_placeholder) missing.push('registration')
  if (knowledge.useful_licences.is_placeholder) missing.push('licences')
  if (knowledge.recommended_courses.is_placeholder) missing.push('learning')
  if (knowledge.next_progression_roles.is_placeholder) missing.push('progression_roles')
  if (knowledge.typical_employers.is_placeholder) missing.push('employers')
  return missing
}

export function buildPathwayDetailResponse(args: {
  found: boolean
  role: PathwayDetailRole | null
  knowledge: CareerPathwayKnowledge | null
  matchContext: PathwayMatchContextPayload | null
  matchContextSource: 'assessment_session' | 'query' | 'none'
  error_code?: PathwayDetailResponse['error_code']
}): PathwayDetailResponse {
  const knowledge =
    args.found && args.knowledge
      ? args.knowledge
      : args.found
        ? args.knowledge
        : null

  return {
    found: args.found,
    role: args.found ? args.role : null,
    match: args.found ? buildMatchExplanationFromContext(args.matchContext) : null,
    knowledge: args.found ? knowledge : null,
    provenance: {
      data_source: 'career_knowledge_library',
      knowledge_source: knowledge?.source ?? null,
      role_found: args.found,
      missing_sections: args.found ? missingSectionsFromKnowledge(knowledge) : ['all'],
      match_context_source: args.matchContextSource,
    },
    error_code: args.error_code ?? (args.found ? null : 'not_found'),
  }
}

export function roleRowToDetailRole(row: {
  id: string
  name: string
  role_category?: string | null
  seniority_level?: string | null
  minimum_experience_years?: number | null
  experience_requirement_label?: string | null
  professional_registration_requirement?: string | null
  professional_membership_requirement?: string | null
  academic_requirement?: string | null
  is_regulated_or_restricted?: boolean | null
  is_academic_role?: boolean | null
  is_research_role?: boolean | null
  status?: string | null
  active?: boolean | null
  field_name: string
  specialism_name: string
  stage_label: string | null
}): PathwayDetailRole {
  return {
    id: row.id,
    title: row.name,
    field: row.field_name,
    specialism: row.specialism_name,
    professional_stage: row.stage_label,
    category: humaniseEnum(row.role_category),
    seniority: humaniseEnum(row.seniority_level),
    minimum_experience_years:
      typeof row.minimum_experience_years === 'number' ? row.minimum_experience_years : null,
    experience_label: row.experience_requirement_label?.trim() || null,
    registration_requirement: humaniseEnum(row.professional_registration_requirement),
    membership_requirement: humaniseEnum(row.professional_membership_requirement),
    academic_requirement: humaniseEnum(row.academic_requirement),
    is_regulated: Boolean(row.is_regulated_or_restricted),
    is_academic: Boolean(row.is_academic_role),
    is_research: Boolean(row.is_research_role),
    library_status: row.status ?? null,
    active: row.active ?? null,
  }
}
