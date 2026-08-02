/**
 * Plan-aware CV readiness — shared by Documents and CV Builder.
 * Completeness from real CV fields + plan keyword/cert fit.
 * Mismatch with active plan caps the score (no fake “ready” for wrong route).
 */

import {
  calculateCvReadiness,
  type CareerPlanForCvReadiness,
  type CvReadinessInput,
  type CvReadinessResult,
  type CvReadinessStatus,
} from './calculateCvReadiness'
import {
  comparePlanToCv,
  resolvePlanKeywords,
  type ActivePlanSignals,
  type PlanCvMatchKind,
  type PlanCvMatchResult,
} from './comparePlanToCv'
import { isMeaningfulCv } from './isMeaningfulCv'

export type CvReadinessForPlanResult = CvReadinessResult & {
  planCvMatch: PlanCvMatchKind
  matchScore: number
  planMatchMessage: string
  planTitle: string
}

function statusLabelForMatch(
  base: CvReadinessStatus,
  match: PlanCvMatchKind,
  score: number
): string {
  if (match === 'no_cv') return 'No CV yet'
  if (match === 'empty_cv') return 'Started'
  if (match === 'mismatch') return 'Needs tailoring'
  if (match === 'partial_match') return 'Needs tailoring'
  if (match === 'good_match' && score >= 70) return 'Good match'
  if (base === 'application_ready') return 'Application ready'
  return 'Ready to improve'
}

function summaryForMatch(
  match: PlanCvMatchResult,
  planTitle: string,
  score: number
): string {
  if (match.planCvMatch === 'no_cv') {
    return planTitle
      ? `No CV yet. Build a CV for ${planTitle}.`
      : 'No CV yet. Start your Main CV first.'
  }
  if (match.planCvMatch === 'empty_cv') {
    return 'CV started but incomplete. Add real sections before you apply.'
  }
  if (match.planCvMatch === 'mismatch') {
    return `This CV exists, but it needs tailoring for your current plan${
      planTitle ? `: ${planTitle}` : ''
    }.`
  }
  if (match.planCvMatch === 'partial_match') {
    return `Saved CV found. Needs tailoring for ${planTitle || 'your current plan'}.`
  }
  if (score >= 70) {
    return `Good match for your current plan${planTitle ? `: ${planTitle}` : ''}.`
  }
  return match.message
}

/**
 * Combine structural CV completeness with active-plan relevance.
 */
export function calculateCvReadinessForPlan(
  cvData: CvReadinessInput,
  activePlan: ActivePlanSignals | CareerPlanForCvReadiness
): CvReadinessForPlanResult {
  const plan: ActivePlanSignals =
    activePlan && typeof activePlan === 'object'
      ? {
          routeTitle:
            ('routeTitle' in activePlan ? activePlan.routeTitle : null) ||
            null,
          pathId: 'pathId' in activePlan ? (activePlan as ActivePlanSignals).pathId : null,
          currentTarget:
            ('currentTarget' in activePlan
              ? (activePlan as ActivePlanSignals).currentTarget
              : null) || null,
          nextUpgrade:
            ('nextUpgrade' in activePlan
              ? (activePlan as ActivePlanSignals).nextUpgrade
              : null) || null,
          targetRole: activePlan.targetRole ?? null,
          focusKeywords:
            activePlan.focusKeywords ||
            resolvePlanKeywords(activePlan as ActivePlanSignals),
        }
      : null

  const keywords = resolvePlanKeywords(plan)
  const careerPlan: CareerPlanForCvReadiness = plan
    ? {
        targetRole: plan.currentTarget || plan.targetRole,
        routeTitle: plan.routeTitle,
        focusKeywords: keywords,
      }
    : null

  const base = calculateCvReadiness(cvData, careerPlan)
  const match = comparePlanToCv(cvData, plan, {
    hasSavedCvRow: Boolean(cvData),
  })
  const planTitle = plan?.routeTitle || plan?.currentTarget || ''

  // Start from structural score, then blend plan match and apply caps
  let score = base.score

  // Cert / keyword bonus already partially in base; reinforce plan match band
  if (match.planCvMatch === 'no_cv') {
    score = 0
  } else if (match.planCvMatch === 'empty_cv') {
    score = Math.min(score, 12)
  } else if (match.planCvMatch === 'mismatch') {
    // Cleaning CV + maybe SIA: improve slightly but stay needing tailoring
    const certBoost = match.matchedKeywords.some((k) => /sia|door supervisor/i.test(k))
      ? 8
      : 0
    score = Math.min(48, Math.round(score * 0.55 + match.matchScore * 0.35 + certBoost))
    score = Math.max(18, Math.min(50, score))
  } else if (match.planCvMatch === 'partial_match') {
    score = Math.min(58, Math.round(score * 0.65 + match.matchScore * 0.4))
    score = Math.max(28, Math.min(55, score))
  } else {
    // good_match — allow higher, but never invent completeness
    score = Math.min(100, Math.round(score * 0.7 + match.matchScore * 0.35))
  }

  if (cvData && !isMeaningfulCv(cvData)) {
    score = Math.min(score, 12)
  }

  score = Math.min(100, Math.max(0, Math.round(score)))

  const statusLabel = statusLabelForMatch(base.status, match.planCvMatch, score)
  const summaryLine = summaryForMatch(match, planTitle, score)

  let suggestedNextStep = base.suggestedNextStep
  if (match.planCvMatch === 'no_cv') {
    suggestedNextStep = planTitle
      ? `Build CV for this plan: ${planTitle}.`
      : 'Create your Main CV in CV Builder.'
  } else if (match.planCvMatch === 'empty_cv') {
    suggestedNextStep = 'Add contact details, summary, experience, and skills.'
  } else if (match.planCvMatch === 'mismatch' || match.planCvMatch === 'partial_match') {
    suggestedNextStep = planTitle
      ? `Tailor this CV for ${planTitle}.`
      : 'Tailor this CV for your current plan.'
  }

  // Status mapping by plan-aware score
  let status = base.status
  if (match.planCvMatch === 'no_cv') status = 'missing'
  else if (match.planCvMatch === 'empty_cv') status = 'started'
  else if (score < 45) status = 'needs_work'
  else if (score < 70) status = 'ready_to_improve'
  else status = 'application_ready'

  return {
    ...base,
    score,
    status,
    statusLabel,
    summaryLine,
    suggestedNextStep,
    targetKeywords: keywords,
    planCvMatch: match.planCvMatch,
    matchScore: match.matchScore,
    planMatchMessage: match.message,
    planTitle,
  }
}
