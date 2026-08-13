/**
 * General Career Assistant → My Plan identity builder.
 * A JobAZ career plan is always a career route / pathway plan — never a course plan.
 * Shared across WIE / WIP / SNC / Extra Income (and future Grow / Business paths).
 */

import type { PlanPickCatalog, PlanPickItem } from './types'
import {
  classifyRoleRouteTiming,
  isProgressionRoleTitle,
  splitRolesByTiming,
} from './rolePriority'

function pathwayGoalLabel(goal: string): string {
  switch (goal) {
    case 'work_in_my_education':
      return 'Work in My Education'
    case 'work_in_my_profession':
      return 'Work in My Profession'
    case 'start_new_career':
      return 'Start a New Career'
    case 'extra_income':
      return 'Looking for Extra Income'
    case 'grow_career':
      return 'Grow in my Current Career'
    case 'start_business':
      return 'Start My Own Business'
    default:
      return 'Career Assistant'
  }
}

export type PlanFocusSource =
  | 'selected_immediate_role'
  | 'selected_target_role'
  | 'practical_route'
  | 'selected_future_route'
  | 'catalog_start_now_suggested'
  | 'specialism_pathway'
  | 'route_title_pathway'
  | 'field_specialism_fallback'

export type ResolvedPlanIdentity = {
  current_focus_role: string
  focus_source: PlanFocusSource
  plan_title: string
  subtitle: string
  next_upgrade: string
  future_route: string | null
  pathway_label: string
  field?: string
  specialism?: string
  immediate_roles: PlanPickItem[]
  selected_target_roles: PlanPickItem[]
  future_routes: PlanPickItem[]
  training: PlanPickItem[]
  actions: PlanPickItem[]
  focus_is_suggested: boolean
  /** True when focus is a career role/route/pathway — never a course */
  is_career_role_focus: boolean
  /** User selected training only (no roles) — focus still comes from pathway context */
  training_only_selection: boolean
  /** @deprecated Always false — courses never become plan identity */
  is_course_only_plan: boolean
}

function norm(s: string | undefined | null): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Course / licence / certificate / software-training titles — never career identity. */
export function isCourseLikeTitle(title: string): boolean {
  const t = title.trim()
  if (!t) return false
  return (
    /\b(diploma|certificate|certification|course|level\s*[1-7]|nvq|btec|gcse|a[- ]?level|degree|qualifi|cscs|cpc|dbs|sia|tefl|aws|azure|comptia|coshh|manual\s*handling|food\s*hygiene|first\s*aid|safeguarding|care\s*certificate|nhs\s+job\s+application|training|licence|license|qualification|phv\s*licence|taxi\s*licence)\b/i.test(
      t
    ) ||
    /\b(autocad|auto\s*cad|revit|solidworks|photoshop|illustrator|excel|python|javascript|java\b|comp\s*tia)\b/i.test(
      t
    ) ||
    /\b(apply\s+now|provider\s+not\s+listed)\b/i.test(t)
  )
}

function isFieldOrSpecialismLabel(
  title: string,
  catalog?: PlanPickCatalog | null
): boolean {
  const t = norm(title)
  if (!t || !catalog) return false
  if (t === norm(catalog.specialism) || t === norm(catalog.field)) return true
  if (
    t === norm(catalog.route_title) &&
    !/\b(assistant|trainee|worker|driver|cleaner|operative|steward)\b/i.test(title)
  ) {
    if (t.split(' ').length <= 4 && !isProgressionRoleTitle(title)) {
      return !/\b(assistant|support\s*worker|trainee|driver|cleaner|officer|operative|apprentice|steward|helper)\b/i.test(
        title
      )
    }
  }
  return false
}

export function rejectPathwayLabelAsFocus(
  title: string,
  catalog?: PlanPickCatalog | null,
  opts?: { allowIfStartNowSelected?: boolean }
): boolean {
  if (!isFieldOrSpecialismLabel(title, catalog)) return false
  if (opts?.allowIfStartNowSelected) return false
  return true
}

