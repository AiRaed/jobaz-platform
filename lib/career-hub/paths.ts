import { CAREER_PATHS } from '@/lib/career-paths'
import { buildCareerHubExplorerUrl, careerHubRouteUrl } from './explorerUrl'
import { getCategoryForPathId } from './routeCategories'

export const KNOWN_PATH_SLUGS = new Set<string>(CAREER_PATHS.map((p) => p.id))

export function isKnownPathSlug(slug: string | null | undefined): boolean {
  if (!slug) return false
  return KNOWN_PATH_SLUGS.has(slug)
}

export function getCareerHubUrl(
  slug: string | null | undefined,
  tag: string | null | undefined,
  sessionId: string | null | undefined
): string {
  if (slug && isKnownPathSlug(slug)) {
    return careerHubRouteUrl(slug, { caSessionId: sessionId })
  }
  const tagToUse = tag || slug || ''
  const category = tagToUse
    ? getCategoryForPathId(tagToUse)?.id ?? (tagToUse.includes('-') ? undefined : tagToUse)
    : undefined
  return buildCareerHubExplorerUrl({
    category: category ?? undefined,
    route: tagToUse && isKnownPathSlug(tagToUse) ? tagToUse : undefined,
    tag: tagToUse && !isKnownPathSlug(tagToUse) ? tagToUse : undefined,
    from: sessionId ? 'career_assistant' : undefined,
    ca_session: sessionId ?? undefined,
  })
}

export function getBuildPathUrl(
  slug: string | null | undefined,
  tag: string | null | undefined,
  sessionId: string | null | undefined
): string {
  return getCareerHubUrl(slug, tag, sessionId)
}

export const CAREER_HUB_HOME = '/career-hub'
