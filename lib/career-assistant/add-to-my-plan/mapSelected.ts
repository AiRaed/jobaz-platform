/**
 * Map selected Add-to-My-Plan items → JobAZPlan + JazPlanAction[]
 * Always builds a full replacement plan — never merges old fallback data.
 * Plan identity comes from selected immediate role, not field/specialism.
 */

import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazPlanAction, JazPlanActionCategory, JazPlanActionPriority } from '@/lib/jaz-plan-engine/types'
import type { CaGoalPath, PlanPickCatalog, PlanPickItem, PlanPickProviderStatus } from './types'
import { buildCaStepKey } from './stepKey'
import { isCourseLikeTitle, resolveSelectedPlanIdentity } from './planIdentity'

export function goalPathLabel(goal: CaGoalPath | string): string {
  switch (goal) {
    case 'work_in_my_education':
      return 'Work in My Education'
    case 'work_in_my_profession':
      return 'Work in My Profession'
    case 'start_new_career':
      return 'Start a New Career'
    case 'extra_income':
      return 'Looking for Extra Income'
    default:
      return 'Career Assistant'
  }
}

function toSourcePathId(goal: CaGoalPath | string): string {
  if (goal === 'extra_income') return 'side_job'
  if (goal === 'work_in_my_education') return 'work_in_education'
  if (goal === 'work_in_my_profession') return 'work_in_profession'
  return goal
}

function providerLabel(status?: PlanPickProviderStatus): string | undefined {
  if (status === 'apply_now') return 'Apply Now'
  if (status === 'check') return 'Check / licence'
  if (status === 'provider_not_listed') return 'Provider not listed yet · Search courses later'
  return undefined
}

function cvHref(role: string): string {
  return `/cv-builder-v2?targetRole=${encodeURIComponent(role || 'UK role')}`
}

function jobsHref(title: string): string {
  return `/job-finder?query=${encodeURIComponent(title || 'jobs UK')}`
}

function coursesHref(q: string): string {
  return `/courses?q=${encodeURIComponent(q || 'courses UK')}`
}

function categoryFor(item: PlanPickItem): JazPlanActionCategory {
  if (item.kind === 'cv') return 'cv'
  if (item.kind === 'role' || item.kind === 'job_search') return 'jobs'
  if (item.kind === 'course' || item.kind === 'licence' || item.kind === 'check') return 'course'
  if (item.kind === 'interview') return 'follow_up'
  return 'research'
}

function priorityFor(item: PlanPickItem): JazPlanActionPriority {
  if (item.kind === 'licence' || item.kind === 'check') return 'required'
  if (item.default_selected || item.kind === 'cv' || item.kind === 'role') return 'recommended'
  return 'optional'
}

/**
 * Build This-week / JAZ actions from the user's Career Assistant selection.
 */
