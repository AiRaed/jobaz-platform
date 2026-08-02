/**
 * Route targeting options for admin course "Appears in routes" multi-select.
 * Maps to Career Hub path ids — ready for Supabase `course_routes` join table.
 */

import { CAREER_HUB_CATEGORIES } from '@/lib/career-hub/routeCategories'

export type AdminRouteTarget = {
  categoryId: string
  label: string
  pathIds: string[]
}

/** Labels aligned with Career Hub explorer categories */
export const ADMIN_ROUTE_TARGETS: AdminRouteTarget[] = CAREER_HUB_CATEGORIES.map((cat) => ({
  categoryId: cat.id,
  label: cat.id === 'maintenance' ? 'Maintenance & Facilities' : cat.label,
  pathIds: cat.pathIds,
}))

export function pathIdsForCategory(categoryId: string): string[] {
  return ADMIN_ROUTE_TARGETS.find((t) => t.categoryId === categoryId)?.pathIds ?? []
}

export function categoryIdsForPathIds(pathIds: string[]): string[] {
  const set = new Set<string>()
  for (const pathId of pathIds) {
    const target = ADMIN_ROUTE_TARGETS.find((t) => t.pathIds.includes(pathId))
    if (target) set.add(target.categoryId)
  }
  return [...set]
}

export function toggleRouteCategory(
  routeIds: string[],
  categoryId: string,
  checked: boolean
): string[] {
  const paths = pathIdsForCategory(categoryId)
  if (!paths.length) return routeIds
  const next = new Set(routeIds)
  if (checked) paths.forEach((p) => next.add(p))
  else paths.forEach((p) => next.delete(p))
  return [...next]
}

export function isCategorySelected(routeIds: string[], categoryId: string): boolean {
  const paths = pathIdsForCategory(categoryId)
  if (!paths.length) return false
  return paths.every((p) => routeIds.includes(p))
}

export function routeTargetLabels(routeIds: string[]): string[] {
  return ADMIN_ROUTE_TARGETS.filter((t) => t.pathIds.some((p) => routeIds.includes(p))).map(
    (t) => t.label
  )
}
