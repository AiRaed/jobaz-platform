/**
 * CV Builder career-mode context — prefers shared active career plan
 * (same source as My Plan / Documents). Stale education Design Engineer
 * localStorage is never used when no active JobAZ / assessment plan exists;
 * CV Builder shows a generic state instead.
 */

import {
  getActiveCareerPlanForUser,
  getActiveCareerPlanSync,
  getActivePlanHeadline,
  activeCareerPlanToCvContext,
  type ActiveCareerPlan,
} from '@/lib/cv/getActiveCareerPlan'

export type CvCareerPlanSource =
  | 'career_engine'
  | 'uk_career_assistant'
  | 'journey'
  | 'jobaz_plan'

export type CvCareerPlanContext = {
  active: true
  source: CvCareerPlanSource
  targetRole: string
  pathLabel: string
  readinessScore: number
  suggestedSkills: string[]
  missingQualifications: string[]
  currentTarget?: string
  nextUpgrade?: string
  planTitle?: string
  cvFocusKeywords?: string[]
  planSource?: 'supabase' | 'localStorage' | 'none'
  planId?: string | null
}

function fromActive(plan: ActiveCareerPlan): CvCareerPlanContext {
  const ctx = activeCareerPlanToCvContext(plan)
  return {
    ...ctx,
    source: 'jobaz_plan',
    planId: plan.planId,
  }
}

/** Sync load for immediate render — JobAZ / assessment plan only. */
export function loadCvCareerPlanContext(): CvCareerPlanContext | null {
  if (typeof window === 'undefined') return null
  const active = getActiveCareerPlanSync()
  if (active) return fromActive(active)
  return null
}

/** Async load — Supabase active plan beats localStorage for logged-in users. */
export async function loadCvCareerPlanContextAsync(): Promise<CvCareerPlanContext | null> {
  if (typeof window === 'undefined') return null
  const active = await getActiveCareerPlanForUser()
  if (active) return fromActive(active)
  return null
}

export function getCvRoleHeadline(plan: CvCareerPlanContext): string {
  if (plan.planTitle || plan.pathLabel) {
    return getActivePlanHeadline({
      planId: plan.planId ?? null,
      planTitle: plan.planTitle || plan.pathLabel,
      route: plan.planTitle || plan.pathLabel,
      goal: plan.planTitle || plan.pathLabel,
      currentTarget: plan.currentTarget || plan.targetRole || '',
      nextUpgrade: plan.nextUpgrade || '',
      recommendedJobs: [],
      recommendedCourses: [],
      cvFocusKeywords: plan.cvFocusKeywords || [],
      createdAt: null,
      updatedAt: null,
      planSource: plan.planSource || 'none',
      targetRole: plan.targetRole,
      pathLabel: plan.pathLabel,
      readinessScore: plan.readinessScore,
      sourcePathId: null,
    })
  }
  const role = plan.targetRole
  if (!role) return 'Build your CV for your next UK role.'
  if (/cv/i.test(role)) return `You're building a ${role}.`
  return `You're preparing a CV for ${role}.`
}
