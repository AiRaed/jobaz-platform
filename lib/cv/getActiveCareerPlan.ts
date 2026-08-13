/**
 * Shared active career plan resolution — My Plan, Documents, CV Builder.
 *
 * Priority:
 * 1. jobaz_plan_v1 (Career Coach → My Plan handoff)
 * 2. Assessment bundle (Supabase then local) via buildPathPlanLadder /
 *    career_engine_result — same source as Dashboard My Plan
 * 3. CA snapshot jobaz_plan / ladder fields
 *
 * Never prefer education-path Design Engineer localStorage over an active
 * JobAZ / assessment plan.
 */

import {
  isJobAZPlan,
  mapCareerCoachResultToPlan,
  type JobAZPlan,
} from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { buildPathPlanLadder, type PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import {
  loadAssessmentBundleFromLocal,
  type AssessmentBundle,
} from '@/lib/dashboard/careerOs/planFromAssessment'
import { resolveAssessmentBundle } from '@/lib/dashboard/careerOs/assessmentLoader'
import { resolvePlanKeywords } from '@/lib/cv/comparePlanToCv'
import { CA_RESULT_STORAGE_KEY, loadCaResultSnapshot } from '@/lib/uk-career-assistant/guestSession'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'

export const JOBAZ_PLAN_STORAGE_KEY = 'jobaz_plan_v1'

export type ActiveCareerPlanSource = 'supabase' | 'localStorage' | 'none'

export type ActiveCareerPlan = {
  planId: string | null
  planTitle: string
  route: string
  goal: string
  currentTarget: string
  nextUpgrade: string
  recommendedJobs: string[]
  recommendedCourses: string[]
  cvFocusKeywords: string[]
  createdAt: string | null
  updatedAt: string | null
  planSource: ActiveCareerPlanSource
  /** Compat for CV Builder journey header */
  targetRole: string
  pathLabel: string
  readinessScore: number
  sourcePathId: string | null
}

function fromJobAZPlan(
  plan: JobAZPlan,
  planSource: ActiveCareerPlanSource,
  planId: string | null = null
): ActiveCareerPlan {
  const planTitle = plan.route_summary.route_title || 'Your career plan'
  const currentTarget = plan.route_summary.current_target_role || ''
  const nextUpgrade = plan.route_summary.next_upgrade_role || ''
  const keywords = resolvePlanKeywords({
    routeTitle: planTitle,
    pathId: plan.source_path_id,
    currentTarget,
    nextUpgrade,
    targetRole: currentTarget,
  })

  return {
    planId,
    planTitle,
    route: planTitle,
    goal: plan.route_summary.one_sentence_summary || planTitle,
    currentTarget,
    nextUpgrade,
    recommendedJobs: (plan.work_now || []).map((w) => w.title).filter(Boolean),
    recommendedCourses: [
      plan.training_next?.title,
      ...(plan.optional_training || []).map((t) => t.title),
    ].filter(Boolean) as string[],
    cvFocusKeywords: keywords,
    createdAt: null,
    updatedAt: null,
    planSource,
    targetRole: currentTarget || planTitle,
    pathLabel: planTitle,
    readinessScore: plan.route_summary.readiness_score ?? 0,
    sourcePathId: plan.source_path_id || null,
  }
}

function fromPathLadder(
  ladder: PathPlanLadder,
  planSource: ActiveCareerPlanSource,
  planId: string | null = null,
  updatedAt: string | null = null
): ActiveCareerPlan {
  const planTitle = ladder.routeLabel || 'Your career plan'
  const currentTarget = ladder.startNow[0]?.title || ''
  const nextUpgrade = ladder.upgradeAfter[0]?.title || ''
  const keywords = resolvePlanKeywords({
    routeTitle: planTitle,
    pathId: ladder.pathId,
    currentTarget,
    nextUpgrade,
    targetRole: currentTarget,
  })

  return {
    planId,
    planTitle,
    route: planTitle,
    goal: planTitle,
    currentTarget,
    nextUpgrade,
    recommendedJobs: ladder.startNow.map((s) => s.title).filter(Boolean),
    recommendedCourses: ladder.trainingTitles.filter(Boolean),
    cvFocusKeywords: keywords,
    createdAt: null,
    updatedAt,
    planSource,
    targetRole: currentTarget || planTitle,
    pathLabel: planTitle,
    readinessScore: 0,
    sourcePathId: ladder.pathId || null,
  }
}

function fromBundle(
  bundle: AssessmentBundle,
  planSource: ActiveCareerPlanSource
): ActiveCareerPlan | null {
  const jp = bundle.aiState?.jobaz_plan
  if (isJobAZPlan(jp)) {
    return {
      ...fromJobAZPlan(jp, planSource, bundle.assessmentId || null),
      updatedAt: bundle.completedAt
        ? new Date(bundle.completedAt).toISOString()
        : null,
    }
  }

  const ladder = buildPathPlanLadder(bundle)
  if (ladder?.routeLabel) {
    return fromPathLadder(
      ladder,
      planSource,
      bundle.assessmentId || null,
      bundle.completedAt ? new Date(bundle.completedAt).toISOString() : null
    )
  }

  // Map career_engine_result directly if ladder builder missed it
  const raw = bundle.aiState?.career_engine_result
  const mapped = mapCareerCoachResultToPlan(raw)
  if (mapped) {
    return {
      ...fromJobAZPlan(mapped, planSource, bundle.assessmentId || null),
      updatedAt: bundle.completedAt
        ? new Date(bundle.completedAt).toISOString()
        : null,
    }
  }

  const routeLabel =
    (typeof bundle.aiState.route_label === 'string' && bundle.aiState.route_label) ||
    (typeof bundle.aiState.path_label === 'string' && bundle.aiState.path_label) ||
    ''
  if (routeLabel) {
    return {
      planId: bundle.assessmentId || null,
      planTitle: routeLabel,
      route: routeLabel,
      goal: routeLabel,
      currentTarget: '',
      nextUpgrade: '',
      recommendedJobs: [],
      recommendedCourses: [],
      cvFocusKeywords: resolvePlanKeywords({ routeTitle: routeLabel }),
      createdAt: null,
      updatedAt: bundle.completedAt
        ? new Date(bundle.completedAt).toISOString()
        : null,
      planSource,
      targetRole: routeLabel,
      pathLabel: routeLabel,
      readinessScore: 0,
      sourcePathId: null,
    }
  }

  return null
}

function mergeLocalJobazIntoBundle(bundle: AssessmentBundle | null): AssessmentBundle | null {
  if (!bundle || typeof window === 'undefined') return bundle
  try {
    const raw = localStorage.getItem(JOBAZ_PLAN_STORAGE_KEY)
    if (!raw) return bundle
    const plan = JSON.parse(raw) as unknown
    if (!isJobAZPlan(plan)) return bundle
    return {
      ...bundle,
      aiState: {
        ...bundle.aiState,
        jobaz_plan: plan,
      },
    }
  } catch {
    return bundle
  }
}

function readLocalJobazPlan(): ActiveCareerPlan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(JOBAZ_PLAN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!isJobAZPlan(parsed)) return null
    return fromJobAZPlan(parsed, 'localStorage', 'jobaz_plan_v1')
  } catch {
    return null
  }
}