export function selectedToJazActions(
  items: PlanPickItem[],
  catalog?: PlanPickCatalog
): JazPlanAction[] {
  const cat: PlanPickCatalog = catalog || {
    goal_path: 'legacy_career_assistant',
    route_title: 'Career plan',
    roles: [],
    training: [],
    skills: [],
  }
  const identity = resolveSelectedPlanIdentity(cat, items)
  const { training, actions: skillItems, immediate_roles: immediate, future_routes: future } =
    identity
  const goal = cat.goal_path
  const primaryRole = identity.current_focus_role
  const roleList =
    immediate.length > 1
      ? immediate
          .slice(0, 3)
          .map((r) => r.title)
          .join(', ')
      : primaryRole
  const actions: JazPlanAction[] = []
  const canJobSearch = identity.is_career_role_focus
  const jobTarget = primaryRole

  actions.push({
    id: buildCaStepKey(goal, 'cv', `Improve CV for ${jobTarget}`),
    title: `Create / improve CV for ${jobTarget}`,
    description: `Build a UK CV focused on ${roleList}.`,
    category: 'cv',
    priority: 'required',
    status: 'not_started',
    cta_label: 'Open CV Builder',
    cta_target: cvHref(jobTarget),
    why_it_matters: 'A practical CV supports applications once you are ready to apply.',
    estimated_time: '45 min',
  })

  if (canJobSearch) {
    if (immediate.length) {
      actions.push({
        id: buildCaStepKey(goal, 'job_search', `Save roles ${roleList}`),
        title: `Save selected target role(s): ${roleList}`,
        description: 'Keep your Career Assistant start-now role picks on My Plan.',
        category: 'jobs',
        priority: 'recommended',
        status: 'not_started',
        cta_label: 'View jobs',
        cta_target: jobsHref(jobTarget),
        why_it_matters: 'Saved roles keep CV Builder and job search aligned.',
        estimated_time: '10 min',
      })
    }

    actions.push({
      id: buildCaStepKey(goal, 'job_search', `Search jobs ${jobTarget}`),
      title: `Search jobs for ${jobTarget}`,
      description: `Find UK vacancies matching ${roleList}.`,
      category: 'jobs',
      priority: 'required',
      status: 'not_started',
      cta_label: 'View jobs',
      cta_target: jobsHref(jobTarget),
      why_it_matters: 'Applications move you toward interviews.',
      estimated_time: '30 min',
    })

    // Apply step for selected roles OR pathway focus (never for course titles)
    if (immediate.length > 0 || identity.training_only_selection) {
      actions.push({
        id: buildCaStepKey(goal, 'job_search', `Apply first ${jobTarget}`),
        title: `Apply to first ${jobTarget} roles`,
        description: `Submit applications for ${jobTarget} this week.`,
        category: 'jobs',
        priority: 'optional',
        status: 'not_started',
        cta_label: 'View jobs',
        cta_target: jobsHref(jobTarget),
        why_it_matters: 'Early applications create interview momentum.',
        estimated_time: '1 hour',
      })
    }
  }

  for (const t of training.slice(0, 3)) {
    const applyUrl = t.metadata?.referral_url || null
    const canApply = t.provider_status === 'apply_now' && Boolean(applyUrl)
    actions.push({
      id: t.step_key,
      title: `Complete / check selected training: ${t.title}`,
      description:
        t.reason ||
        (canApply
          ? 'Open the listed JobAZ partner course when you are ready.'
          : 'Provider not listed yet — search courses later.'),
      category: 'course',
      priority: t.kind === 'licence' || t.kind === 'check' ? 'required' : 'recommended',
      status: 'not_started',
      cta_label: canApply ? 'Apply Now' : 'Search courses',
      cta_target: canApply && applyUrl ? applyUrl : coursesHref(t.title),
      why_it_matters: t.reason || 'Selected from your Career Assistant result.',
      estimated_time: '2–8 hrs',
    })
  }

  if (future[0]?.title) {
    actions.push({
      id: buildCaStepKey(goal, 'first_step', `Prepare future ${future[0].title}`),
      title: `Optional: prepare for future route ${future[0].title}`,
      description: 'Useful after more experience or training — not your current job target.',
      category: 'research',
      priority: 'optional',
      status: 'not_started',
      cta_label: 'Open My Plan',
      cta_target: '/dashboard?tab=plan',
      why_it_matters: 'Keep the long-term route visible without confusing it with start-now work.',
      estimated_time: '20 min',
    })
  }

  for (const s of skillItems) {
    if (s.kind === 'cv') continue
    if (actions.some((a) => a.id === s.step_key)) continue
    actions.push({
      id: s.step_key,
      title: s.title,
      description: s.reason || s.subtitle || 'Selected from Career Assistant',
      category: categoryFor(s),
      priority: priorityFor(s),
      status: 'not_started',
      cta_label: s.kind === 'interview' ? 'Interview coach' : 'Open My Plan',
      cta_target: s.kind === 'interview' ? '/interview-coach' : '/dashboard?tab=plan',
      why_it_matters: s.reason || 'Selected from your Career Assistant result.',
      estimated_time: '30 min',
    })
  }

  return actions.slice(0, 8)
}

function buildThisWeekLabels(identity: ReturnType<typeof resolveSelectedPlanIdentity>): string[] {
  const primaryRole = identity.current_focus_role
  const labels: string[] = [`Create / improve CV for ${primaryRole}`]
  if (identity.is_career_role_focus) {
    if (identity.immediate_roles.length) {
      labels.push(`Save selected target role(s): ${primaryRole}`)
    }
    labels.push(`Search jobs for ${primaryRole}`)
  }
  for (const t of identity.training.slice(0, 2)) {
    labels.push(`Complete / check selected training: ${t.title}`)
  }
  if (
    identity.is_career_role_focus &&
    (identity.immediate_roles.length > 0 || identity.training_only_selection)
  ) {
    labels.push(`Apply to first ${primaryRole} roles`)
  }
  if (identity.future_route) {
    labels.push(`Optional: prepare for future route ${identity.future_route}`)
  }
  return labels.slice(0, 6)
}

/**
 * Build a replacement JobAZPlan from Career Assistant selections.
 */
