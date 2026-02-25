/**
 * Build Your Path route mapping and utilities.
 * 
 * This file maintains a list of all existing Build Your Path detail pages (slug routes).
 * It's used to determine whether to navigate to a dedicated path page or the filtered list.
 */

import { CAREER_PATHS } from '@/lib/career-paths'

/**
 * Set of all known Build Your Path detail page slugs.
 * These correspond to actual folders under app/build-your-path/[pathId]/
 * and match the id field in CAREER_PATHS.
 */
export const KNOWN_PATH_SLUGS = new Set<string>(
  CAREER_PATHS.map(path => path.id)
)

/**
 * Check if a slug exists as a dedicated Build Your Path detail page.
 * 
 * @param slug - The slug to check (e.g., "warehouse-logistics", "cleaner")
 * @returns true if the slug exists as a detail page, false otherwise
 */
export function isKnownPathSlug(slug: string | null | undefined): boolean {
  if (!slug) return false
  return KNOWN_PATH_SLUGS.has(slug)
}

/**
 * Get the target URL for a Build Your Path recommendation.
 * 
 * - If slug exists as a detail page -> /build-your-path/${slug}?from=career_assistant&ca_session=${sessionId}
 * - Otherwise -> /build-your-path?tag=${tag}&from=career_assistant&ca_session=${sessionId}
 * 
 * @param slug - The path slug (e.g., "warehouse-logistics")
 * @param tag - The tag for filtering (e.g., "warehouse", "cleaner")
 * @param sessionId - Career Assistant session ID
 * @returns The target URL string
 */
export function getBuildPathUrl(
  slug: string | null | undefined,
  tag: string | null | undefined,
  sessionId: string | null | undefined
): string {
  const baseParams = new URLSearchParams()
  if (sessionId) {
    baseParams.set('from', 'career_assistant')
    baseParams.set('ca_session', sessionId)
  }

  // If slug exists as a detail page, use it
  if (slug && isKnownPathSlug(slug)) {
    return `/build-your-path/${slug}?${baseParams.toString()}`
  }

  // Otherwise, use tag filter on list page
  const tagToUse = tag || slug || ''
  if (tagToUse) {
    baseParams.set('tag', tagToUse)
  }
  
  return `/build-your-path?${baseParams.toString()}`
}

