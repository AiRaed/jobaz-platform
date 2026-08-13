/**
 * Eligibility & Match Scoring v2 — deterministic, library + profile only.
 * No LLM. Shared by Career Assistant result cards and Pathway Detail.
 */

import {
  academicRequirementToRank,
  qualificationSatisfiesAcademicRequirement,
} from '@/lib/career-engine/qualification-taxonomy'
import { profileAcademicRank } from './work-in-education/normalise'
import type {
  FieldSpecialismResolution,
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
  NormalisedWorkInEducationProfile,
  RoleEligibilityResult,
} from './work-in-education/types'

export type EligibilityStatusV2 =
  | 'eligible_now'
  | 'developing_match'
  | 'future_pathway'
  | 'requirements_missing'
  | 'needs_review'

export type ResultGroupV2 = 'immediate' | 'developing' | 'future' | 'blocked_or_review'

export type QualitativeMatchLabel =
  | 'Strong match'
  | 'Good match'
  | 'Developing match'
  | 'Long-term / Requirements needed'

export type ScoreBreakdownV2 = {
  specialism: number
  qualification: number
  experience: number
  career_stage: number
  registration: number
  raw_total: number
  capped_total: number
  caps_applied: string[]
}

export type RoleMatchEvaluation = {
  matchScore: number
  eligibilityStatus: EligibilityStatusV2
  resultGroup: ResultGroupV2
  matchedReasons: string[]
  unmetRequirements: string[]
  warnings: string[]
  nextBestAction: string
  requiresManualReview: boolean
  scoreBreakdown: ScoreBreakdownV2
  qualitativeLabel: QualitativeMatchLabel
  statusLabel: string
  /** Canonical why lines for UI (positives then gaps then warnings) — contradiction-free */
  whyItems: Array<{ kind: 'positive' | 'gap' | 'warning'; text: string }>
}

export const SCORE_WEIGHTS = {
  specialism: 30,
  qualification: 20,
  experience: 25,
  career_stage: 15,
  registration: 10,
} as const

export type RegistrationRequirementKind = 'required' | 'desirable' | 'not_required' | 'unknown'

const SENIOR_LEVELS = new Set([
  'senior',
  'principal',
  'leadership',
  'expert',
  'director',
  'head',
  'technical_authority',
])

const ENTRY_LEVELS = new Set(['entry', 'early_career', 'graduate', 'junior', 'trainee', 'assistant'])

const ENTRY_TITLE =
  /\b(graduate|assistant|trainee|technician|apprentice|junior|support|entry|intern)\b/i

const SENIOR_TITLE =
  /\b(senior|principal|lead|head of|director|chief|technical authority|expert witness|chartered)\b/i

const CHARTERED_TITLE = /\b(chartered|ceng|ieng|engtech)\b/i

export function normalizeRegistrationRequirement(
  raw: string | null | undefined,
  opts?: { regulated?: boolean }
): RegistrationRequirementKind {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v || v === 'none' || v === 'not_required' || v === 'not required') return 'not_required'
  if (v === 'required' || v === 'mandatory' || v === 'must') return 'required'
  if (
    v === 'desirable' ||
    v === 'preferred' ||
    v === 'commonly_expected' ||
    v === 'commonly expected' ||
    v === 'recommended'
  ) {
    return 'desirable'
  }
  if (v === 'unknown') return opts?.regulated ? 'required' : 'unknown'
  // Unrecognised library value
  if (opts?.regulated) return 'required'
  return 'unknown'
}

export function statusLabelV2(status: EligibilityStatusV2): string {
  switch (status) {
    case 'eligible_now':
      return 'Eligible now'
    case 'developing_match':
      return 'Developing match'
    case 'future_pathway':
      return 'Future career option'
    case 'requirements_missing':
      return 'Requirements still needed'
    case 'needs_review':
      return 'Needs review'
    default:
      return 'Match'
  }
}

export function qualitativeLabelFromScore(score: number, status: EligibilityStatusV2): QualitativeMatchLabel {
  if (status === 'requirements_missing' || status === 'needs_review') {
    return 'Long-term / Requirements needed'
  }
  if (score >= 85) return 'Strong match'
  if (score >= 70) return 'Good match'
  if (score >= 50) return 'Developing match'
  return 'Long-term / Requirements needed'
}

