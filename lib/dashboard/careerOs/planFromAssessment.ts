/**
 * Generate My Plan entirely from UK Career Assistant assessment output.
 * No generic placeholders â€” empty state when no assessment exists.
 */

import {
  loadCaResultSnapshot,
  normalizeStoredRuleResult,
  parseGuestAssessmentSnapshot,
} from '@/lib/uk-career-assistant/guestSession'
import { loadStoredJourney } from '@/lib/career-journey/storage'
import {
  extractTrainingPlanRoutes,
  loadTrainingRoutes,
  type RecommendedTrainingRoute,
} from '@/lib/career-hub/trainingPlan'
import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { normalizeCareerBrainOutput } from '@/lib/career-brain/normalizeOutput'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { isUkCareerRuleResult, isUnifiedStoredResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { UserAssessmentRecord } from '@/lib/jobaz-ai/memory/loadUserAssessment'
import { generateCareerRoadmap } from './careerRoadmap'
import type {
  CareerPlanType,
  GeneratedCareerPlan,
  PlanActivitySignals,
  SuggestedRole,
} from './types'

export type AssessmentBundle = {
  ruleResult: UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  brain: CareerBrainOutput | null
  aiState: Record<string, unknown>
  trainingRoutes: RecommendedTrainingRoute[]
  completedAt: number
  assessmentId?: string
  userId?: string | null
}

function extractBrainFromStored(
  ruleResult: UkCareerRuleResult & { career_brain?: CareerBrainOutput },
  stored?: { uk_state?: Record<string, unknown> }
): CareerBrainOutput | null {
  const raw =
    ruleResult.career_brain ??
    stored?.uk_state?.career_brain_result ??
    null
  return normalizeCareerBrainOutput(raw)
}

function resolveTrainingRoutesFromBrain(
  brain: CareerBrainOutput | null,
  answers?: Record<string, unknown>
): RecommendedTrainingRoute[] {
  const ukGrowth = brain?.ukTransitionGrowth
  if (ukGrowth) {
    const interestArea = String(answers?.ntuk_interest_area ?? '')
    return extractTrainingPlanRoutes(ukGrowth, interestArea || null)
  }
  return []
}

export function buildAssessmentBundleFromRecord(
  row: UserAssessmentRecord
): AssessmentBundle | null {
  const stored = row.result
  if (!stored || typeof stored !== 'object') {
    console.warn('[buildAssessmentBundleFromRecord] missing result object', row.id)
    return null
  }

  let ruleResult: (UkCareerRuleResult & { career_brain?: CareerBrainOutput }) | null = null
  let ukState: Record<string, unknown> | undefined

  if (isUnifiedStoredResult(stored)) {
    ukState = stored.uk_state as Record<string, unknown> | undefined
    const answers =
      (ukState?.answers as Record<string, unknown> | undefined) ??
      (row.answers as Record<string, unknown> | undefined) ??
      {}

    if (isUkCareerRuleResult(stored.rule_result)) {
      ruleResult = stored.rule_result as UkCareerRuleResult & { career_brain?: CareerBrainOutput }
    } else {
      ruleResult = normalizeStoredRuleResult(stored.rule_result, {
        ...ukState,
        answers,
        career_brain_result: ukState?.career_brain_result,
      })
      if (!ruleResult) {
        console.warn('[buildAssessmentBundleFromRecord] could not normalize unified rule_result', row.id)
        return null
      }
    }
  } else if (isUkCareerRuleResult(stored)) {
    ruleResult = stored as UkCareerRuleResult & { career_brain?: CareerBrainOutput }
  } else {
    ruleResult = normalizeStoredRuleResult(stored, row.answers ?? {})
    if (!ruleResult) {
      console.warn('[buildAssessmentBundleFromRecord] unrecognized stored shape', row.id)
      return null
    }
  }

  const brain = extractBrainFromStored(ruleResult, { uk_state: ukState })
  const answers =
    (ukState?.answers as Record<string, unknown> | undefined) ??
    (row.answers as Record<string, unknown> | undefined) ??
    {}

  const trainingRoutes =
    resolveTrainingRoutesFromBrain(brain, answers).length > 0
      ? resolveTrainingRoutesFromBrain(brain, answers)
      : []

  const aiState: Record<string, unknown> = {
    ...(ukState ?? {}),
    answers,
    career_brain_result: brain ?? undefined,
    career_engine_result: ukState?.career_engine_result ?? undefined,
  }

  if (brain) {
    ruleResult = { ...ruleResult, career_brain: brain }
  }

  return {
    ruleResult,
    brain,
    aiState,
    trainingRoutes,
    completedAt: Date.parse(row.created_at) || Date.now(),
    assessmentId: row.id,
    userId: row.user_id,
  }
}

/** Anonymous / pre-login only â€” reads shared localStorage snapshot. */
export function loadAssessmentBundleFromLocal(): AssessmentBundle | null {
  const parsed = parseGuestAssessmentSnapshot()
  if (parsed) {
    const { result: ruleResult, aiState, timestamp } = parsed
    const brain =
      extractBrainFromStored(ruleResult, {
        uk_state: aiState as Record<string, unknown> | undefined,
      }) ?? normalizeCareerBrainOutput(aiState?.career_brain_result)
    if (brain) {
      ruleResult.career_brain = brain
    }
    console.log('[assessmentLoader] hydrated bundle from local snapshot', {
      sessionId: parsed.sessionId,
      timestamp: parsed.timestamp,
    })
    return {
      ruleResult,
      brain,
      aiState,
      trainingRoutes: loadTrainingRoutes(),
      completedAt: timestamp,
    }
  }

  const snapshot = loadCaResultSnapshot()
  if (snapshot?.result?.result && isUkCareerRuleResult(snapshot.result.result)) {
    const ruleResult = snapshot.result.result as UkCareerRuleResult & { career_brain?: CareerBrainOutput }
    const brain =
      extractBrainFromStored(ruleResult, {
        uk_state: snapshot.aiState as Record<string, unknown> | undefined,
      }) ??
      normalizeCareerBrainOutput(snapshot.aiState?.career_brain_result)
    if (brain) {
      ruleResult.career_brain = brain
    }
    return {
      ruleResult,
      brain,
      aiState: snapshot.aiState ?? {},
      trainingRoutes: loadTrainingRoutes(),
      completedAt: snapshot.timestamp,
    }
  }

  const journey = loadStoredJourney()
  if (journey?.hasCompletedAssessment && journey.profile) {
    const workNow = journey.profile.pathTriad.workNow[0]
    return {
      ruleResult: {
        summary: journey.profile.assessmentSummary ?? journey.profile.currentSituation,
        work_now: {
          directions: workNow
            ? [{ direction_id: workNow.id, direction_title: workNow.title, why: workNow.why }]
            : [],
        },
        improve_later: null,
        avoid: [],
        next_step: 'Continue your career plan',
      },
      brain: null,
      aiState: {},
      trainingRoutes: loadTrainingRoutes(),
      completedAt: Date.parse(journey.updatedAt),
    }
  }

  return null
}

/** @deprecated Use resolveAssessmentBundle() for auth-aware loading. */
export function loadAssessmentBundle(): AssessmentBundle | null {
  return loadAssessmentBundleFromLocal()
}

export function detectPlanType(brain: CareerBrainOutput | null): CareerPlanType {
  if (brain?.businessDiscoveryGrowth || brain?.sideIncomeGrowth) return 'freelancer'
  if (brain?.growCareerGrowth) return 'promotion_seeker'
  if (brain?.careerChangeTransition) return 'career_changer'
  const uk = brain?.ukTransitionGrowth?.finalReport
  if (uk?.pathLetter === 'A' || uk?.categoryLabel?.toLowerCase().includes('qualified')) {
    return 'qualified_professional'
  }
  const profile = brain?.careerProfile
  const needsLicence =
    (uk?.recommendedCertifications?.length ?? 0) > 0 ||
    (profile?.licences?.length ?? 0) > 0 ||
    profile?.yearsOfExperience === 0 ||
    profile?.yearsOfExperience === null
  if (needsLicence) return 'entry_with_licence'
  if (profile?.yearsOfExperience && profile.yearsOfExperience >= 3) return 'qualified_professional'
  return 'entry_with_licence'
}

export function resolvePathId(bundle: AssessmentBundle): string | null {
  return bundle.trainingRoutes[0]?.pathId ?? null
}

export function resolveRouteLabel(bundle: AssessmentBundle): string {
  const engine = bundle.aiState?.career_engine_result as
    | { pathId?: string; skillsLabels?: string[]; fieldLabel?: string; specialisationLabel?: string }
    | undefined

  if (engine?.pathId === 'side_job' && engine.skillsLabels?.length) {
    const interest = engine.skillsLabels[0]
    return `${interest} extra income`
  }
  if (engine?.specialisationLabel && engine?.fieldLabel) {
    return `${engine.specialisationLabel} · ${engine.fieldLabel}`
  }
  if (engine?.fieldLabel) return engine.fieldLabel

  const uk = bundle.brain?.ukTransitionGrowth?.finalReport
  if (uk?.recommendedRouteLabel) return uk.recommendedRouteLabel
  if (bundle.trainingRoutes[0]?.categoryLabel) return bundle.trainingRoutes[0].categoryLabel
  const dir = bundle.ruleResult.work_now?.directions?.[0]
  if (dir?.direction_title) return dir.direction_title
  return bundle.ruleResult.summary.split('.')[0]?.trim() || 'Your recommended route'
}

export function resolveTimeToEmployment(bundle: AssessmentBundle, planType: CareerPlanType): string {
  const brain = bundle.brain
  const ukFast = brain?.ukTransitionGrowth?.finalReport?.fastestRouteIntoWork
  if (ukFast && ukFast.length < 80) return ukFast
  const changeTimeline = brain?.careerChangeTransition?.estimatedTimeline
  if (changeTimeline) return changeTimeline
  const growTimeline = brain?.growCareerGrowth?.nextRealisticStep?.timeline
  if (growTimeline) return growTimeline

  const byType: Record<CareerPlanType, string> = {
    entry_with_licence: '4â€“10 weeks after training',
    qualified_professional: '2â€“6 weeks',
    career_changer: '8â€“16 weeks',
    promotion_seeker: '3â€“9 months',
    freelancer: '4â€“12 weeks to first client',
  }
  return byType[planType]
}

function isTechRoute(bundle: AssessmentBundle, pathId: string | null): boolean {
  const workNow = bundle.brain?.recommendedPaths?.workNow?.[0]?.title ?? ''
  return (
    pathId === 'digital-ai-beginner' ||
    bundle.brain?.careerProfile?.domain === 'IT_digital' ||
    /developer|software|engineer|it|tech/i.test(workNow)
  )
}

export function extractSuggestedRoles(
  bundle: AssessmentBundle,
  destinationTarget: string
): SuggestedRole[] {
  const titles: string[] = []
  const uk = bundle.brain?.ukTransitionGrowth?.finalReport

  if (destinationTarget) titles.push(destinationTarget)

  for (const job of uk?.recommendedJobs ?? []) {
    if (job.title) titles.push(job.title)
  }

  for (const role of bundle.brain?.recommendedPaths?.workNow ?? []) {
    if (role.title) titles.push(role.title)
  }

  const seen = new Set<string>()
  const roles: SuggestedRole[] = []
  for (const raw of titles) {
    const title = raw.trim()
    const key = title.toLowerCase()
    if (!title || seen.has(key)) continue
    seen.add(key)
    roles.push({ title })
    if (roles.length >= 8) break
  }
  return roles
}

export function generateCareerPlanFromAssessment(
  bundle: AssessmentBundle,
  signals: PlanActivitySignals
): GeneratedCareerPlan {
  return generateCareerRoadmap(bundle, signals)
}

export { generateCareerRoadmap } from './careerRoadmap'
