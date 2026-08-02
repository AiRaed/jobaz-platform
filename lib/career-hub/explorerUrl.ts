import { getCategoryForPathId } from './routeCategories'

export type CareerHubExplorerParams = {
  route?: string | null
  category?: string | null
  from?: string | null
  ca_session?: string | null
  tag?: string | null
}

export function buildCareerHubExplorerUrl(params: CareerHubExplorerParams): string {
  const q = new URLSearchParams()
  if (params.route) q.set('route', params.route)
  if (params.category) q.set('category', params.category)
  if (params.from) q.set('from', params.from)
  if (params.ca_session) q.set('ca_session', params.ca_session)
  if (params.tag) q.set('tag', params.tag)
  const qs = q.toString()
  return `/career-hub${qs ? `?${qs}` : ''}`
}

export function careerHubRouteUrl(
  pathId: string,
  options?: { caSessionId?: string | null; categoryId?: string | null }
): string {
  const q = new URLSearchParams()
  if (options?.caSessionId) {
    q.set('ca_session', options.caSessionId)
    q.set('from', 'career_assistant')
  }
  const qs = q.toString()
  return `/career-path/${encodeURIComponent(pathId)}${qs ? `?${qs}` : ''}`
}

export function careerHubCourseUrl(pathId: string, courseSlug: string, caSessionId?: string | null): string {
  const base = careerHubRouteUrl(pathId, { caSessionId })
  return `${base}#course-${courseSlug}`
}
