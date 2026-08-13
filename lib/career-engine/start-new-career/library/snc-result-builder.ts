/**
 * Build Start New Career public result — training-first, beginner default.
 * Reuses WIP match + course alignment without modifying WIP matching rules.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import {
  getProfessionFieldBySlug,
  getSpecialismBySlug,
  matchProfessionLibrary,
  type PublicWipRoleCard,
} from '@/lib/career-engine/work-in-profession'
import {
  getSncCareerRoute,
  getSncWorkType,
  SNC_NOT_SURE_ROUTE_IDS,
  type SncCareerRoute,
  type SncRouteKind,
  type SncWorkTypeId,
} from './work-type-routes'
import {
  buildSncCourseSections,
  type SncCourseCard,
} from './snc-course-alignment'

export type PublicSncRoleCard = {
  id: string
  role_title: string
  description: string
  licence_or_check: string | null
  uk_role_keywords: string[]
  timing_label: 'after_first_step' | 'future_progression'
}

export type PublicSncResult = {
  pathway: 'start_new_career'
  result_source: 'profession_library_start_new_career'
  headline: string
  result_framing: string
  work_type_id: SncWorkTypeId
  work_type_label: string
  route_id: string
  route_label: string
  route_kind: SncRouteKind
  beginner_label: string
  start_status_note: string | null
  mapped_profession_field: string
  mapped_specialism: string
  mapped_field_slug: string
  mapped_specialism_slug: string
  professional_level: string
  entry_courses: SncCourseCard[]
  upgrade_courses: SncCourseCard[]
  checks: SncCourseCard[]
  first_jobs: PublicSncRoleCard[]
  better_roles_later: PublicSncRoleCard[]
  first_jobs_section_title: string
  first_jobs_section_description: string
  later_jobs_section_title: string
  later_jobs_section_description: string
  entry_courses_section_title: string
  entry_courses_section_description: string
  recommended_entry_course_count: number
  recommended_upgrade_course_count: number
  possible_job_count: number
  missing_provider_count: number
  show_courses_button: boolean
  safety_note: string | null
  aliases: string[]
}

function titleMatchesHints(title: string, hints: string[]): boolean {
  if (!hints.length) return false
  const t = title.toLowerCase()
  return hints.some((h) => t.includes(h.toLowerCase()))
}

function toSncRole(
  role: PublicWipRoleCard,
  timing: PublicSncRoleCard['timing_label']
): PublicSncRoleCard {
  return {
    id: role.id,
    role_title: role.role_title,
    description: role.description,
    licence_or_check: role.licence_or_check || null,
    uk_role_keywords: role.uk_role_keywords || [],
    timing_label: timing,
  }
}

function splitRoles(
  roles: PublicWipRoleCard[],
  route: SncCareerRoute
): { first: PublicSncRoleCard[]; later: PublicSncRoleCard[] } {
  const kind = route.route_kind ?? 'starter'

  // Future routes: never present as immediate easy jobs
  if (kind === 'future_progression') {
    const laterMatched = roles.filter((r) =>
      titleMatchesHints(r.role_title, route.later_job_title_hints)
    )
    const later = (laterMatched.length > 0 ? laterMatched : roles).slice(0, 5)
    return {
      first: [],
      later: later.map((r) => toSncRole(r, 'future_progression')),
    }
  }

  // Progression routes: show supervisor/ops roles as later targets only
  if (kind === 'progression') {
    const laterMatched = roles.filter((r) =>
      titleMatchesHints(r.role_title, route.later_job_title_hints)
    )
    const later = (laterMatched.length > 0 ? laterMatched : roles).slice(0, 5)
    return {
      first: [],
      later: later.map((r) => toSncRole(r, 'future_progression')),
    }
  }

  const firstMatched = roles.filter((r) =>
    titleMatchesHints(r.role_title, route.first_job_title_hints)
  )
  const laterMatched = roles.filter((r) =>
    titleMatchesHints(r.role_title, route.later_job_title_hints)
  )

  let first =
    firstMatched.length > 0
      ? firstMatched
      : roles.filter((r) => r.match_label !== 'Progression route')
  let later =
    laterMatched.length > 0
      ? laterMatched
      : roles.filter((r) => r.match_label === 'Progression route')

  const firstKeys = new Set(first.map((r) => r.role_title.toLowerCase()))
  later = later.filter((r) => !firstKeys.has(r.role_title.toLowerCase()))

  if (first.length === 0 && roles.length > 0) {
    first = roles.slice(0, Math.min(4, roles.length))
    later = roles.slice(4)
  }

  return {
    first: first.slice(0, 5).map((r) => toSncRole(r, 'after_first_step')),
    later: later.slice(0, 4).map((r) => toSncRole(r, 'future_progression')),
  }
}

function safetyNoteFor(route: SncCareerRoute): string | null {
  if (route.id === 'train-driver-route') {
    return 'Train driver roles are competitive and usually require employer recruitment, assessment tests, safety-critical medical checks, and structured training. This is a future / explore-later route — not an easy immediate starter, and not a guaranteed job.'
  }
  if (route.id === 'bus-pcv-route') {
    return 'Beginner-friendly but licence-based. Without a PCV licence, start preparing now. With a valid PCV, you can apply for trainee / bus / PCV roles — this is not a guaranteed job. Medical/eyesight checks apply; DBS may be needed for some school or community passenger routes.'
  }
  if (route.id === 'hgv-lgv-route') {
    return 'Licence-based goods vehicle route. Without an HGV / LGV licence, start preparing now. This is not a guaranteed job.'
  }
  if (route.id === 'transport-supervisor-route') {
    return 'Progression route — typically after driving or logistics experience. Not a first-day starter job.'
  }
  if (route.field_slug === 'security-facilities' && /sia/i.test(route.label)) {
    return 'Licensed security roles need a valid SIA licence. Training comes first — this is not an immediate start without the licence.'
  }
  if (route.field_slug === 'electrical-technical') {
    return 'Short courses do not make you a fully qualified electrician. Treat this as a starter / mate pathway.'
  }
  if (route.field_slug === 'plumbing-heating') {
    return 'Gas Safe and other regulated plumbing work need formal pathways — do not claim full qualification from a short course.'
  }
  if (route.id === 'forklift-driver-route') {
    return 'Most FLT driving roles need valid forklift certification before you start.'
  }
  return null
}

function framingFor(route: SncCareerRoute): {
  result_framing: string
  beginner_label: string
  start_status_note: string | null
  first_jobs_section_title: string
  first_jobs_section_description: string
  later_jobs_section_title: string
  later_jobs_section_description: string
  entry_courses_section_title: string
  entry_courses_section_description: string
} {
  const kind = route.route_kind ?? 'starter'
  if (kind === 'future_progression') {
    return {
      result_framing:
        'Future / advanced transport route — explore later. Employer recruitment and assessment come first; one course will not make you a train driver.',
      beginner_label: 'Future / advanced route',
      start_status_note: 'Explore later — not an immediate easy route',
      first_jobs_section_title: 'Immediate starter roles',
      first_jobs_section_description:
        'This route is not shown as an easy immediate job. Use preparation steps below first.',
      later_jobs_section_title: 'Future / progression roles',
      later_jobs_section_description:
        'Competitive roles that usually need employer recruitment, assessment tests, and structured training.',
      entry_courses_section_title: 'Recommended preparation',
      entry_courses_section_description:
        'Preparation only — not a shortcut or guaranteed job path.',
    }
  }
  if (kind === 'progression') {
    return {
      result_framing:
        'Progression route after driving or logistics experience — not a first-day starter.',
      beginner_label: 'Progression route',
      start_status_note: 'Build driving / logistics experience first',
      first_jobs_section_title: 'Immediate starter roles',
      first_jobs_section_description:
        'Supervisor roles are not immediate starters — see progression targets below.',
      later_jobs_section_title: 'Roles to work toward',
      later_jobs_section_description:
        'Depot and operations roles after relevant transport experience.',
      entry_courses_section_title: 'Useful preparation',
      entry_courses_section_description:
        'Helpful skills while you build experience toward supervision.',
    }
  }
  return {
    result_framing:
      'Beginner / starter route — start with training or licences first, then target realistic UK jobs.',
    beginner_label: 'Beginner / starter route',
    start_status_note: route.start_status_without_licence
      ? `${route.start_status_without_licence} (no licence yet). ${
          route.start_status_with_licence
            ? `If you already hold the key licence: ${route.start_status_with_licence}.`
            : ''
        } Not a guaranteed job.`
      : null,
    first_jobs_section_title: 'First jobs you can target after the first step',
    first_jobs_section_description:
      'Realistic starter UK roles once you complete the entry training or licence step.',
    later_jobs_section_title: 'Better roles later',
    later_jobs_section_description:
      'Future / progression roles — not immediate starter targets.',
    entry_courses_section_title: 'Start with these courses or licences',
    entry_courses_section_description:
      'Most important first step for entering this field as a beginner.',
  }
}

export function buildStartNewCareerLibraryResult(input: {
  work_type_id: string
  route_id: string
  opportunities?: CourseOpportunity[]
  publishedCourses?: AdminCourse[]
}): PublicSncResult | null {
  const workType = getSncWorkType(input.work_type_id)
  const route = getSncCareerRoute(input.route_id)
  if (!workType || !route) return null

  if (workType.id === 'not_sure') {
    if (!SNC_NOT_SURE_ROUTE_IDS.includes(route.id)) return null
  } else if (route.work_type_id !== workType.id) {
    return null
  }

  const field = getProfessionFieldBySlug(route.field_slug)
  const specialism = getSpecialismBySlug(route.field_slug, route.specialism_slug)
  if (!field || !specialism) return null

  const professionalLevel =
    route.route_kind === 'progression' || route.route_kind === 'future_progression'
      ? 'experienced_worker'
      : 'helper_assistant'

  const wipMatch = matchProfessionLibrary({
    field_slug: route.field_slug,
    specialism_slug: route.specialism_slug,
    experience_option_id: route.experience_option_id,
    professional_level: professionalLevel,
  })

  const courses = buildSncCourseSections({
    route,
    fieldName: field.name,
    specialismName: specialism.name,
    roleLicenceHints: wipMatch.roles
      .map((r) => r.licence_or_check)
      .filter((v): v is string => Boolean(v)),
    opportunities: input.opportunities ?? [],
    publishedCourses: input.publishedCourses ?? [],
  })

  const { first, later } = splitRoles(wipMatch.roles, route)
  const framing = framingFor(route)

  const entry_courses = [...courses.entry_courses, ...courses.checks]
  const recommended_entry_course_count = entry_courses.length
  const recommended_upgrade_course_count = courses.upgrade_courses.length
  const route_kind = route.route_kind ?? 'starter'

  return {
    pathway: 'start_new_career',
    result_source: 'profession_library_start_new_career',
    headline:
      route_kind === 'future_progression'
        ? 'Future transport route'
        : route_kind === 'progression'
          ? 'Progression career route'
          : 'Your new career route',
    result_framing: framing.result_framing,
    work_type_id: workType.id,
    work_type_label: workType.label,
    route_id: route.id,
    route_label: route.label,
    route_kind,
    beginner_label: framing.beginner_label,
    start_status_note: framing.start_status_note,
    mapped_profession_field: field.name,
    mapped_specialism: specialism.name,
    mapped_field_slug: field.slug,
    mapped_specialism_slug: specialism.slug,
    professional_level:
      route_kind === 'future_progression'
        ? 'Future / advanced'
        : route_kind === 'progression'
          ? 'Progression'
          : 'Beginner',
    entry_courses,
    upgrade_courses: courses.upgrade_courses,
    checks: courses.checks,
    first_jobs: first,
    better_roles_later: later,
    first_jobs_section_title: framing.first_jobs_section_title,
    first_jobs_section_description: framing.first_jobs_section_description,
    later_jobs_section_title: framing.later_jobs_section_title,
    later_jobs_section_description: framing.later_jobs_section_description,
    entry_courses_section_title: framing.entry_courses_section_title,
    entry_courses_section_description: framing.entry_courses_section_description,
    recommended_entry_course_count,
    recommended_upgrade_course_count,
    possible_job_count: first.length + later.length,
    missing_provider_count: courses.missing_provider_count,
    show_courses_button:
      recommended_entry_course_count + recommended_upgrade_course_count > 0,
    safety_note: safetyNoteFor(route),
    aliases: route.aliases ?? [],
  }
}