function isUsableCareerRole(
  title: string,
  catalog: PlanPickCatalog,
  opts?: { allowPathwayLabel?: boolean }
): boolean {
  if (!title?.trim()) return false
  if (isCourseLikeTitle(title)) return false
  if (!opts?.allowPathwayLabel && isFieldOrSpecialismLabel(title, catalog)) return false
  return true
}

function pickCatalogStartNow(catalog: PlanPickCatalog): PlanPickItem | null {
  return (
    splitRolesByTiming(catalog.roles).startNow.find((r) =>
      isUsableCareerRole(r.title, catalog)
    ) || null
  )
}

function pickPracticalRoute(catalog: PlanPickCatalog): string | null {
  const candidates = [catalog.route_title, catalog.specialism].filter(Boolean) as string[]
  for (const c of candidates) {
    if (isCourseLikeTitle(c)) continue
    const looksLikeJobRole =
      /\b(cleaner|driver|steward|assistant|worker|shifts?|kitchen|warehouse|tutor|operative|officer|labourer|support\s*worker|trainee|hire)\b/i.test(
        c
      )
    if (isFieldOrSpecialismLabel(c, catalog) && !looksLikeJobRole) continue
    if (
      catalog.goal_path === 'extra_income' ||
      catalog.goal_path === 'start_new_career' ||
      looksLikeJobRole
    ) {
      return c
    }
  }
  return null
}

/**
 * When the user picked training only (or no usable role), resolve career identity
 * from Career Assistant result context — never from the course title.
 */
function pickPathwayContextFocus(catalog: PlanPickCatalog): {
  title: string
  source: PlanFocusSource
} {
  const specialism = catalog.specialism?.trim()
  const routeTitle = catalog.route_title?.trim()
  const field = catalog.field?.trim()

  if (specialism && !isCourseLikeTitle(specialism)) {
    return { title: specialism, source: 'specialism_pathway' }
  }
  if (routeTitle && !isCourseLikeTitle(routeTitle) && routeTitle !== specialism) {
    return { title: routeTitle, source: 'route_title_pathway' }
  }
  if (field && !isCourseLikeTitle(field)) {
    return {
      title: specialism ? `${specialism} pathway` : `${field} pathway`,
      source: 'field_specialism_fallback',
    }
  }
  if (specialism) {
    return { title: `${specialism} pathway`, source: 'specialism_pathway' }
  }
  return {
    title: `${pathwayGoalLabel(catalog.goal_path)} pathway`,
    source: 'field_specialism_fallback',
  }
}

function pickNextUpgrade(training: PlanPickItem[]): string {
  const required = training.find((t) => t.kind === 'licence' || t.kind === 'check')
  if (required?.title) return required.title
  const recommended = training.find((t) => t.default_selected || t.provider_status === 'apply_now')
  if (recommended?.title) return recommended.title
  return training[0]?.title || ''
}

/**
 * Build normalized plan identity from selected Career Assistant items.
 * Priority: immediateRole > targetRole > practicalRoute > catalogStartNow >
 *           pathway context (specialism / route / field) > futureRoute.
 * Courses never become plan title or current_focus.
 */
