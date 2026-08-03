/**
 * Eligibility + effective fit for Work in My Education role matching.
 * Priority: legal/professional block → scope → stage → experience → stored fit → score
 * Does not mutate stored role fit.
 */

import { educationLevelRank } from './normalise'
import { evaluateProfessionalStageGate } from './professional-stage-gate'
import { evaluateQualificationScope } from './qualification-scope'
import type {
  EffectiveFit,
  EligibilityGap,
  EligibilityStatus,
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
  NormalisedWorkInEducationProfile,
  RetrievalSource,
  RoleEligibilityResult,
} from './types'

const SENIOR_LEVELS = new Set(['senior', 'principal', 'leadership'])
const ENTRY_LEVELS = new Set(['entry', 'early_career'])

function hasActiveRegistration(
  profile: NormalisedWorkInEducationProfile,
  bodyHint?: string | null
): boolean {
  const regs = profile.professional_registration.filter((r) => r.status === 'registered')
  if (!regs.length) return false
  if (!bodyHint) return true
  const hint = bodyHint.toLowerCase()
  return regs.some(
    (r) =>
      r.body.toLowerCase().includes(hint) ||
      hint.includes(r.body.toLowerCase()) ||
      (hint.includes('nmc') && /nmc|nursing.?midwifery/i.test(r.body)) ||
      (hint.includes('gmc') && /gmc|general medical/i.test(r.body)) ||
      (hint.includes('sra') && /sra|solicitors regulation/i.test(r.body)) ||
      (hint.includes('gdc') && /gdc|general dental/i.test(r.body))
  )
}

function educationSatisfies(
  profile: NormalisedWorkInEducationProfile,
  academicReq: string | null
): { ok: boolean; gap?: EligibilityGap } {
  const req = (academicReq ?? 'none').toLowerCase()
  const rank = educationLevelRank(profile.education_level)

  if (req === 'none') return { ok: true }
  if (req === 'degree_relevant' || req === 'accredited_degree_preferred') {
    if (rank >= 2) return { ok: true }
    return {
      ok: false,
      gap: {
        type: 'academic_requirement',
        code: 'education.degree_required',
        message_key: 'career.academic.degree_required',
        message: 'Role typically expects a relevant bachelor-level (or higher) qualification',
        severity: 'blocker',
        details: {},
      },
    }
  }
  if (req === 'masters_relevant') {
    if (rank >= 3) return { ok: true }
    return {
      ok: false,
      gap: {
        type: 'academic_requirement',
        code: 'education.masters_relevant',
        message_key: 'career.academic.masters_relevant',
        message: 'Role typically expects Master’s-level study or equivalent depth',
        severity: 'warning',
        details: {},
      },
    }
  }
  if (req === 'phd_relevant') {
    if (rank >= 4) return { ok: true }
    return {
      ok: false,
      gap: {
        type: 'academic_requirement',
        code: 'education.phd_relevant',
        message_key: 'career.academic.phd_relevant',
        message: 'Role typically expects doctoral research training',
        severity: 'blocker',
        details: {},
      },
    }
  }
  return { ok: true }
}

function experienceSatisfies(
  profile: NormalisedWorkInEducationProfile,
  role: KnowledgeRoleRow
): { ok: boolean; gap?: EligibilityGap } {
  const min = Math.max(0, role.minimum_experience_years ?? 0)
  const years = profile.years_relevant_experience
  const seniority = (role.seniority_level ?? '').toLowerCase()

  if (years >= min) return { ok: true }

  if (SENIOR_LEVELS.has(seniority) && years + 2 < min) {
    return {
      ok: false,
      gap: {
        type: 'experience',
        code: 'experience.senior_gap',
        message_key: 'career.experience.senior_gap',
        message: `Role expects ~${min}+ years; profile has ${years}`,
        severity: 'blocker',
        details: { min, years },
      },
    }
  }

  return {
    ok: false,
    gap: {
      type: 'experience',
      code: 'experience.below_minimum',
      message_key: 'career.experience.below_minimum',
      message: `Role minimum experience ~${min} years; profile has ${years}`,
      severity: min >= 5 ? 'blocker' : 'warning',
      details: { min, years },
    },
  }
}

function applyForceFit(
  current: EffectiveFit,
  forced: EffectiveFit | null,
  demotion_reasons: string[],
  reason: string
): EffectiveFit {
  if (!forced) return current
  const rank: Record<EffectiveFit, number> = {
    blocked_until_requirement: 0,
    needs_review: 1,
    future_progression: 2,
    academic_or_research: 3,
    realistic_next: 4,
    immediate: 5,
  }
  if (rank[forced] < rank[current]) {
    demotion_reasons.push(reason)
    return forced
  }
  return current
}