function academicRequiredRank(academicReq: string | null | undefined): number | null {
  return academicRequirementToRank(academicReq)
}

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
      (hint.includes('engineering') && /eng|ceng|ieng|engtech/i.test(r.body))
  )
}

function isSeniorRole(role: KnowledgeRoleRow, stage: KnowledgeStageRow | null): boolean {
  const seniority = (role.seniority_level ?? '').toLowerCase()
  if (SENIOR_LEVELS.has(seniority)) return true
  if (SENIOR_TITLE.test(role.name)) return true
  const stageKey = (stage?.stage_key ?? '').toLowerCase()
  // Only treat as senior when stage key explicitly indicates chartered/senior —
  // do NOT treat every Site Engineer as Chartered solely because of a shared stage model.
  if (
    /chartered_professional|chartered_engineer|senior_engineer|principal|leadership|management/.test(
      stageKey
    ) &&
    CHARTERED_TITLE.test(role.name)
  ) {
    return true
  }
  if (/principal|leadership|director|head_of/.test(stageKey)) return true
  return false
}

function isEntryRole(role: KnowledgeRoleRow): boolean {
  const seniority = (role.seniority_level ?? '').toLowerCase()
  if (ENTRY_LEVELS.has(seniority)) return true
  if (ENTRY_TITLE.test(role.name)) return true
  const min = role.minimum_experience_years
  if (min != null && min <= 0) return true
  return false
}

function requiresExplicitChartership(role: KnowledgeRoleRow): boolean {
  if (CHARTERED_TITLE.test(role.name)) return true
  const note = `${role.eligibility_note ?? ''} ${role.professional_registration_requirement ?? ''}`.toLowerCase()
  if (/\bchartered\b|\bceng\b|\bieng\b/.test(note) && /required|must|mandatory/.test(note)) {
    return true
  }
  const reg = normalizeRegistrationRequirement(role.professional_registration_requirement)
  if (reg === 'required' && /\bchartered\b|\bceng\b/.test(note)) return true
  return false
}

/**
 * Strip contradictory pairs from reason lists (safety net).
 */
export function removeContradictions(args: {
  matchedReasons: string[]
  unmetRequirements: string[]
  warnings: string[]
}): { matchedReasons: string[]; unmetRequirements: string[]; warnings: string[] } {
  const matched = [...args.matchedReasons]
  const unmet = [...args.unmetRequirements]
  const warnings = [...args.warnings]

  const dropPositiveIfUnmet = (positivePattern: RegExp, unmetPattern: RegExp) => {
    const hasUnmet = unmet.some((u) => unmetPattern.test(u)) || warnings.some((w) => unmetPattern.test(w))
    if (!hasUnmet) return
    for (let i = matched.length - 1; i >= 0; i--) {
      if (positivePattern.test(matched[i])) matched.splice(i, 1)
    }
  }

  dropPositiveIfUnmet(/experience looks sufficient|experience meets/i, /experience|years/i)
  dropPositiveIfUnmet(
    /registration requirements appear met|registration present|registration confirmed/i,
    /registration|charter|licence|license|nmc|gmc|ceng|ieng/i
  )
  dropPositiveIfUnmet(/qualification level matches|qualification meets/i, /qualification|degree|academic/i)

  // Never keep both sufficient + more experience needed
  const hasExpGap = unmet.some((u) => /experience|years/i.test(u))
  if (hasExpGap) {
    for (let i = matched.length - 1; i >= 0; i--) {
      if (/experience looks sufficient|experience meets/i.test(matched[i])) matched.splice(i, 1)
    }
  }

  return { matchedReasons: matched, unmetRequirements: unmet, warnings }
}