function readCaSnapshotPlan(): ActiveCareerPlan | null {
  if (typeof window === 'undefined') return null
  try {
    const snap = loadCaResultSnapshot()
    if (!snap) return null
    const ai = (snap as { aiState?: Record<string, unknown> }).aiState
    const jp = ai?.jobaz_plan
    if (isJobAZPlan(jp)) {
      return fromJobAZPlan(jp, 'localStorage', 'ca_snapshot')
    }

    const engine = ai?.career_engine_result
    const mapped = mapCareerCoachResultToPlan(engine)
    if (mapped) {
      return fromJobAZPlan(mapped, 'localStorage', 'ca_snapshot')
    }

    // Snapshot shaped like a full assessment bundle
    const localBundle = loadAssessmentBundleFromLocal()
    if (localBundle) {
      const fromLocal = fromBundle(localBundle, 'localStorage')
      if (fromLocal) return fromLocal
    }

    const path = (snap as { result?: { path?: string } }).result?.path
    const result = (snap as { result?: { result?: Record<string, unknown> } }).result?.result
    if (path || result) {
      const routeTitle =
        (typeof result?.fieldLabel === 'string' && result.fieldLabel) ||
        (typeof path === 'string' ? path.replace(/_/g, ' ') : '') ||
        ''
      if (!routeTitle) return null
      return {
        planId: CA_RESULT_STORAGE_KEY,
        planTitle: routeTitle,
        route: routeTitle,
        goal: routeTitle,
        currentTarget: '',
        nextUpgrade: '',
        recommendedJobs: [],
        recommendedCourses: [],
        cvFocusKeywords: resolvePlanKeywords({ routeTitle }),
        createdAt: null,
        updatedAt: null,
        planSource: 'localStorage',
        targetRole: routeTitle,
        pathLabel: routeTitle,
        readinessScore: 0,
        sourcePathId: typeof path === 'string' ? path : null,
      }
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Sync read — prefers JobAZ plan handoff, then local assessment ladder
 * (same derivation as My Plan). Does NOT read education-path Design Engineer store.
 */
export function getActiveCareerPlanSync(): ActiveCareerPlan | null {
  const localJobaz = readLocalJobazPlan()
  if (localJobaz) return localJobaz

  try {
    const localBundle = mergeLocalJobazIntoBundle(loadAssessmentBundleFromLocal())
    if (localBundle) {
      const fromLocal = fromBundle(localBundle, 'localStorage')
      if (fromLocal) return fromLocal
    }
  } catch {
    // ignore
  }

  return readCaSnapshotPlan()
}

/** Normalize an assessment bundle into the shared ActiveCareerPlan shape. */
export function activePlanFromAssessmentBundle(
  bundle: AssessmentBundle | null,
  planSource: ActiveCareerPlanSource = 'supabase'
): ActiveCareerPlan | null {
  if (!bundle) return null
  return fromBundle(mergeLocalJobazIntoBundle(bundle) ?? bundle, planSource)
}

/**
 * Async — for logged-in users, Supabase active JobAZ plan is source of truth.
 * localStorage is guest-only / mirror.
 */
export async function getActiveCareerPlanForUser(
  userId?: string | null
): Promise<ActiveCareerPlan | null> {
  const uid = userId ?? (await resolveAuthenticatedUserId())

  if (uid) {
    try {
      const { fetchActivePlanFromServer } = await import(
        '@/lib/career-assistant/add-to-my-plan/activePlanClient'
      )
      const active = await fetchActivePlanFromServer()
      if (active?.jobaz_plan) {
        return fromJobAZPlan(active.jobaz_plan, 'supabase', active.action_plan_id || 'jaz_active')
      }
      const bundle = await resolveAssessmentBundle()
      const fromSb = activePlanFromAssessmentBundle(bundle, 'supabase')
      if (fromSb) return fromSb
    } catch {
      // fall through
    }
    return null
  }

  const localJobaz = readLocalJobazPlan()
  if (localJobaz) return localJobaz

  try {
    const bundle = mergeLocalJobazIntoBundle(await resolveAssessmentBundle())
    const fromLocal = activePlanFromAssessmentBundle(bundle, 'localStorage')
    if (fromLocal) return fromLocal
  } catch {
    // fall through
  }

  return readCaSnapshotPlan()
}

export function activeCareerPlanToCvContext(plan: ActiveCareerPlan): {
  active: true
  source: 'uk_career_assistant'
  targetRole: string
  pathLabel: string
  readinessScore: number
  suggestedSkills: string[]
  missingQualifications: string[]
  currentTarget: string
  nextUpgrade: string
  planTitle: string
  cvFocusKeywords: string[]
  planSource: ActiveCareerPlanSource
  planId: string | null
} {
  return {
    active: true,
    source: 'uk_career_assistant',
    targetRole: plan.currentTarget || plan.targetRole || plan.planTitle,
    pathLabel: plan.planTitle || plan.pathLabel,
    readinessScore: plan.readinessScore,
    suggestedSkills: [], // never use keyword tokens as CV skills
    missingQualifications: plan.recommendedCourses.slice(0, 4),
    currentTarget: plan.currentTarget,
    nextUpgrade: plan.nextUpgrade,
    planTitle: plan.planTitle,
    cvFocusKeywords: plan.cvFocusKeywords,
    planSource: plan.planSource,
    planId: plan.planId,
  }
}

export function getActivePlanHeadline(plan: ActiveCareerPlan | null): string {
  if (!plan) return 'Build your CV for your next UK role.'
  const { planTitle, currentTarget, nextUpgrade } = plan
  if (currentTarget && nextUpgrade && nextUpgrade !== currentTarget) {
    return `Focused on ${currentTarget} now, with ${nextUpgrade} as your next upgrade.`
  }
  if (currentTarget) {
    return `You're preparing a CV for ${planTitle} — current target: ${currentTarget}.`
  }
  return `You're preparing a CV for ${planTitle}.`
}
