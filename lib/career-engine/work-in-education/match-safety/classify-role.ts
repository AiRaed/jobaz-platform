/**
 * Global role classification for Work in My Education results.
 */

import { detectRoleBlockers, type DetectedBlocker } from './blockers'
import {
  classifyStageBand,
  STAGE_BAND_RANK,
  stageBandAllowsImmediate,
  type StageBand,
} from './stage-bands'
import {
  classifyWieFieldFamily,
  fieldFamilyAllowsProfessionalRegistrationLanguage,
  isHardRegulatedRoleTitle,
  PRACTICAL_ENTRY_TITLE_RE,
  PRACTICAL_LEADERSHIP_TITLE_RE,
  type WieFieldFamily,
} from './field-families'
import {
  isHumanitiesSocialSciencesRoute,
} from './humanities-polish'
import { isLeadOrSeniorTitle } from './role-title-polish'
import type { KnowledgeRoleRow, KnowledgeStageRow, RoleEligibilityResult } from '../types'

const PROFESSIONAL_HARD_TITLE =
  /\b(chartered|registered\s+(nurse|teacher|social\s+worker|practitioner|engineer)|solicitor|barrister|paramedic|midwife|qualified\s+teacher|clinical\s+psychologist)\b/i

export type SafetyMatchType =
  | 'best_immediate_route'
  | 'developing_match'
  | 'future_career_option'
  | 'needs_review_regulated'
  | 'not_recommended_now'

export type SafetyClassification = {
  match_type: SafetyMatchType
  blockers: DetectedBlocker[]
  user_stage_band: StageBand
  role_stage_band: StageBand
  score_cap: number
  reasons: string[]
}

export type ClassifyContext = {
  userStageKey: string | null
  userStageLabel: string | null
  /** User explicitly browsing an academic/research stage */
  academicRouteSelected: boolean
  yearsExperience: number
  hasActiveRegistration: boolean
  /** Soft UK browse default — recognition blockers still surface for regulated notes */
  isUkQualification: boolean
  /** Role is linked to the exact stage the user selected */
  roleOnSelectedStage?: boolean
  /** Education field name / slug / specialism for family rules */
  fieldName?: string | null
  fieldSlug?: string | null
  specialismName?: string | null
}

function roleHay(role: KnowledgeRoleRow, stage: KnowledgeStageRow | null) {
  return {
    roleTitle: role.name,
    stageKey: stage?.stage_key ?? null,
    stageLabel: stage?.label ?? null,
    seniority: role.seniority_level,
    academicRequirement: role.academic_requirement,
    registrationRequirement: role.professional_registration_requirement,
    eligibilityNote: role.eligibility_note,
    regulated: Boolean(role.is_regulated_or_restricted),
    isResearchRole: Boolean(role.is_research_role),
    isAcademicRole: Boolean(role.is_academic_role),
    minimumExperienceYears: role.minimum_experience_years,
  }
}

function resolveFamily(ctx: ClassifyContext): WieFieldFamily {
  return classifyWieFieldFamily(ctx.fieldName, ctx.fieldSlug, ctx.specialismName)
}

function trulyNeedsRegulatedReview(
  role: KnowledgeRoleRow,
  hasProfessional: boolean,
  family: WieFieldFamily,
  ctx: ClassifyContext
): boolean {
  if (ctx.hasActiveRegistration) return false
  if (Boolean(role.is_regulated_or_restricted) && hasProfessional) return true
  if (isHardRegulatedRoleTitle(role.name) || PROFESSIONAL_HARD_TITLE.test(role.name)) return true
  if (
    fieldFamilyAllowsProfessionalRegistrationLanguage(family) &&
    hasProfessional &&
    /\b(nmc|gmc|hcpc|sra|bsb|riba|\bceng\b|\bqts\b|required|mandatory)\b/i.test(
      `${role.name} ${role.eligibility_note ?? ''} ${role.professional_registration_requirement ?? ''}`
    )
  ) {
    return true
  }
  return false
}

