import type { UkTransitionGrowthOutput } from '@/lib/career-brain/ukTransition/ukTransitionTypes'
import { UK_ROUTE_TO_PATH, iconForCourse } from './routeCategories'
import { slugifyCourseName } from './slug'

export type RecommendedCourseStep = {
  courseName: string
  courseSlug: string
  pathId: string
  routeLabel?: string
  icon: string
  priority: number
}

const MEDALS = ['🥇', '🥈', '🥉']

export function medalForPriority(priority: number): string {
  return MEDALS[priority - 1] ?? '⭐'
}

function inferRouteFromLabel(label: string): string {
  const l = label.toLowerCase()
  if (/security|sia/.test(l)) return 'entry_security'
  if (/warehouse|logistics|forklift/.test(l)) return 'entry_warehouse'
  if (/construction|cscs/.test(l)) return 'entry_construction'
  if (/care|healthcare/.test(l)) return 'entry_care'
  if (/hospitality|chef|food/.test(l)) return 'entry_hospitality'
  if (/electrician|ecs/.test(l)) return 'exp_electrician'
  if (/plumb/.test(l)) return 'exp_plumber'
  if (/driver|hgv|taxi/.test(l)) return 'exp_driver'
  if (/teaching|education/.test(l)) return 'degree_education'
  if (/engineering/.test(l)) return 'degree_engineering'
  if (/account|finance/.test(l)) return 'degree_accounting'
  if (/it|technology|digital/.test(l)) return 'degree_it'
  if (/business|self/.test(l)) return 'biz_background'
  return 'entry_warehouse'
}

export function extractUkTransitionRecommendations(
  growth: UkTransitionGrowthOutput | null | undefined
): RecommendedCourseStep[] {
  if (!growth?.finalReport) return []
  const report = growth.finalReport
  const pathId = UK_ROUTE_TO_PATH[inferRouteFromLabel(report.recommendedRouteLabel)] ?? 'warehouse-logistics'
  const names = [...new Set([...report.recommendedCertifications, ...report.recommendedCourses])].slice(0, 3)

  return names.map((courseName, i) => ({
    courseName,
    courseSlug: slugifyCourseName(courseName),
    pathId,
    routeLabel: report.recommendedRouteLabel,
    icon: iconForCourse(courseName),
    priority: i + 1,
  }))
}

export function extractGenericCourseRecommendations(
  courses: string[] | undefined,
  defaultPathId = 'warehouse-logistics'
): RecommendedCourseStep[] {
  if (!courses?.length) return []
  return courses.slice(0, 3).map((courseName, i) => ({
    courseName,
    courseSlug: slugifyCourseName(courseName),
    pathId: defaultPathId,
    icon: iconForCourse(courseName),
    priority: i + 1,
  }))
}