export function evaluateRoleMatch(args: {
  role: KnowledgeRoleRow
  specialism: KnowledgeSpecialismRow
  field: KnowledgeFieldRow
  stage: KnowledgeStageRow | null
  profile: NormalisedWorkInEducationProfile
  resolution: FieldSpecialismResolution
  specialismRank: number
  /** Optional prior eligibility signals (scope / recognition) from evaluateRoleEligibility */
  prior?: Pick<
    RoleEligibilityResult,
    'eligibility' | 'gaps' | 'warnings' | 'demotion_reasons' | 'professional_stage_gate' | 'scope_gate'
  >
}): RoleMatchEvaluation {
  const { role, specialism, field, profile, resolution, specialismRank, stage, prior } = args

  const matchedReasons: string[] = []
  const unmetRequirements: string[] = []
  const warnings: string[] = []
  const caps: string[] = []

  const regulated =
    Boolean(role.is_regulated_or_restricted) || Boolean(specialism.regulated_profession)
  const years = Math.max(0, profile.years_relevant_experience)
  const minExp =
    role.minimum_experience_years == null ? null : Math.max(0, role.minimum_experience_years)
  const experienceUnknown =
    minExp == null &&
    !(role.experience_requirement_label && role.experience_requirement_label.trim()) &&
    !isEntryRole(role) &&
    !isSeniorRole(role, stage)

  const regKind = normalizeRegistrationRequirement(role.professional_registration_requirement, {
    regulated,
  })
  const hasReg = hasActiveRegistration(profile, specialism.professional_body)
  const charterRequired = requiresExplicitChartership(role)
  const senior = isSeniorRole(role, stage)
  const entry = isEntryRole(role)

  // —— Specialism / field (30) ——
  let specialismPts = 0
  const primarySpecId = resolution.primary_specialism?.id
  const primaryFieldId = resolution.primary_field?.id
  if (primarySpecId && specialism.id === primarySpecId) {
    specialismPts = SCORE_WEIGHTS.specialism
    matchedReasons.push(`Your specialism matches ${specialism.name}`)
  } else if (primaryFieldId && field.id === primaryFieldId) {
    specialismPts = specialismRank === 0 ? 22 : Math.max(10, 20 - specialismRank * 4)
    matchedReasons.push(`Same career field (${field.name}) with a closely related specialism`)
  } else if (resolution.alternative_specialisms?.some((s) => s.id === specialism.id)) {
    specialismPts = 12
    warnings.push('Related specialism within your broader field — confirm the best fit')
  } else {
    specialismPts = 0
    unmetRequirements.push('This role is outside your matched education specialism')
  }

  // —— Qualification (20) ——
  let qualificationPts = 0
  const reqRank = academicRequiredRank(role.academic_requirement)
  const qualCheck = qualificationSatisfiesAcademicRequirement(
    profile.qualification,
    role.academic_requirement
  )
  const userRank = profileAcademicRank(profile)
  let qualificationMandatoryMissing = false

  if (reqRank == null) {
    // Unknown / none — do not claim a match; mild credit if user has a degree
    if (userRank >= 2) {
      qualificationPts = Math.round(SCORE_WEIGHTS.qualification * 0.7)
      warnings.push('Qualification requirement is not fully specified in the library for this role')
    } else {
      qualificationPts = Math.round(SCORE_WEIGHTS.qualification * 0.4)
      warnings.push('Qualification requirement is not fully specified in the library for this role')
    }
  } else if (qualCheck.ok) {
    qualificationPts = SCORE_WEIGHTS.qualification
    matchedReasons.push('Your qualification level meets this role’s academic requirement')
    if (profile.qualification.is_integrated_masters) {
      matchedReasons.push('Integrated Master’s award (e.g. MEng) distinguished from a taught MSc')
    }
  } else if (qualCheck.needs_review || qualCheck.reason_code.includes('overseas')) {
    qualificationPts = Math.round(SCORE_WEIGHTS.qualification * 0.25)
    unmetRequirements.push(qualCheck.message)
    warnings.push('UK recognition of your qualification may need review')
  } else if (
    qualCheck.reason_code.includes('pgce') ||
    qualCheck.reason_code.includes('professional_not_degree')
  ) {
    qualificationPts = Math.round(SCORE_WEIGHTS.qualification * 0.2)
    qualificationMandatoryMissing = /degree|phd|master/i.test(role.academic_requirement ?? '')
    unmetRequirements.push(qualCheck.message)
  } else if (userRank + 1 >= reqRank) {
    qualificationPts = Math.round(SCORE_WEIGHTS.qualification * 0.45)
    unmetRequirements.push('Your qualification level is slightly below the typical requirement')
  } else {
    qualificationPts = 0
    qualificationMandatoryMissing = true
    unmetRequirements.push(
      'Your qualification level is below the mandatory requirement for this role'
    )
  }

  // Prior education_match false from eligibility
  if (prior && prior.eligibility.education_match === false && !qualificationMandatoryMissing) {
    if (!unmetRequirements.some((u) => /qualification/i.test(u))) {
      unmetRequirements.push('Qualification level may not fully meet this role')
    }
    qualificationPts = Math.min(qualificationPts, Math.round(SCORE_WEIGHTS.qualification * 0.35))
  }

  // —— Experience (25) ——
  let experiencePts = 0
  if (experienceUnknown) {
    experiencePts = Math.round(SCORE_WEIGHTS.experience * 0.4)
    warnings.push('Experience requirements are not clearly defined for this role — review carefully')
  } else if (minExp == null || minExp === 0) {
    // Explicitly entry / no minimum
    experiencePts = SCORE_WEIGHTS.experience
    if (years === 0) {
      matchedReasons.push('This role does not require prior experience')
    } else {
      matchedReasons.push('Your experience meets the stated requirement for this role')
    }
  } else if (years >= minExp) {
    experiencePts = SCORE_WEIGHTS.experience
    matchedReasons.push('Your relevant experience meets or exceeds the role minimum')
  } else if (years > 0) {
    const ratio = years / minExp
    experiencePts = Math.round(SCORE_WEIGHTS.experience * Math.max(0.15, Math.min(0.85, ratio)))
    unmetRequirements.push(
      `More relevant experience is typically needed (about ${minExp}+ years; you have ${years})`
    )
  } else {
    // 0 years vs role that expects experience — NEVER "looks sufficient"
    experiencePts = 0
    unmetRequirements.push(
      `More relevant experience is typically needed (about ${minExp}+ years; you have 0)`
    )
  }

  // —— Career stage (15) ——
  let stagePts = 0
  if (senior && years < Math.max(minExp ?? 3, 3)) {
    stagePts = Math.round(SCORE_WEIGHTS.career_stage * 0.15)
    unmetRequirements.push('This role’s seniority is above your current career stage')
  } else if (charterRequired && !hasReg) {
    stagePts = Math.round(SCORE_WEIGHTS.career_stage * 0.2)
    unmetRequirements.push('Chartered or professional registration status is unconfirmed')
  } else if (entry || (minExp != null && minExp <= 1 && years >= (minExp ?? 0))) {
    stagePts = SCORE_WEIGHTS.career_stage
    matchedReasons.push('Role stage aligns with an entry or early-career pathway')
  } else if (years + 2 >= (minExp ?? 0) && !senior) {
    stagePts = Math.round(SCORE_WEIGHTS.career_stage * 0.7)
    matchedReasons.push('Role stage is a realistic next step from your current profile')
  } else if (senior) {
    stagePts = Math.round(SCORE_WEIGHTS.career_stage * 0.25)
    unmetRequirements.push('This is a senior or specialist progression role')
  } else {
    stagePts = Math.round(SCORE_WEIGHTS.career_stage * 0.55)
  }

  // Do not treat Site Engineer as Chartered unless explicitly required
  if (
    /site engineer/i.test(role.name) &&
    !charterRequired &&
    unmatchedCharteredStage(stage)
  ) {
    // Soft note only — stage model may be shared; do not add unmet charter requirement
    warnings.push(
      'Confirm the experience level expected for this Site Engineer role — it is not automatically a Chartered grade'
    )
  }

  // —— Registration / licence (10) ——
  let registrationPts = 0
  let mandatoryRegMissing = false

  if (regKind === 'required' || (regulated && regKind !== 'not_required' && regKind !== 'desirable')) {
    if (hasReg && !charterRequired) {
      registrationPts = SCORE_WEIGHTS.registration
      matchedReasons.push('Professional registration requirements appear met')
    } else if (hasReg && charterRequired) {
      // Has some registration but chartership specifically required — check body
      const engReg = profile.professional_registration.some(
        (r) =>
          r.status === 'registered' &&
          /ceng|chartered|ieng|engineering council/i.test(r.body)
      )
      if (engReg) {
        registrationPts = SCORE_WEIGHTS.registration
        matchedReasons.push('Professional registration requirements appear met')
      } else {
        registrationPts = 0
        mandatoryRegMissing = true
        unmetRequirements.push('Chartered or professional registration status is unconfirmed')
      }
    } else {
      registrationPts = 0
      mandatoryRegMissing = true
      unmetRequirements.push(
        regulated
          ? 'Professional registration or licence must be confirmed for this regulated pathway'
          : 'Professional registration is required and not confirmed'
      )
    }
  } else if (regKind === 'desirable') {
    if (hasReg) {
      registrationPts = SCORE_WEIGHTS.registration
      matchedReasons.push('You hold registration that is desirable for this role')
    } else {
      registrationPts = Math.round(SCORE_WEIGHTS.registration * 0.6)
      warnings.push('Professional registration is desirable but not mandatory for this role')
    }
  } else if (regKind === 'unknown') {
    registrationPts = Math.round(SCORE_WEIGHTS.registration * 0.5)
    if (regulated) {
      warnings.push('Registration requirements are unclear in the library — confirm before applying')
    } else {
      warnings.push('Some employers may ask for qualification evidence.')
    }
  } else {
    // not_required — full points, but do NOT claim "registration appear met"
    registrationPts = SCORE_WEIGHTS.registration
  }

  if (charterRequired && !hasReg) {
    if (!unmetRequirements.some((u) => /charter/i.test(u))) {
      unmetRequirements.push(
        regulated
          ? 'Chartered or professional registration status is unconfirmed'
          : 'Some employers may ask for qualification evidence.'
      )
    }
    if (regulated) {
      mandatoryRegMissing = true
      registrationPts = 0
    }
  }

  // Prior recognition / scope
  if (prior?.eligibility.country_recognition_review_needed) {
    warnings.push('UK recognition of your qualification may need review')
  }
  if (
    prior?.eligibility.qualification_scope_match === 'mismatched' ||
    prior?.eligibility.registration_scope_match === 'mismatched'
  ) {
    unmetRequirements.push('Registration branch / scope does not match this role')
    mandatoryRegMissing = true
  }

  for (const d of prior?.demotion_reasons ?? []) {
    if (/charter|ceng|professional_stage/i.test(d) && !charterRequired && /site engineer/i.test(role.name)) {
      // Ignore automatic chartered demotion wording for Site Engineer unless explicit
      continue
    }
    if (/experience|years|senior|registration|charter|scope|recognition/i.test(d)) {
      const msg = humanisePrior(d)
      if (msg && !unmetRequirements.includes(msg) && !warnings.includes(msg)) {
        if (/review|recognition|overseas/i.test(d)) warnings.push(msg)
        else unmetRequirements.push(msg)
      }
    }
  }

  let raw =
    specialismPts + qualificationPts + experiencePts + stagePts + registrationPts
  raw = Math.max(0, Math.min(100, Math.round(raw)))

  // —— Hard caps ——
  let capped = raw
  if (mandatoryRegMissing) {
    capped = Math.min(capped, 69)
    caps.push('mandatory_registration_missing')
  }
  if (qualificationMandatoryMissing) {
    capped = Math.min(capped, 49)
    caps.push('mandatory_qualification_missing')
  }
  if (senior && years < Math.max(minExp ?? 3, 3)) {
    capped = Math.min(capped, 49)
    caps.push('senior_experience_gap')
  }

  const needsReview =
    prior?.eligibility.status === 'needs_review' ||
    (regulated &&
      mandatoryRegMissing &&
      (field.slug === 'healthcare-medicine' || field.slug === 'law-legal-justice')) ||
    Boolean(prior?.eligibility.country_recognition_review_needed && regulated)

  if (needsReview) {
    capped = Math.min(capped, 69)
    caps.push('manual_review_regulated')
  }

  // Contradiction cleanup before status
  const cleaned = removeContradictions({
    matchedReasons,
    unmetRequirements,
    warnings,
  })

  // 100% only if every category full and no unmet/warnings
  const allCategoriesFull =
    specialismPts >= SCORE_WEIGHTS.specialism &&
    qualificationPts >= SCORE_WEIGHTS.qualification &&
    experiencePts >= SCORE_WEIGHTS.experience &&
    stagePts >= SCORE_WEIGHTS.career_stage &&
    registrationPts >= SCORE_WEIGHTS.registration

  if (
    cleaned.unmetRequirements.length > 0 ||
    cleaned.warnings.length > 0 ||
    !allCategoriesFull
  ) {
    capped = Math.min(capped, 99)
    if (cleaned.unmetRequirements.length > 0) caps.push('unmet_requirements_present')
  }

  if (capped >= 100 && (cleaned.unmetRequirements.length > 0 || cleaned.warnings.length > 0)) {
    capped = 69
    caps.push('blocked_perfect_score_with_gaps')
  }

  capped = Math.max(0, Math.min(100, Math.round(capped)))

  // —— Status & group ——
  let eligibilityStatus: EligibilityStatusV2
  let resultGroup: ResultGroupV2

  if (needsReview) {
    eligibilityStatus = 'needs_review'
    resultGroup = 'blocked_or_review'
  } else if (
    mandatoryRegMissing ||
    qualificationMandatoryMissing ||
    cleaned.unmetRequirements.some((u) => /mandatory|required and not|must be confirmed|scope does not/i.test(u))
  ) {
    // Heavy blockers
    if (senior && years < 3) {
      eligibilityStatus = 'future_pathway'
      resultGroup = 'future'
    } else if (mandatoryRegMissing || qualificationMandatoryMissing) {
      eligibilityStatus = 'requirements_missing'
      resultGroup = 'blocked_or_review'
    } else {
      eligibilityStatus = 'developing_match'
      resultGroup = 'developing'
    }
  } else if (senior && years < Math.max(minExp ?? 3, 3)) {
    eligibilityStatus = 'future_pathway'
    resultGroup = 'future'
  } else if (charterRequired && !hasReg) {
    eligibilityStatus = 'future_pathway'
    resultGroup = 'future'
  } else if (
    (minExp != null && minExp > 0 && years < minExp) ||
    cleaned.unmetRequirements.some((u) => /experience/i.test(u))
  ) {
    if (minExp != null && years + 2 < minExp) {
      eligibilityStatus = 'future_pathway'
      resultGroup = 'future'
    } else {
      eligibilityStatus = 'developing_match'
      resultGroup = 'developing'
    }
  } else if (
    capped >= 70 &&
    cleaned.unmetRequirements.length === 0 &&
    specialismPts >= 22 &&
    (entry || (minExp != null && years >= minExp) || (minExp === 0 || minExp == null && entry))
  ) {
    eligibilityStatus = 'eligible_now'
    resultGroup = 'immediate'
  } else if (capped >= 50) {
    eligibilityStatus = 'developing_match'
    resultGroup = 'developing'
  } else {
    eligibilityStatus = 'future_pathway'
    resultGroup = 'future'
  }

  // Academic / research preference
  if (
    (role.is_academic_role || role.is_research_role) &&
    resultGroup !== 'blocked_or_review'
  ) {
    if (eligibilityStatus === 'eligible_now' && userRank < 3) {
      eligibilityStatus = 'developing_match'
      resultGroup = 'developing'
    } else if (resultGroup === 'immediate' && userRank < 4 && /phd/i.test(role.academic_requirement ?? '')) {
      eligibilityStatus = 'future_pathway'
      resultGroup = 'future'
    }
  }

  // Final safety: never eligible_now with unmet or mandatory missing
  if (
    eligibilityStatus === 'eligible_now' &&
    (cleaned.unmetRequirements.length > 0 || mandatoryRegMissing || qualificationMandatoryMissing)
  ) {
    eligibilityStatus = mandatoryRegMissing || qualificationMandatoryMissing
      ? 'requirements_missing'
      : 'developing_match'
    resultGroup =
      eligibilityStatus === 'requirements_missing' ? 'blocked_or_review' : 'developing'
    capped = Math.min(capped, 69)
    caps.push('eligible_now_revoked')
  }

  if (eligibilityStatus === 'eligible_now' && capped < 70) {
    eligibilityStatus = 'developing_match'
    resultGroup = 'developing'
  }

  // Cap 100 again after status
  if (cleaned.unmetRequirements.length > 0) {
    capped = Math.min(capped, 99)
  }

  const nextBestAction = pickNextAction({
    eligibilityStatus,
    unmet: cleaned.unmetRequirements,
    warnings: cleaned.warnings,
    years,
    minExp,
  })

  const qualitativeLabel = qualitativeLabelFromScore(capped, eligibilityStatus)
  // Heavily blocked → never "Strong/Good match"
  const safeQualitative: QualitativeMatchLabel =
    resultGroup === 'blocked_or_review' || eligibilityStatus === 'requirements_missing'
      ? 'Long-term / Requirements needed'
      : resultGroup === 'future' && qualitativeLabel === 'Strong match'
        ? 'Developing match'
        : qualitativeLabel

  const whyItems: RoleMatchEvaluation['whyItems'] = [
    ...cleaned.matchedReasons.map((text) => ({ kind: 'positive' as const, text })),
    ...cleaned.unmetRequirements.map((text) => ({ kind: 'gap' as const, text })),
    ...cleaned.warnings.map((text) => ({ kind: 'warning' as const, text })),
  ]

  return {
    matchScore: capped,
    eligibilityStatus,
    resultGroup,
    matchedReasons: cleaned.matchedReasons,
    unmetRequirements: cleaned.unmetRequirements,
    warnings: cleaned.warnings,
    nextBestAction,
    requiresManualReview: eligibilityStatus === 'needs_review',
    scoreBreakdown: {
      specialism: specialismPts,
      qualification: qualificationPts,
      experience: experiencePts,
      career_stage: stagePts,
      registration: registrationPts,
      raw_total: raw,
      capped_total: capped,
      caps_applied: caps,
    },
    qualitativeLabel: safeQualitative,
    statusLabel: statusLabelV2(eligibilityStatus),
    whyItems,
  }
}

