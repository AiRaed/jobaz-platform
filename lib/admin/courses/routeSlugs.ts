/**
 * Canonical Career Hub path slugs for admin save + public matching.
 */

import { ADMIN_ROUTE_TARGETS, pathIdsForCategory } from './routeTargets'

export function normalizeRouteSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const ALL_PATH_SLUGS = new Set(
  ADMIN_ROUTE_TARGETS.flatMap((t) => t.pathIds.map((p) => normalizeRouteSlug(p)))
)

export function expandToPathSlugs(routeIds: string[]): string[] {
  const slugs = new Set<string>()

  for (const raw of routeIds) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    const normalized = normalizeRouteSlug(trimmed)
    if (ALL_PATH_SLUGS.has(normalized)) {
      slugs.add(normalized)
      continue
    }

    const fromCategory = pathIdsForCategory(normalized)
    if (fromCategory.length) {
      fromCategory.forEach((p) => slugs.add(normalizeRouteSlug(p)))
      continue
    }

    const byLabel = ADMIN_ROUTE_TARGETS.find(
      (t) => t.label.toLowerCase() === trimmed.toLowerCase()
    )
    if (byLabel) {
      byLabel.pathIds.forEach((p) => slugs.add(normalizeRouteSlug(p)))
      continue
    }

    if (normalized) slugs.add(normalized)
  }

  return [...slugs]
}

export function normalizeAdminRouteIds(routeIds: string[]): string[] {
  return expandToPathSlugs(routeIds)
}