export function evaluateRoleEligibility(args: {
  role: KnowledgeRoleRow
  specialism: KnowledgeSpecialismRow
  field: KnowledgeFieldRow
  stage: KnowledgeStageRow | null
  profile: NormalisedWorkInEducationProfile
  retrieval_source?: RetrievalSource
  relation_reason?: string
}): RoleEligibilityResult {
  const { role, specialism, field, stage, profile } = args
  const gaps: EligibilityGap[] = []
  const warnings: string[] = []
  const match_reasons: string[] = []
  const demotion_reasons: string[] = []

  const regulated =
    Boolean(role.is_regulated_or_restricted) || Boolean(specialism.regulated_profession)
  const isHealthcare = field.slug === 'healthcare-medicine'
  const isLaw = field.slug === 'law-legal-justice'

  const edu = educationSatisfies(profile, role.academic_requirement)
  if (!edu.ok && edu.gap) gaps.push(edu.gap)
  else match_reasons.push('Education level compatible with role academic requirement')

  const exp = experienceSatisfies(profile, role)
  if (!exp.ok && exp.gap) gaps.push(exp.gap)
  else match_reasons.push('Experience meets or exceeds stated minimum')

  const regReq = (role.professional_registration_requirement ?? 'none').toLowerCase()
  let registration_match = true
  const hasReg = hasActiveRegistration(profile, specialism.professional_body)

  if (regReq === 'required' || regulated) {
    if (hasReg) {
      registration_match = true
      match_reasons.push('Professional registration present')
    } else if (
      profile.professional_registration.some((r) => r.status === 'pending') ||
      profile.professional_registration.length === 0
    ) {
      registration_match = false
      gaps.push({
        type: 'registration',
        code: 'registration.missing_or_unknown',
        message_key: 'career.registration.missing_or_unknown',
        message: regulated
          ? 'Regulated role — registration/licence pathway must be confirmed before treating as unrestricted employment'
          : 'Professional registration required or commonly expected',
        severity: 'blocker',
        details: {},
      })
    } else {
      registration_match = false
      gaps.push({
        type: 'registration',
        code: 'registration.not_active',
        message_key: 'career.registration.not_active',
        message: 'Registration is not active (pending/expired/none)',
        severity: 'blocker',
        details: {},
      })
    }
  } else if (regReq === 'commonly_expected' && !hasReg) {
    warnings.push('Professional registration/membership commonly expected for this role')
    gaps.push({
      type: 'registration',
      code: 'registration.commonly_expected',
      message_key: 'career.registration.commonly_expected',
      message: 'Registration/membership commonly expected',
      severity: 'info',
      details: {},
    })
  }

  let licence_match = true
  const note = (role.eligibility_note ?? '').toLowerCase()
  if (/licence|license|driving|sia|cscs/i.test(note) && profile.licences.length === 0) {
    licence_match = false
    gaps.push({
      type: 'licence',
      code: 'licence.may_be_required',
      message_key: 'career.licence.may_be_required',
      message: 'Role notes may require a licence — verify before applying',
      severity: 'warning',
      details: {},
    })
  }

  const country_recognition_review_needed =
    !profile.is_uk_qualification &&
    (regulated || isHealthcare || isLaw || /recognition|overseas|international/i.test(note))

  if (country_recognition_review_needed) {
    gaps.push({
      type: 'qualification_recognition',
      code: 'recognition.overseas_qualification',
      message_key: 'career.recognition.overseas_qualification',
      message: 'Non-UK qualification may need recognition review before UK practice',
      severity: regulated ? 'blocker' : 'warning',
      details: { country: profile.qualification_country },
    })
    warnings.push('Qualification recognition review recommended')
  }

  // Scope gate (Nursing)
  const scope = evaluateQualificationScope({
    profile,
    role,
    specialism,
    fieldSlug: field.slug,
  })
  for (const g of scope.gaps) gaps.push(g)

  // Professional stage gate (Engineering)
  const stageGate = evaluateProfessionalStageGate({
    profile,
    role,
    stage,
    fieldSlug: field.slug,
  })
  for (const g of stageGate.gaps) gaps.push(g)
  warnings.push(...stageGate.warnings)

  // Eligibility status
  let status: EligibilityStatus = 'eligible'
  const hasBlocker = gaps.some((g) => g.severity === 'blocker')
  const hasWarning = gaps.some((g) => g.severity === 'warning')

  if (scope.force_fit === 'needs_review' || (regulated && !registration_match && isHealthcare)) {
    status = 'needs_review'
  } else if (scope.force_fit === 'blocked_until_requirement') {
    status = 'not_yet_eligible'
  } else if (regulated && !registration_match) {
    status =
      isHealthcare || profile.professional_registration.length === 0
        ? 'needs_review'
        : 'not_yet_eligible'
  } else if (country_recognition_review_needed && regulated) {
    status = 'needs_review'
  } else if (hasBlocker) {
    status = 'not_yet_eligible'
  } else if (hasWarning || regReq === 'commonly_expected') {
    status = 'conditionally_eligible'
  } else {
    status = 'eligible'
  }

  const stored = role.fit_classification
  const seniority = (role.seniority_level ?? '').toLowerCase()
  const years = profile.years_relevant_experience
  const min = role.minimum_experience_years ?? 0
  const academic =
    Boolean(role.is_academic_role) ||
    Boolean(role.is_research_role) ||
    seniority === 'academic_research' ||
    stored === 'academic_or_research'

  let effective_fit: EffectiveFit = (stored as EffectiveFit) || 'realistic_next'

  // Base fit from experience / academic / stored
  if (academic && profile.career_preferences.wants_academic_route !== false) {
    if (
      edu.ok &&
      (profile.education_level === 'doctorate' ||
        !role.academic_requirement?.includes('phd') ||
        educationLevelRank(profile.education_level) >= 4)
    ) {
      effective_fit = 'academic_or_research'
    } else if (!edu.ok) {
      effective_fit = 'future_progression'
    } else {
      effective_fit = 'academic_or_research'
    }
  } else if (SENIOR_LEVELS.has(seniority) && years < Math.max(min, 3)) {
    effective_fit = 'future_progression'
    match_reasons.push('Senior/leadership role treated as future progression due to experience gap')
  } else if (!exp.ok && min >= 3) {
    effective_fit = years + 2 >= min ? 'realistic_next' : 'future_progression'
  } else if (!edu.ok && (role.academic_requirement ?? '').includes('phd')) {
    effective_fit = 'future_progression'
  } else if (status === 'eligible' || status === 'conditionally_eligible') {
    if (ENTRY_LEVELS.has(seniority) || min <= 1) {
      effective_fit = years >= min ? 'immediate' : 'realistic_next'
    } else if (stored === 'immediate' && years >= min && edu.ok) {
      effective_fit = 'immediate'
    } else if (stored === 'academic_or_research') {
      effective_fit = 'academic_or_research'
    } else if (stored === 'future_progression') {
      effective_fit = years >= min + 2 ? 'realistic_next' : 'future_progression'
    } else {
      effective_fit = years >= min ? (stored as EffectiveFit) || 'realistic_next' : 'realistic_next'
    }
  } else if (status === 'not_yet_eligible') {
    effective_fit =
      regulated && !registration_match ? 'blocked_until_requirement' : 'future_progression'
  }

  // Priority demotions (cannot be overridden by high rank score later)
  if (status === 'needs_review') {
    effective_fit = applyForceFit(effective_fit, 'needs_review', demotion_reasons, 'eligibility_needs_review')
  }
  if (regulated && !registration_match) {
    const forced = isHealthcare ? 'needs_review' : 'blocked_until_requirement'
    effective_fit = applyForceFit(effective_fit, forced, demotion_reasons, 'registration_blocker')
  }
  if (country_recognition_review_needed && regulated) {
    effective_fit = applyForceFit(effective_fit, 'needs_review', demotion_reasons, 'recognition_review')
  }
  if (scope.force_fit) {
    effective_fit = applyForceFit(
      effective_fit,
      scope.force_fit,
      demotion_reasons,
      `scope_gate:${scope.scope_gate}`
    )
  }
  if (stageGate.force_fit) {
    const entryOverride =
      stageGate.warnings.includes('role_stage_metadata_review_needed') &&
      /\b(graduate|assistant|trainee|technician|apprentice|junior)\b/i.test(role.name) &&
      years <= 1
    if (entryOverride) {
      effective_fit = stageGate.force_fit
      demotion_reasons.push(`stage_metadata_entry_override:${stageGate.scope_gate}`)
    } else {
      effective_fit = applyForceFit(
        effective_fit,
        stageGate.force_fit,
        demotion_reasons,
        `stage_gate:${stageGate.scope_gate}`
      )
    }
  }

  if (effective_fit === 'immediate' && SENIOR_LEVELS.has(seniority) && years < 3) {
    effective_fit = 'future_progression'
    demotion_reasons.push('seniority_safety')
    warnings.push('Senior title blocked from immediate fit with insufficient experience')
  }

  if (effective_fit === 'immediate' && regulated && !registration_match) {
    effective_fit = isHealthcare ? 'needs_review' : 'blocked_until_requirement'
    demotion_reasons.push('regulated_immediate_blocked')
  }

  if (effective_fit === 'immediate' && scope.demote_immediate) {
    effective_fit = scope.force_fit ?? 'needs_review'
    demotion_reasons.push('scope_demote_immediate')
  }

  return {
    role_id: role.id,
    role_title: role.name,
    field: { id: field.id, name: field.name, slug: field.slug },
    specialism: { id: specialism.id, name: specialism.name, slug: specialism.slug },
    stage: {
      id: stage?.id ?? role.stage_id,
      key: stage?.stage_key ?? null,
      label: stage?.label ?? null,
    },
    stored_fit: stored,
    effective_fit,
    eligibility: {
      status,
      education_match: edu.ok,
      experience_match: exp.ok,
      registration_match,
      licence_match,
      country_recognition_review_needed,
      qualification_scope_match: scope.applies ? scope.qualification_scope_match : 'unknown',
      registration_scope_match: scope.applies ? scope.registration_scope_match : 'unknown',
    },
    gaps,
    match_score: 0,
    match_reasons,
    warnings,
    demotion_reasons,
    retrieval_source: args.retrieval_source ?? 'primary_specialism',
    relation_reason: args.relation_reason ?? '',
    scope_gate: scope.applies ? scope.scope_gate : 'not_applicable',
    professional_stage_gate: stageGate.applies ? stageGate.scope_gate : 'not_applicable',
  }
}
