/**
 * Apply global match safety after Knowledge Library candidates are scored.
 * Rebuckets + rewrites friendly copy. Field-agnostic.
 */

import type {
  KnowledgeRoleRow,
  KnowledgeStageRow,
  RoleEligibilityResult,
  WorkInEducationMatchResult,
} from '../types'
import { classifyRoleSafety, safetyTypeToEffectiveFit, type SafetyMatchType } from './classify-role'
import { blockerToFriendly, friendlyRewrite, matchTypeLabel } from './friendly-copy'
import { classifyWieFieldFamily, PRACTICAL_ENTRY_TITLE_RE } from './field-families'
import {
  demoteImmediateMatchType,
  polishPublicRoleCopy,
  FUTURE_ROUTE_SOFT_LINE,
} from './public-card-polish'

export type SafetyApplyOptions = {
  userStageKey: string | null
  userStageLabel: string | null
  userStageId?: string | null
  academicRouteSelected?: boolean
  yearsExperience?: number
  hasActiveRegistration?: boolean
  isUkQualification?: boolean
  fieldName?: string | null
  fieldSlug?: string | null
  specialismName?: string | null
  /** Keep not_recommended_now in requirements bucket (default true, capped) */
  includeNotRecommended?: boolean
  limits?: {
    immediate?: number
    developing?: number
    future?: number
    review?: number
  }
  /** Target vs current stage semantics */
  stageMeaning?: 'target' | 'current'
  targetStageKey?: string | null
  targetStageLabel?: string | null
  /** When stage is a target, classify immediate routes against readiness keys */
  readinessStageKey?: string | null
  readinessStageLabel?: string | null
}

function rewriteRoleCopy(
  role: RoleEligibilityResult,
  matchType: SafetyMatchType,
  blockers: ReturnType<typeof classifyRoleSafety>['blockers'],
  fieldFamily: ReturnType<typeof classifyWieFieldFamily>
): RoleEligibilityResult {
  const isImmediate = matchType === 'best_immediate_route'
  const isDeveloping = matchType === 'developing_match'
  const suppressNoExp =
    matchType === 'future_career_option' ||
    matchType === 'needs_review_regulated' ||
    matchType === 'not_recommended_now'

  // Only surface hard blockers in public why for non-immediate routes
  const friendlyBlockers =
    isImmediate || isDeveloping
      ? blockers
          .filter((b) => b.kind === 'qualification' || b.kind === 'recognition')
          .map((b) => blockerToFriendly(b, fieldFamily))
      : blockers.map((b) => blockerToFriendly(b, fieldFamily))

  const rewriteOpts = { suppressNoExperience: suppressNoExp, fieldFamily }

  const match_reasons = role.match_reasons
    .map((t) => friendlyRewrite(t, rewriteOpts))
    .filter(Boolean)
    .slice(0, 6)

  const warnings = role.warnings
    .map((t) => friendlyRewrite(t, rewriteOpts))
    .filter(Boolean)

  const gapMessages = role.gaps.map((g) => ({
    ...g,
    message: friendlyRewrite(g.message, rewriteOpts) || g.message,
  }))

  // Prefer blocker-friendly explanations in evaluation why/unmet
  let evaluation = role.evaluation
  if (evaluation) {
    const unmet = [
      ...friendlyBlockers,
      ...evaluation.unmetRequirements
        .map((t) => friendlyRewrite(t, rewriteOpts))
        .filter(Boolean),
    ]
    const matched = evaluation.matchedReasons
      .map((t) => {
        if (isImmediate && /does not require prior experience/i.test(t)) {
          return 'This role is suitable as an early-career starting point.'
        }
        return friendlyRewrite(t, rewriteOpts)
      })
      .filter(Boolean)
    const whyItems = [
      ...matched.slice(0, 3).map((text) => ({ kind: 'positive' as const, text })),
      ...unmet.slice(0, 4).map((text) => ({
        kind: text.toLowerCase().includes('review') ? ('warning' as const) : ('gap' as const),
        text,
      })),
    ]
    evaluation = {
      ...evaluation,
      matchedReasons: matched.slice(0, 6),
      unmetRequirements: [...new Set(unmet)].slice(0, 6),
      warnings: evaluation.warnings
        .map((t) => friendlyRewrite(t, rewriteOpts))
        .filter(Boolean),
      whyItems,
      statusLabel: matchTypeLabel(matchType),
      qualitativeLabel:
        matchType === 'best_immediate_route'
          ? 'Good match'
          : matchType === 'developing_match'
            ? 'Developing match'
            : matchType === 'needs_review_regulated'
              ? 'Long-term / Requirements needed'
              : 'Long-term / Requirements needed',
      nextBestAction:
        matchType === 'best_immediate_route'
          ? 'Prepare your CV and explore this pathway'
          : matchType === 'developing_match'
            ? 'Build experience or take a bridging course toward this role'
            : matchType === 'needs_review_regulated'
              ? 'Confirm registration or licence requirements before applying'
              : 'Treat this as a longer-term option',
    }
  }

  return {
    ...role,
    match_reasons,
    warnings,
    gaps: gapMessages,
    evaluation,
    effective_fit: safetyTypeToEffectiveFit(matchType),
  }
}