function unmatchedCharteredStage(stage: KnowledgeStageRow | null): boolean {
  const key = (stage?.stage_key ?? '').toLowerCase()
  return /chartered/.test(key)
}

function humanisePrior(reason: string): string {
  const r = reason.toLowerCase()
  if (r.includes('charter') || r.includes('ceng')) {
    return 'Chartered or professional registration status is unconfirmed'
  }
  if (r.includes('experience') || r.includes('years')) {
    return 'More relevant experience is typically needed'
  }
  if (r.includes('registration')) {
    return 'Professional registration is still required'
  }
  if (r.includes('senior') || r.includes('stage')) {
    return 'This role’s seniority is above your current career stage'
  }
  if (r.includes('recognition') || r.includes('overseas')) {
    return 'UK recognition of your qualification may need review'
  }
  return ''
}

function pickNextAction(args: {
  eligibilityStatus: EligibilityStatusV2
  unmet: string[]
  warnings: string[]
  years: number
  minExp: number | null
}): string {
  if (args.eligibilityStatus === 'needs_review') {
    return 'Review professional registration and recognition requirements before applying'
  }
  if (args.unmet.some((u) => /registration|charter|licence/i.test(u))) {
    return 'Confirm the required professional registration or licence'
  }
  if (args.unmet.some((u) => /experience/i.test(u))) {
    return 'Build relevant experience toward this role’s minimum'
  }
  if (args.unmet.some((u) => /qualification/i.test(u))) {
    return 'Review qualification pathways that meet this role’s academic requirement'
  }
  if (args.eligibilityStatus === 'eligible_now') {
    return 'Explore this as an available option now'
  }
  if (args.eligibilityStatus === 'developing_match') {
    return 'Treat this as a developing pathway and close the remaining gaps'
  }
  return 'Plan this as a longer-term career option'
}

/** Map v2 result group → legacy effective_fit for existing bucket keys */
export function resultGroupToEffectiveFit(
  group: ResultGroupV2,
  opts?: { academic?: boolean }
): RoleEligibilityResult['effective_fit'] {
  switch (group) {
    case 'immediate':
      return 'immediate'
    case 'developing':
      return 'realistic_next'
    case 'future':
      return opts?.academic ? 'academic_or_research' : 'future_progression'
    case 'blocked_or_review':
      return 'blocked_until_requirement'
    default:
      return 'realistic_next'
  }
}

export function eligibilityStatusToLegacy(
  status: EligibilityStatusV2
): RoleEligibilityResult['eligibility']['status'] {
  switch (status) {
    case 'eligible_now':
      return 'eligible'
    case 'developing_match':
      return 'conditionally_eligible'
    case 'future_pathway':
      return 'not_yet_eligible'
    case 'requirements_missing':
      return 'not_yet_eligible'
    case 'needs_review':
      return 'needs_review'
    default:
      return 'conditionally_eligible'
  }
}