export function selectedToJobAZPlan(
  catalog: PlanPickCatalog,
  selected: PlanPickItem[],
  _existing?: JobAZPlan | null
): JobAZPlan {
  void _existing
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  const {
    immediate_roles: immediate,
    future_routes: future,
    training,
    actions: skills,
    current_focus_role: primaryRole,
  } = identity
  const primaryTraining = training[0]
  const goalLabel = goalPathLabel(catalog.goal_path)

  const work_now = immediate
    .filter((r) => !isCourseLikeTitle(r.title))
    .map((r) => ({
      title: r.title,
      href: jobsHref(r.title),
      why_it_matches: r.reason || r.badge || 'Start now — selected from Career Assistant',
      estimated_pay_range: 'Typical UK ranges vary',
      action_label: 'View jobs' as const,
    }))

  // Seed work_now only for concrete roles / practical routes — never courses or bare pathways
  const canSeedWorkNow =
    identity.focus_source === 'selected_immediate_role' ||
    identity.focus_source === 'selected_target_role' ||
    identity.focus_source === 'practical_route' ||
    identity.focus_source === 'catalog_start_now_suggested'

  if (
    !work_now.length &&
    canSeedWorkNow &&
    identity.is_career_role_focus &&
    primaryRole &&
    !isCourseLikeTitle(primaryRole)
  ) {
    work_now.push({
      title: primaryRole,
      href: jobsHref(primaryRole),
      why_it_matches:
        identity.focus_is_suggested
          ? 'Suggested by JobAZ — closest start-now role for this pathway'
          : 'Selected from Career Assistant',
      estimated_pay_range: 'Typical UK ranges vary',
      action_label: 'View jobs' as const,
    })
  }

  const after_training = future
    .filter((r) => !isCourseLikeTitle(r.title))
    .map((r) => ({
      title: r.title,
      href: jobsHref(r.title),
    }))

  const this_week_plan = buildThisWeekLabels(identity)
  const nextUpgrade = identity.next_upgrade || primaryTraining?.title || ''

  const roleRows = immediate
    .filter((r) => !isCourseLikeTitle(r.title))
    .map((r) => ({
      title: r.title,
      reason: r.reason,
      badge: r.badge || 'Start now',
    }))
  if (
    canSeedWorkNow &&
    identity.focus_is_suggested &&
    identity.is_career_role_focus &&
    primaryRole &&
    !isCourseLikeTitle(primaryRole) &&
    !roleRows.some((r) => r.title.toLowerCase() === primaryRole.toLowerCase())
  ) {
    roleRows.unshift({
      title: primaryRole,
      reason: 'Suggested by JobAZ',
      badge: 'Suggested by JobAZ',
    })
  }

  const trainingRows = training.map((t) => ({
    title: t.title,
    reason: t.reason,
    provider_status: t.provider_status,
    provider_label: providerLabel(t.provider_status),
  }))
  const futureRows = future.map((r) => ({
    title: r.title,
    reason: r.reason || 'Useful after more experience / training',
    badge: r.badge || 'Progression route',
  }))
  const boosterRows = skills
    .filter((s) => s.kind !== 'cv')
    .map((s) => ({
      title: s.title,
      kind: s.kind,
      reason: s.reason,
    }))

  return {
    version: 1,
    source_path_id: toSourcePathId(catalog.goal_path),
    route_summary: {
      // Career route title — never a bare course name when a role/route exists
      route_title: identity.plan_title,
      one_sentence_summary: identity.subtitle,
      current_target_role: primaryRole,
      next_upgrade_role: nextUpgrade,
      readiness_score: 55,
    },
    work_now,
    training_next: primaryTraining
      ? {
          title: primaryTraining.title,
          type: primaryTraining.provider_status === 'apply_now' ? 'published_course' : 'course_type',
          why_recommended:
            primaryTraining.reason ||
            providerLabel(primaryTraining.provider_status) ||
            'Selected from Career Assistant',
          action_label:
            primaryTraining.provider_status === 'apply_now' &&
            primaryTraining.metadata?.referral_url
              ? 'Apply Now'
              : 'View recommendation',
          apply_url:
            primaryTraining.provider_status === 'apply_now'
              ? primaryTraining.metadata?.referral_url || undefined
              : undefined,
          id: primaryTraining.id,
        }
      : null,
    optional_training: training.slice(1).map((t) => ({
      title: t.title,
      why_useful:
        t.reason || providerLabel(t.provider_status) || t.badge || 'Selected training',
      type: 'course_type' as const,
      id: t.id,
    })),
    after_training,
    cv_action: `Create / improve CV for ${primaryRole}`,
    cv_target_role: primaryRole,
    this_week_plan,
    dashboard_handoff: {
      save_label: 'Add to My Plan',
      open_dashboard_label: 'Go to My Plan',
      continue_guest_label: 'Continue exploring',
    },
    structured_cards: [],
    ca_selection: {
      source: 'career_assistant',
      goal_path: catalog.goal_path,
      goal_label: goalLabel,
      route_title: catalog.route_title,
      field: catalog.field,
      specialism: catalog.specialism,
      selected_at: new Date().toISOString(),
      source_result_id: catalog.result_token || null,
      immediate_role: identity.is_career_role_focus ? primaryRole : undefined,
      current_focus_role: primaryRole,
      future_route: identity.future_route,
      focus_source: identity.focus_source,
      replaced_previous_plan: true,
      roles: roleRows,
      selected_roles: roleRows,
      selected_courses: trainingRows,
      selected_actions: boosterRows,
      selected_future_routes: futureRows,
      training: trainingRows,
      future_routes: futureRows,
      boosters: boosterRows,
    },
  }
}

/**
 * @deprecated Prefer replace-only selectedToJobAZPlan — kept for rare legacy callers.
 */
export function mergeJobAZPlans(_base: JobAZPlan | null, incoming: JobAZPlan): JobAZPlan {
  return incoming
}
