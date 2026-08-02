/** Career route tags for JobAZ managed jobs — maps to career path IDs for future AI matching */

export type JobRouteTag = {
  id: string
  label: string
  pathId: string
}

export const JOB_ROUTE_TAGS: JobRouteTag[] = [
  { id: 'care', label: 'Care Route', pathId: 'care-support' },
  { id: 'security', label: 'Security Route', pathId: 'security-facilities' },
  { id: 'warehouse', label: 'Warehouse Route', pathId: 'warehouse-logistics' },
  { id: 'driving', label: 'Driving Route', pathId: 'driving-transport' },
  { id: 'hospitality', label: 'Hospitality Route', pathId: 'hospitality-front' },
  { id: 'office', label: 'Office Route', pathId: 'office-admin' },
  { id: 'construction', label: 'Construction Route', pathId: 'construction-trades' },
  { id: 'it', label: 'IT Route', pathId: 'digital-ai-beginner' },
]

export function routeTagLabel(tagId: string): string {
  return JOB_ROUTE_TAGS.find((t) => t.id === tagId)?.label ?? tagId
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Map a search keyword to career route tag IDs (title, route name, or label match). */
export function resolveRouteTagsFromKeyword(keyword: string): string[] {
  const trimmed = keyword.trim()
  if (!trimmed) return []

  const lower = trimmed.toLowerCase()

  return JOB_ROUTE_TAGS.filter((tag) => {
    const routeName = tag.label.replace(/ route$/i, '').toLowerCase()
    if (lower === tag.id || lower === routeName) return true
    if (tag.label.toLowerCase().includes(lower) && lower.length >= 3) return true
    if (new RegExp(`\\b${escapeRegex(tag.id)}\\b`, 'i').test(trimmed)) return true
    if (new RegExp(`\\b${escapeRegex(routeName)}\\b`, 'i').test(trimmed)) return true
    return false
  }).map((tag) => tag.id)
}