export function resolveSelectedPlanIdentity(
  catalog: PlanPickCatalog,
  selected: PlanPickItem[]
): ResolvedPlanIdentity {
  const actions = selected.filter((i) => i.group === 'skills')
  const misgroupedCourses = selected.filter(
    (i) => i.group === 'roles' && isCourseLikeTitle(i.title)
  )
  const training = [
    ...selected.filter((i) => i.group === 'training'),
    ...misgroupedCourses.map((i) => ({
      ...i,
      group: 'training' as const,
      kind: (i.kind === 'licence' || i.kind === 'check' ? i.kind : 'course') as PlanPickItem['kind'],
    })),
  ]
  const selectedRoles = selected.filter(
    (i) => i.group === 'roles' && !isCourseLikeTitle(i.title)
  )
  const training_only_selection = selectedRoles.length === 0 && training.length > 0

  const retimed = selectedRoles.map((r) => {
    const timing =
      r.route_timing ||
      classifyRoleRouteTiming({
        title: r.title,
        badge: r.badge,
        match_type: r.metadata?.match_type,
        start_now: r.metadata?.start_now,
        level: r.metadata?.level,
        stage_label: r.metadata?.stage_label,
        timing_label: r.metadata?.timing_label,
        reason: r.reason,
        bucket: r.metadata?.bucket as never,
        field: catalog.field,
        specialism: catalog.specialism,
        route_title: catalog.route_title,
      })
    const pathwayBlocked =
      isFieldOrSpecialismLabel(r.title, catalog) &&
      timing !== 'start_now' &&
      r.metadata?.match_type !== 'best_immediate_route' &&
      r.metadata?.start_now !== true
    return {
      ...r,
      route_timing: pathwayBlocked ? ('future_progression' as const) : timing,
    }
  })

  const roleCandidates = retimed.filter((r) => isUsableCareerRole(r.title, catalog))
  const { startNow: immediate, future: futureFromSplit } = splitRolesByTiming(roleCandidates)
  const selectedTargetRoles = roleCandidates.filter((r) => r.route_timing !== 'future_progression')
  const futureRoutes = [
    ...futureFromSplit,
    ...retimed.filter(
      (r) =>
        r.route_timing === 'future_progression' &&
        !isCourseLikeTitle(r.title) &&
        !futureFromSplit.some((f) => norm(f.title) === norm(r.title))
    ),
  ]

  // Training-only: still surface catalog progression roles as future routes
  if (selectedRoles.length === 0) {
    for (const r of catalog.roles || []) {
      if (isCourseLikeTitle(r.title)) continue
      const timing =
        r.route_timing ||
        classifyRoleRouteTiming({
          title: r.title,
          badge: r.badge,
          match_type: r.metadata?.match_type,
          start_now: r.metadata?.start_now,
          bucket: r.metadata?.bucket as never,
          field: catalog.field,
          specialism: catalog.specialism,
          route_title: catalog.route_title,
        })
      if (timing !== 'future_progression') continue
      if (futureRoutes.some((f) => norm(f.title) === norm(r.title))) continue
      futureRoutes.push({ ...r, route_timing: 'future_progression' })
    }
  }

  const pathwayLabel = pathwayGoalLabel(catalog.goal_path)
  const field = catalog.field
  const specialism = catalog.specialism
  const practicalRoute = pickPracticalRoute(catalog)
  const catalogStart = pickCatalogStartNow(catalog)
  const pathwayContext = pickPathwayContextFocus(catalog)

  let current_focus_role = ''
  let focus_source: PlanFocusSource = 'field_specialism_fallback'
  let focus_is_suggested = false

  const firstImmediate =
    immediate.find((r) =>
      isUsableCareerRole(r.title, catalog, { allowPathwayLabel: false })
    ) || immediate[0]

  if (firstImmediate?.title && isUsableCareerRole(firstImmediate.title, catalog)) {
    current_focus_role = firstImmediate.title
    focus_source = 'selected_immediate_role'
  } else {
    const anyTarget = selectedTargetRoles.find((r) => isUsableCareerRole(r.title, catalog))
    if (anyTarget?.title) {
      current_focus_role = anyTarget.title
      focus_source = 'selected_target_role'
    } else if (practicalRoute && !isCourseLikeTitle(practicalRoute)) {
      current_focus_role = practicalRoute
      focus_source = 'practical_route'
      focus_is_suggested = !selectedRoles.some((r) => norm(r.title) === norm(practicalRoute))
    } else if (catalogStart?.title) {
      // Prefer catalog start-now when user picked training only
      current_focus_role = catalogStart.title
      focus_source = 'catalog_start_now_suggested'
      focus_is_suggested = true
    } else if (pathwayContext.title && !isCourseLikeTitle(pathwayContext.title)) {
      // Specialism / route / pathway — never the course
      current_focus_role = pathwayContext.title
      focus_source = pathwayContext.source
      focus_is_suggested = training_only_selection
    } else if (
      futureRoutes[0]?.title &&
      !isCourseLikeTitle(futureRoutes[0].title)
    ) {
      current_focus_role = futureRoutes[0].title
      focus_source = 'selected_future_route'
    } else {
      current_focus_role = pathwayContext.title || 'Your career plan'
      focus_source = 'field_specialism_fallback'
      focus_is_suggested = true
    }
  }

  // Hard guard: courses must never remain as focus / title
  if (isCourseLikeTitle(current_focus_role)) {
    const rescue =
      (firstImmediate?.title && !isCourseLikeTitle(firstImmediate.title)
        ? firstImmediate.title
        : null) ||
      selectedTargetRoles.find((r) => !isCourseLikeTitle(r.title))?.title ||
      (practicalRoute && !isCourseLikeTitle(practicalRoute) ? practicalRoute : null) ||
      catalogStart?.title ||
      (pathwayContext.title && !isCourseLikeTitle(pathwayContext.title)
        ? pathwayContext.title
        : null) ||
      futureRoutes.find((r) => !isCourseLikeTitle(r.title))?.title ||
      (specialism && !isCourseLikeTitle(specialism) ? specialism : null) ||
      (specialism ? `${specialism} pathway` : null) ||
      'Your career plan'
    current_focus_role = rescue
    focus_source =
      catalogStart?.title === rescue
        ? 'catalog_start_now_suggested'
        : specialism === rescue || rescue.endsWith(' pathway')
          ? 'specialism_pathway'
          : 'field_specialism_fallback'
    focus_is_suggested = true
  }

  // Prefer catalog future route for progression when focus is pathway / specialism
  const future_route =
    futureRoutes[0]?.title ||
    (catalog.roles || []).find((r) => r.route_timing === 'future_progression')?.title ||
    null
  const next_upgrade = pickNextUpgrade(training)

  const plan_title = current_focus_role

  const pathwayBit = [specialism, field].filter(Boolean).join(' / ')
  let subtitle = ''
  if (
    focus_source === 'selected_immediate_role' ||
    focus_source === 'selected_target_role' ||
    focus_source === 'practical_route' ||
    focus_source === 'catalog_start_now_suggested'
  ) {
    subtitle = `Work now as ${current_focus_role}.`
    if (pathwayBit || future_route) {
      subtitle += ` Future route: ${[pathwayBit, future_route].filter(Boolean).join(' / ')}.`
    }
  } else if (
    focus_source === 'specialism_pathway' ||
    focus_source === 'route_title_pathway' ||
    focus_source === 'field_specialism_fallback'
  ) {
    subtitle = `Career pathway: ${current_focus_role}.`
    if (next_upgrade) subtitle += ` Next training: ${next_upgrade}.`
    if (future_route) subtitle += ` Future route: ${future_route}.`
  } else if (focus_source === 'selected_future_route') {
    subtitle = `Target route: ${current_focus_role}. Complete required training before starting.`
  } else {
    subtitle = `${pathwayLabel}${pathwayBit ? ` · ${pathwayBit}` : ''}.`
  }

  const is_career_role_focus = !isCourseLikeTitle(current_focus_role)

  return {
    current_focus_role,
    focus_source,
    plan_title,
    subtitle,
    next_upgrade,
    future_route: future_route && !isCourseLikeTitle(future_route) ? future_route : null,
    pathway_label: pathwayLabel,
    field,
    specialism,
    immediate_roles: immediate.filter((r) => isUsableCareerRole(r.title, catalog)),
    selected_target_roles: selectedTargetRoles,
    future_routes: futureRoutes,
    training,
    actions,
    focus_is_suggested,
    is_career_role_focus,
    training_only_selection,
    is_course_only_plan: false,
  }
}
