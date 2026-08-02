import { getCareerHubUrl, isKnownPathSlug, KNOWN_PATH_SLUGS } from '../career-hub/paths'

export { getCareerHubUrl, isKnownPathSlug, KNOWN_PATH_SLUGS, CAREER_HUB_HOME } from '../career-hub/paths'

/**
 * @deprecated Use getCareerHubUrl from @/lib/career-hub
 */
export function getBuildPathUrl(
  slug: string | null | undefined,
  tag: string | null | undefined,
  sessionId: string | null | undefined
): string {
  return getCareerHubUrl(slug, tag, sessionId)
}

