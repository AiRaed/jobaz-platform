/**
 * Qualification / registration scope gates (Nursing fully implemented).
 * Reusable architecture for other regulated fields later.
 */

import { aliasKey } from './aliases'
import type {
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  NormalisedWorkInEducationProfile,
  ProfessionalRegistrationInput,
  RegistrationScope,
  ScopeMatch,
} from './types'

export type NursingBranch =
  | 'adult_nursing'
  | 'mental_health_nursing'
  | 'childrens_nursing'
  | 'learning_disability_nursing'
  | 'midwifery'
  | 'nursing_associate'
  | 'general_nursing'
  | 'unknown'

const NURSING_BRANCH_PATTERNS: Array<{ branch: NursingBranch; re: RegExp }> = [
  { branch: 'midwifery', re: /\bmidwif/i },
  { branch: 'nursing_associate', re: /\bnursing associate\b|\btrainee nursing associate\b/i },
  {
    branch: 'mental_health_nursing',
    re: /\bmental health\b|\bpsychiatric nurs|\bmhn\b/i,
  },
  {
    branch: 'childrens_nursing',
    re: /\bchildren'?s?\b|\bpaediatric\b|\bpediatric\b|\bneonatal nurs/i,
  },
  {
    branch: 'learning_disability_nursing',
    re: /\blearning disabilit/i,
  },
  { branch: 'adult_nursing', re: /\badult nurs|\badult nursing\b/i },
]

/** Infer nursing branch from free text (qualification title / role title). */
export function inferNursingBranchFromText(text: string): NursingBranch {
  const t = text.trim()
  if (!t) return 'unknown'
  for (const { branch, re } of NURSING_BRANCH_PATTERNS) {
    if (re.test(t)) return branch
  }
  // Generic "nursing" alone → general / unknown (not a specific branch)
  if (/\bnurs/i.test(t) && !/\bmidwif/i.test(t)) return 'general_nursing'
  return 'unknown'
}

export function inferRegistrationScopeFromQualification(
  qualificationTitle: string,
  subject: string
): RegistrationScope | null {
  const combined = `${qualificationTitle} ${subject}`
  const branch = inferNursingBranchFromText(combined)
  switch (branch) {
    case 'adult_nursing':
      return 'adult_nursing'
    case 'mental_health_nursing':
      return 'mental_health_nursing'
    case 'childrens_nursing':
      return 'childrens_nursing'
    case 'learning_disability_nursing':
      return 'learning_disability_nursing'
    case 'midwifery':
      return 'midwifery'
    case 'nursing_associate':
      return 'nursing_associate'
    default:
      return null
  }
}

export function resolveProfileNursingScope(
  profile: NormalisedWorkInEducationProfile
): RegistrationScope {
  // Explicit registration scope wins
  for (const reg of profile.professional_registration) {
    if (
      reg.status === 'registered' &&
      /nmc|nursing.?midwifery/i.test(reg.body) &&
      reg.registration_scope &&
      reg.registration_scope !== 'unknown'
    ) {
      return reg.registration_scope
    }
  }
  // Cautious inference from qualification title only (not bare "Nursing")
  const inferred = inferRegistrationScopeFromQualification(
    profile.qualification_title_raw,
    profile.specialisation_raw ?? ''
  )
  if (inferred) return inferred

  // Subject "Adult Nursing" etc.
  const fromSubject = inferRegistrationScopeFromQualification('', profile.subject_raw)
  if (fromSubject && fromSubject !== 'unknown') return fromSubject

  return 'unknown'
}

export function detectRoleNursingBranch(role: KnowledgeRoleRow): NursingBranch {
  return inferNursingBranchFromText(`${role.name} ${role.description ?? ''}`)
}

function scopesCompatible(
  profileScope: RegistrationScope,
  roleBranch: NursingBranch
): ScopeMatch {
  if (profileScope === 'unknown' || roleBranch === 'unknown') return 'unknown'
  if (roleBranch === 'general_nursing') {
    // General registered nurse / staff nurse — OK for adult (and often any RN part)
    // but NOT for midwifery or nursing associate
    if (profileScope === 'midwifery' || profileScope === 'nursing_associate') return 'mismatched'
    if (
      profileScope === 'adult_nursing' ||
      profileScope === 'mental_health_nursing' ||
      profileScope === 'childrens_nursing' ||
      profileScope === 'learning_disability_nursing'
    ) {
      return 'adjacent'
    }
    return 'unknown'
  }
  if (roleBranch === 'midwifery') {
    return profileScope === 'midwifery' ? 'matched' : 'mismatched'
  }
  if (roleBranch === 'nursing_associate') {
    return profileScope === 'nursing_associate' ? 'matched' : 'mismatched'
  }
  // Branch-specific RN roles
  if (roleBranch === profileScope) return 'matched'
  // Adult RN applying to mental health staff nurse = mismatch
  return 'mismatched'
}

export type ScopeEvaluation = {
  qualification_scope_match: ScopeMatch
  registration_scope_match: ScopeMatch
  profile_scope: RegistrationScope
  role_branch: NursingBranch | null
  applies: boolean
  demote_immediate: boolean
  force_fit: 'blocked_until_requirement' | 'needs_review' | null
  gaps: Array<{
    type: string
    severity: 'info' | 'warning' | 'blocker'
    code: string
    message_key: string
    message: string
    details: Record<string, unknown>
  }>
  scope_gate: string
}