/**
 * Reclassify and rebucket matcher recommendations with global safety rules.
 */
export function applyMatchSafety(
  match: WorkInEducationMatchResult,
  roleById: Map<string, { role: KnowledgeRoleRow; stage: KnowledgeStageRow | null }>,
  opts: SafetyApplyOptions
): WorkInEducationMatchResult {
  const limits = {
    immediate: opts.limits?.immediate ?? 6,
    developing: opts.limits?.developing ?? 6,
    future: opts.limits?.future ?? 6,
    review: opts.limits?.review ?? 6,
  }

  const all = [
    ...match.recommendations.immediate,
    ...match.recommendations.realistic_next,
    ...match.recommendations.future_progression,
    ...match.recommendations.academic_or_research,
    ...match.recommendations.blocked_or_needs_review,
  ]

  const seen = new Set<string>()
  const classified: Array<{
    role: RoleEligibilityResult
    type: SafetyMatchType
  }> = []

  const fieldFamily = classifyWieFieldFamily(
    opts.fieldName,
    opts.fieldSlug,
    opts.specialismName
  )

  for (const item of all) {
    if (seen.has(item.role_id)) continue
    seen.add(item.role_id)
    const meta = roleById.get(item.role_id)
    if (!meta) continue

    const classifyStageKey =
      opts.stageMeaning === 'target' && opts.readinessStageKey
        ? opts.readinessStageKey
        : opts.userStageKey
    const classifyStageLabel =
      opts.stageMeaning === 'target' && opts.readinessStageLabel
        ? opts.readinessStageLabel
        : opts.userStageLabel

    const safety = classifyRoleSafety(item, meta.role, meta.stage, {
      userStageKey: classifyStageKey,
      userStageLabel: classifyStageLabel,
      academicRouteSelected: Boolean(opts.academicRouteSelected),
      yearsExperience: opts.yearsExperience ?? 0,
      hasActiveRegistration: Boolean(opts.hasActiveRegistration),
      isUkQualification: opts.isUkQualification !== false,
      // When stage is a TARGET, library "selected stage" roles are progression goals — not "on current stage"
      roleOnSelectedStage:
        opts.stageMeaning === 'target'
          ? false
          : Boolean(opts.userStageId && meta.role.stage_id && meta.role.stage_id === opts.userStageId),
      fieldName: opts.fieldName ?? item.field?.name,
      fieldSlug: opts.fieldSlug ?? item.field?.slug,
      specialismName: opts.specialismName ?? item.specialism?.name,
    })

    let matchType = demoteImmediateMatchType({
      matchType: safety.match_type,
      title: meta.role.name,
      yearsExperience: opts.yearsExperience ?? 0,
      minimumExperienceYears: meta.role.minimum_experience_years ?? 0,
      hasExperienceBlocker: safety.blockers.some((b) => b.kind === 'experience'),
      hasAcademicBlocker: safety.blockers.some((b) => b.kind === 'academic'),
      fieldName: opts.fieldName ?? item.field?.name,
      specialismName: opts.specialismName ?? item.specialism?.name,
      fieldSlug: opts.fieldSlug ?? item.field?.slug,
      whyLines: item.match_reasons,
      requirementLines: [
        ...(item.evaluation?.unmetRequirements ?? []),
        ...item.gaps.map((g) => g.message),
      ],
    })

    const next = rewriteRoleCopy(item, matchType, safety.blockers, fieldFamily)

    // Second-pass demote using rewritten public copy (catches soft experience lines)
    matchType = demoteImmediateMatchType({
      matchType,
      title: meta.role.name,
      yearsExperience: opts.yearsExperience ?? 0,
      minimumExperienceYears: meta.role.minimum_experience_years ?? 0,
      hasExperienceBlocker: safety.blockers.some((b) => b.kind === 'experience'),
      hasAcademicBlocker: safety.blockers.some((b) => b.kind === 'academic'),
      fieldName: opts.fieldName ?? item.field?.name,
      specialismName: opts.specialismName ?? item.specialism?.name,
      fieldSlug: opts.fieldSlug ?? item.field?.slug,
      whyLines: [
        ...(next.match_reasons ?? []),
        ...(next.evaluation?.matchedReasons ?? []),
        ...(next.evaluation?.unmetRequirements ?? []),
      ],
      requirementLines: next.gaps.map((g) => g.message),
    })

    if (matchType !== safety.match_type && next.evaluation) {
      next.evaluation = {
        ...next.evaluation,
        statusLabel: matchTypeLabel(matchType),
        qualitativeLabel:
          matchType === 'best_immediate_route'
            ? 'Good match'
            : matchType === 'developing_match'
              ? 'Developing match'
              : matchType === 'needs_review_regulated'
                ? 'Long-term / Requirements needed'
                : 'Long-term / Requirements needed',
        nextBestAction:
          matchType === 'best_immediate_route'
            ? 'Prepare your CV and explore this pathway'
            : matchType === 'developing_match'
              ? 'Build experience or take a bridging course toward this role'
              : matchType === 'needs_review_regulated'
                ? 'Confirm registration or licence requirements before applying'
                : FUTURE_ROUTE_SOFT_LINE,
      }
      next.effective_fit = safetyTypeToEffectiveFit(matchType)
    }

    if (next.evaluation) {
      const polished = polishPublicRoleCopy({
        matchType,
        why: next.evaluation.whyItems?.map((w) => w.text) ?? next.match_reasons,
        requirements: next.evaluation.unmetRequirements ?? [],
      })
      next.evaluation = {
        ...next.evaluation,
        unmetRequirements: polished.requirements,
        whyItems: polished.why.map((text) => ({
          kind: /future route|may need|review|experience|study/i.test(text)
            ? ('warning' as const)
            : ('positive' as const),
          text,
        })),
        matchedReasons: polished.why.filter((t) => !/future route|may need|experience|study/i.test(t)).slice(0, 4),
        warnings: [...new Set(next.evaluation.warnings.map((w) => w.trim()).filter(Boolean))],
      }
      next.match_reasons = polished.why.slice(0, 6)
      next.gaps = next.gaps
        .map((g) => ({ ...g, message: g.message }))
        .filter((g, i, arr) => arr.findIndex((x) => x.message === g.message) === i)
        .filter((g) => !polished.why.some((w) => w.toLowerCase() === g.message.toLowerCase()))
    }

    // Cap score so advanced roles cannot look like “strong immediate”
    const scoreCap =
      matchType === 'future_career_option'
        ? Math.min(safety.score_cap, 55)
        : matchType === 'developing_match'
          ? Math.min(safety.score_cap, 75)
          : safety.score_cap
    next.match_score = Math.min(next.match_score, scoreCap)
    // Prefer roles linked to the user's selected stage within a bucket
    if (
      opts.userStageId &&
      meta.role.stage_id === opts.userStageId &&
      (matchType === 'best_immediate_route' || matchType === 'developing_match')
    ) {
      next.match_score = Math.min(scoreCap, next.match_score + 8)
    }
    if (next.evaluation) {
      next.evaluation = {
        ...next.evaluation,
        matchScore: next.match_score,
        resultGroup:
          matchType === 'best_immediate_route'
            ? 'immediate'
            : matchType === 'developing_match'
              ? 'developing'
              : matchType === 'needs_review_regulated' || matchType === 'not_recommended_now'
                ? 'blocked_or_review'
                : 'future',
        eligibilityStatus:
          matchType === 'best_immediate_route'
            ? 'eligible_now'
            : matchType === 'developing_match'
              ? 'developing_match'
              : matchType === 'needs_review_regulated'
                ? 'needs_review'
                : matchType === 'not_recommended_now'
                  ? 'requirements_missing'
                  : 'future_pathway',
      }
      // Stash debug on evaluation via caps_applied
      next.evaluation.scoreBreakdown = {
        ...next.evaluation.scoreBreakdown,
        caps_applied: [
          ...next.evaluation.scoreBreakdown.caps_applied,
          `safety:${matchType}`,
          ...safety.blockers.map((b) => b.code),
        ],
      }
    }

    // Attach safety metadata for public contract via demotion_reasons debug prefix
    next.demotion_reasons = [
      ...next.demotion_reasons.filter((d) => !d.startsWith('safety:')),
      `safety:${matchType}`,
      ...safety.reasons.map((r) => `safety_reason:${r}`),
    ]

    classified.push({ role: next, type: matchType })
  }

  const sortFn = (a: RoleEligibilityResult, b: RoleEligibilityResult) =>
    b.match_score - a.match_score || a.role_title.localeCompare(b.role_title)

  let immediate = classified
    .filter((c) => c.type === 'best_immediate_route')
    .map((c) => c.role)
    .sort(sortFn)
    .slice(0, limits.immediate)

  let developing = classified
    .filter((c) => c.type === 'developing_match')
    .map((c) => c.role)
    .sort(sortFn)
    .slice(0, limits.developing)

  // Guardrail: never leave Best immediate empty when practical adjacent roles exist
  // for non-regulated / practical fields (and leadership/officer stages).
  if (immediate.length === 0 && developing.length > 0) {
    const promote = developing.filter((r) => {
      if (!PRACTICAL_ENTRY_TITLE_RE.test(r.role_title)) return false
      const type = demoteImmediateMatchType({
        matchType: 'best_immediate_route',
        title: r.role_title,
        yearsExperience: opts.yearsExperience ?? 0,
        fieldName: opts.fieldName ?? r.field?.name,
        specialismName: opts.specialismName ?? r.specialism?.name,
        fieldSlug: opts.fieldSlug ?? r.field?.slug,
        whyLines: r.match_reasons,
        requirementLines: r.evaluation?.unmetRequirements ?? r.gaps.map((g) => g.message),
      })
      return type === 'best_immediate_route'
    })
    const pool = promote.length > 0 ? promote : []
    if (pool.length > 0) {
      immediate = pool.slice(0, Math.min(4, limits.immediate)).map((r) => ({
        ...r,
        effective_fit: 'immediate' as const,
        demotion_reasons: [
          ...r.demotion_reasons.filter((d) => !d.startsWith('safety:')),
          'safety:best_immediate_route',
          'safety_reason:Promoted from practical adjacent to avoid empty immediate routes',
        ],
      }))
      const promotedIds = new Set(immediate.map((r) => r.role_id))
      developing = developing.filter((r) => !promotedIds.has(r.role_id)).slice(0, limits.developing)
    }
  }

  const future = classified
    .filter((c) => c.type === 'future_career_option')
    .map((c) => c.role)
    .sort(sortFn)
    .slice(0, limits.future)

  // Non-regulated fields: demote soft "needs_review" that slipped through into future/developing
  let review = classified
    .filter(
      (c) =>
        c.type === 'needs_review_regulated' ||
        (opts.includeNotRecommended !== false && c.type === 'not_recommended_now')
    )
    .map((c) => c.role)
    .sort(sortFn)
    .slice(0, limits.review)

  const publicWarnings = match.warnings
    .map((w) => friendlyRewrite(w, { fieldFamily }))
    .filter((w) => w && !/draft library|integration testing|not for public/i.test(w))

  return {
    ...match,
    recommendations: {
      immediate,
      realistic_next: developing,
      future_progression: future,
      academic_or_research: [], // folded into future/review by safety rules
      blocked_or_needs_review: review,
    },
    warnings: publicWarnings.length
      ? publicWarnings
      : ['Results respect your selected career stage and common UK entry requirements.'],
  }
}

export type { SafetyMatchType }