export function classifyRoleSafety(
  evaluated: RoleEligibilityResult,
  role: KnowledgeRoleRow,
  roleStage: KnowledgeStageRow | null,
  ctx: ClassifyContext
): SafetyClassification {
  const family = resolveFamily(ctx)
  const userBand = classifyStageBand(ctx.userStageKey, ctx.userStageLabel)
  const roleBand = classifyStageBand(roleStage?.stage_key, roleStage?.label)
  const titleBand = classifyStageBand(null, null, role.name)
  const blockers = detectRoleBlockers(roleHay(role, roleStage))
  const reasons: string[] = []
  const userRank = STAGE_BAND_RANK[userBand]
  const roleRank = STAGE_BAND_RANK[roleBand]
  const stageGap = roleRank - userRank
  const onSelected = Boolean(ctx.roleOnSelectedStage)

  if (!onSelected && stageGap >= 2) {
    blockers.push({
      kind: 'stage_mismatch',
      code: 'blocker.stage_mismatch',
      label: 'Role stage is well above your selected stage',
    })
  }

  const hasExperienceBlocker = blockers.some((b) => b.kind === 'experience')
  const hasProfessional = blockers.some((b) => b.kind === 'professional')
  const hasAcademic = blockers.some((b) => b.kind === 'academic')
  const hasQualification = blockers.some((b) => b.kind === 'qualification')
  const hasRecognition = blockers.some((b) => b.kind === 'recognition')
  const hasStageMismatch = blockers.some((b) => b.kind === 'stage_mismatch')

  const regMissing = trulyNeedsRegulatedReview(role, hasProfessional, family, ctx)

  const practicalEntry = PRACTICAL_ENTRY_TITLE_RE.test(role.name)
  const practicalLeadership = PRACTICAL_LEADERSHIP_TITLE_RE.test(role.name)

  // —— Regulated / registration review (only when genuinely regulated) ——
  if (regMissing) {
    reasons.push('Regulated or registration-gated role without confirmed credentials')
    return {
      match_type: 'needs_review_regulated',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 55,
      reasons,
    }
  }

  // Soft professional signals on non-regulated fields → never Needs review
  if (
    hasProfessional &&
    !regMissing &&
    !fieldFamilyAllowsProfessionalRegistrationLanguage(family)
  ) {
    // strip misleading professional blocker for public copy downstream via reason only
    reasons.push('Soft credential signal on a non-regulated field — treat as developing/future')
  }

  // —— Academic / research ——
  if (hasAcademic) {
    if (ctx.academicRouteSelected && (userBand === 'academic' || roleBand === 'academic')) {
      reasons.push('Academic route selected — research roles allowed as developing/future')
      return {
        match_type:
          roleBand === 'academic' && userBand === 'academic'
            ? 'developing_match'
            : 'future_career_option',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 70,
        reasons,
      }
    }
    reasons.push('Academic/research role without academic route or evidence')
    return {
      match_type: 'future_career_option',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 45,
      reasons,
    }
  }

  // —— Leadership stage: coordinator/officer/assistant can be immediate;
  // lead/senior titles need relevant experience (esp. Humanities & Social Sciences). ——
  if (
    onSelected &&
    (userBand === 'leadership' || /leadership/i.test(`${ctx.userStageKey} ${ctx.userStageLabel}`)) &&
    (practicalLeadership || practicalEntry) &&
    !regMissing &&
    !hasAcademic
  ) {
    const leadHeavy =
      isLeadOrSeniorTitle(role.name) ||
      (/\b(lead|director|head\b)\b/i.test(role.name) &&
        !/\b(coordinator|officer|assistant|administrator)\b/i.test(role.name))

    if (leadHeavy && ctx.yearsExperience < 2) {
      reasons.push('Lead/senior role without enough experience — future progression')
      return {
        match_type: 'future_career_option',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 55,
        reasons,
      }
    }

    if (practicalEntry || /\b(coordinator|officer|assistant|administrator)\b/i.test(role.name)) {
      reasons.push('Practical leadership-adjacent role on your selected Leadership stage')
      return {
        match_type: 'best_immediate_route',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 100,
        reasons,
      }
    }

    if (leadHeavy && ctx.yearsExperience >= 2) {
      reasons.push('Leadership role with relevant experience on selected stage')
      return {
        match_type: 'best_immediate_route',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 92,
        reasons,
      }
    }

    reasons.push('Practical leadership-adjacent role on your selected Leadership stage')
    return {
      match_type: 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 75,
      reasons,
    }
  }

  // Soft professional + stage gap → developing/future (not Needs review)
  if (hasProfessional && !regMissing && !onSelected && stageGap >= 1) {
    reasons.push('Professional credentials may be needed — treat as developing/future')
    return {
      match_type: stageGap >= 2 ? 'future_career_option' : 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: stageGap >= 2 ? 50 : 68,
      reasons,
    }
  }

  // —— Far above selected stage (other-stage roles) ——
  // On Leadership / officer stages, keep practical adjacent roles from earlier stages
  // as developing (not future-only) so results are not empty.
  if (!onSelected && (hasStageMismatch || stageGap >= 2)) {
    if (
      (userBand === 'leadership' || userBand === 'officer' || userBand === 'specialist') &&
      practicalEntry &&
      !hasAcademic &&
      !regMissing &&
      stageGap <= 2
    ) {
      const hss = isHumanitiesSocialSciencesRoute(ctx.fieldName, ctx.specialismName, ctx.fieldSlug)
      const nonReg =
        classifyWieFieldFamily(ctx.fieldName, ctx.fieldSlug, ctx.specialismName) ===
        'non_regulated_practical'
      // Non-regulated Leadership with little experience: practical assistants/officers are immediate.
      if (
        (hss || nonReg) &&
        userBand === 'leadership' &&
        ctx.yearsExperience < 2
      ) {
        reasons.push('Practical route suitable now under Leadership (experience still building)')
        return {
          match_type: 'best_immediate_route',
          blockers,
          user_stage_band: userBand,
          role_stage_band: roleBand,
          score_cap: 88,
          reasons,
        }
      }
      reasons.push('Practical adjacent role from a related earlier stage')
      return {
        match_type: 'developing_match',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 72,
        reasons,
      }
    }
    reasons.push('Role stage is substantially above your selected stage')
    return {
      match_type: stageGap >= 3 ? 'not_recommended_now' : 'future_career_option',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: stageGap >= 3 ? 35 : 50,
      reasons,
    }
  }

  // Title/seniority blockers on selected stage
  if (
    onSelected &&
    (hasExperienceBlocker ||
      roleBand === 'senior' ||
      roleBand === 'chartered' ||
      titleBand === 'senior' ||
      titleBand === 'chartered')
  ) {
    if (regMissing || roleBand === 'chartered' || titleBand === 'chartered') {
      reasons.push('Selected-stage role still gated by registration/chartership')
      return {
        match_type: 'needs_review_regulated',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 55,
        reasons,
      }
    }
    // Leadership / officer: experience-heavy on selected stage → developing, not review
    if (
      practicalLeadership ||
      practicalEntry ||
      userBand === 'leadership' ||
      userBand === 'officer'
    ) {
      reasons.push('Selected-stage role with experience signals — practical adjacent')
      return {
        match_type: 'developing_match',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 68,
        reasons,
      }
    }
    reasons.push('Selected-stage role has senior/experience signals in title')
    return {
      match_type: 'future_career_option',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 48,
      reasons,
    }
  }

  // Mid-level titles on entry/graduate stage
  const entryTitle = practicalEntry
  if (
    (onSelected || stageGap <= 0) &&
    (userBand === 'graduate' || userBand === 'apprentice' || userBand === 'foundation') &&
    !entryTitle &&
    !hasAcademic &&
    !regMissing &&
    (/\b(engineer|developer|nurse|teacher|solicitor|accountant|surveyor|architect)\b/i.test(
      role.name
    ) ||
      (role.minimum_experience_years ?? 0) >= 1 ||
      titleBand === 'specialist')
  ) {
    reasons.push('Mid-level title for an entry/graduate stage — treat as developing/future')
    return {
      match_type:
        (role.minimum_experience_years ?? 0) >= 3 || titleBand === 'specialist'
          ? 'future_career_option'
          : 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap:
        (role.minimum_experience_years ?? 0) >= 3 || titleBand === 'specialist' ? 48 : 68,
      reasons,
    }
  }

  // —— Senior / experience-heavy (other stages) ——
  if (
    !onSelected &&
    (hasExperienceBlocker ||
      roleBand === 'senior' ||
      roleBand === 'chartered' ||
      (role.minimum_experience_years ?? 0) >= 5)
  ) {
    if (ctx.yearsExperience >= (role.minimum_experience_years ?? 3)) {
      reasons.push('Experience-heavy role with some supporting experience')
      return {
        match_type: 'developing_match',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 65,
        reasons,
      }
    }
    reasons.push('Senior or experience-heavy role')
    return {
      match_type: 'future_career_option',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 48,
      reasons,
    }
  }

  // —— Specialist with qualification gap ——
  if ((roleBand === 'specialist' || hasQualification) && !stageBandAllowsImmediate(roleBand)) {
    reasons.push('Specialist/professional role needs bridging credentials')
    return {
      match_type: 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 68,
      reasons,
    }
  }

  // Recognition review — only escalate to Needs review for regulated families
  if (hasRecognition && !ctx.isUkQualification) {
    if (fieldFamilyAllowsProfessionalRegistrationLanguage(family) || Boolean(role.is_regulated_or_restricted)) {
      reasons.push('Recognition review needed for regulated pathway')
      return {
        match_type: 'needs_review_regulated',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 55,
        reasons,
      }
    }
    reasons.push('Recognition note — soft employer evidence warning')
    return {
      match_type: 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 68,
      reasons,
    }
  }

  // —— Same-stage / entry-appropriate ——
  const sameOrNearStage =
    onSelected || stageGap <= 0 || (stageGap === 1 && stageBandAllowsImmediate(roleBand))
  const entryAppropriate =
    (onSelected || stageBandAllowsImmediate(roleBand)) &&
    stageBandAllowsImmediate(userBand) &&
    !hasExperienceBlocker &&
    !regMissing &&
    !hasAcademic

  if (entryAppropriate && sameOrNearStage) {
    if (
      onSelected ||
      ((userBand === 'graduate' ||
        userBand === 'apprentice' ||
        userBand === 'foundation' ||
        userBand === 'officer' ||
        userBand === 'leadership') &&
        (roleBand === 'foundation' ||
          roleBand === 'apprentice' ||
          roleBand === 'graduate' ||
          roleBand === 'officer' ||
          roleBand === 'leadership' ||
          roleBand === 'unknown'))
    ) {
      reasons.push(
        onSelected
          ? 'Linked to your selected stage without hard blockers'
          : 'Stage-aligned entry/graduate role without hard blockers'
      )
      return {
        match_type: 'best_immediate_route',
        blockers,
        user_stage_band: userBand,
        role_stage_band: roleBand,
        score_cap: 100,
        reasons,
      }
    }
  }

  // Soft developing when field matches but light gaps remain
  if (sameOrNearStage && !hasAcademic && !regMissing) {
    reasons.push('Good specialism match with bridging steps likely')
    return {
      match_type: 'developing_match',
      blockers,
      user_stage_band: userBand,
      role_stage_band: roleBand,
      score_cap: 72,
      reasons,
    }
  }

  reasons.push('Default future pathway')
  return {
    match_type: 'future_career_option',
    blockers,
    user_stage_band: userBand,
    role_stage_band: roleBand,
    score_cap: 50,
    reasons,
  }
}

export function safetyTypeToEffectiveFit(
  type: SafetyMatchType
): RoleEligibilityResult['effective_fit'] {
  switch (type) {
    case 'best_immediate_route':
      return 'immediate'
    case 'developing_match':
      return 'realistic_next'
    case 'future_career_option':
      return 'future_progression'
    case 'needs_review_regulated':
      return 'blocked_until_requirement'
    case 'not_recommended_now':
      return 'blocked_until_requirement'
    default:
      return 'future_progression'
  }
}