export function evaluateQualificationScope(args: {
  profile: NormalisedWorkInEducationProfile
  role: KnowledgeRoleRow
  specialism: KnowledgeSpecialismRow
  fieldSlug: string
}): ScopeEvaluation {
  const { profile, role, specialism, fieldSlug } = args
  const empty: ScopeEvaluation = {
    qualification_scope_match: 'unknown',
    registration_scope_match: 'unknown',
    profile_scope: 'unknown',
    role_branch: null,
    applies: false,
    demote_immediate: false,
    force_fit: null,
    gaps: [],
    scope_gate: 'not_applicable',
  }

  const isNursingContext =
    fieldSlug === 'healthcare-medicine' &&
    (/nurs|midwif/i.test(specialism.slug) ||
      /nurs|midwif/i.test(specialism.name) ||
      /nurs|midwif/i.test(role.name))

  if (!isNursingContext) return empty

  const profileScope = resolveProfileNursingScope(profile)
  const roleBranch = detectRoleNursingBranch(role)
  const qualMatch = scopesCompatible(profileScope, roleBranch)

  // Registration scope: if NMC registered with known scope, compare; else unknown
  let regMatch: ScopeMatch = 'unknown'
  const nmcReg = profile.professional_registration.find(
    (r) => /nmc|nursing.?midwifery/i.test(r.body) && r.status === 'registered'
  )
  if (nmcReg) {
    const regScope =
      nmcReg.registration_scope && nmcReg.registration_scope !== 'unknown'
        ? nmcReg.registration_scope
        : profileScope
    regMatch = scopesCompatible(regScope, roleBranch)
  } else if (profile.professional_registration.some((r) => /nmc/i.test(r.body))) {
    regMatch = 'unknown'
  }

  const gaps: ScopeEvaluation['gaps'] = []
  let demote_immediate = false
  let force_fit: ScopeEvaluation['force_fit'] = null
  let scope_gate = 'nursing_scope_ok'

  if (qualMatch === 'mismatched' || regMatch === 'mismatched') {
    demote_immediate = true
    force_fit = 'blocked_until_requirement'
    scope_gate = 'nursing_scope_mismatch'
    gaps.push({
      type: 'registration_scope',
      severity: 'blocker',
      code: 'nursing_branch_scope_mismatch',
      message_key: 'career.registration.nursing_branch_scope_mismatch',
      message: `Role branch (${roleBranch}) does not match qualification/registration scope (${profileScope})`,
      details: { role_branch: roleBranch, profile_scope: profileScope },
    })
  } else if (
    (profileScope === 'unknown' || regMatch === 'unknown') &&
    roleBranch !== 'general_nursing' &&
    roleBranch !== 'unknown' &&
    /mental health|children|paediatric|learning disabilit|midwif|nursing associate/i.test(role.name)
  ) {
    demote_immediate = true
    force_fit = 'needs_review'
    scope_gate = 'nursing_scope_unknown'
    gaps.push({
      type: 'registration_scope',
      severity: 'blocker',
      code: 'nmc_scope_not_confirmed',
      message_key: 'career.registration.nmc_scope_not_confirmed',
      message: 'NMC registration part/scope not confirmed for this branch-specific role',
      details: { role_branch: roleBranch },
    })
  } else if (profileScope === 'unknown' && nmcReg) {
    // Generic nursing + registered but unknown scope: general roles OK as needs_review for branch-ish titles
    if (roleBranch !== 'general_nursing' && roleBranch !== 'unknown') {
      demote_immediate = true
      force_fit = 'needs_review'
      scope_gate = 'nursing_scope_unknown'
      gaps.push({
        type: 'clarification',
        severity: 'warning',
        code: 'nmc_scope_not_confirmed',
        message_key: 'career.registration.nmc_scope_not_confirmed',
        message: 'Confirm NMC registration part before recommending branch-specific nursing roles',
        details: {},
      })
    }
  }

  // Midwifery never interchangeable with nursing
  if (roleBranch === 'midwifery' && profileScope !== 'midwifery') {
    demote_immediate = true
    force_fit = 'blocked_until_requirement'
    scope_gate = 'midwifery_not_interchangeable'
  }

  return {
    qualification_scope_match: qualMatch,
    registration_scope_match: regMatch,
    profile_scope: profileScope,
    role_branch: roleBranch,
    applies: true,
    demote_immediate,
    force_fit,
    gaps,
    scope_gate,
  }
}

export function enrichRegistrationScopes(
  regs: ProfessionalRegistrationInput[],
  qualificationTitle: string,
  subject: string
): ProfessionalRegistrationInput[] {
  return regs.map((r) => {
    if (r.registration_scope && r.registration_scope !== 'unknown') return r
    if (!/nmc|nursing.?midwifery/i.test(r.body)) return r
    const inferred = inferRegistrationScopeFromQualification(qualificationTitle, subject)
    if (!inferred) return { ...r, registration_scope: r.registration_scope ?? 'unknown' }
    return { ...r, registration_scope: inferred }
  })
}

void aliasKey
