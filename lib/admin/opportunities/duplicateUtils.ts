import type { CourseOpportunity } from './types'
import { findExistingOpportunityByTitle } from './titleNormalization'

export { normalizeOpportunityTitleKey, canonicalOpportunityTitleKey, opportunityTitleKeysMatch } from './titleNormalization'

export function normalizeCourseNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export function normalizeProviderNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export function compareOpportunityAge(a: CourseOpportunity, b: CourseOpportunity): number {
  const ta = Date.parse(a.createdAt) || 0
  const tb = Date.parse(b.createdAt) || 0
  if (ta !== tb) return ta - tb
  return a.id.localeCompare(b.id)
}

const PUBLISH_STATUS_RANK: Record<string, number> = {
  Published: 100,
  'Ready to publish': 80,
  Later: 40,
  'Not published': 10,
}

const OPPORTUNITY_STATUS_RANK: Record<string, number> = {
  Published: 100,
  'Ready to add': 80,
  'Need provider': 50,
  Later: 30,
}

export function publishStatusRank(status: string): number {
  return PUBLISH_STATUS_RANK[status] ?? 0
}

export function opportunityStatusRank(status: string): number {
  return OPPORTUNITY_STATUS_RANK[status] ?? 0
}

export function pickBestPublishStatus(group: CourseOpportunity[]): string {
  return group.reduce(
    (best, opp) =>
      publishStatusRank(opp.publishStatus) > publishStatusRank(best) ? opp.publishStatus : best,
    group[0]?.publishStatus ?? 'Not published'
  )
}

export function pickBestOpportunityStatus(group: CourseOpportunity[]): string {
  return group.reduce(
    (best, opp) =>
      opportunityStatusRank(opp.opportunityStatus) > opportunityStatusRank(best)
        ? opp.opportunityStatus
        : best,
    group[0]?.opportunityStatus ?? 'Need provider'
  )
}

function opportunityRichnessScore(opp: CourseOpportunity): number {
  let score = 0
  score += opp.routes.length * 10
  score += (opp.goals?.length ?? 0) * 8
  score += opp.providers.length * 12
  score += opp.priority
  score += Math.min(Math.floor(opp.notes.length / 50), 20)
  score += publishStatusRank(opp.publishStatus)
  score += opportunityStatusRank(opp.opportunityStatus)
  if (opp.publishedCourseId) score += 25
  if (opp.shortLabel.trim()) score += 5
  if (opp.coursePurpose.trim()) score += 5
  if (opp.importance.trim()) score += 3
  if (opp.nextAction.trim()) score += 3
  return score
}

export function opportunityGroupKey(opp: CourseOpportunity): string {
  const route = opp.routes[0]?.routeKey ?? '_none'
  return `${normalizeCourseNameKey(opp.courseName)}::${route}`
}

/** Prefer keeper with richest routes/providers/goals, priority, notes, and published status. */
export function compareOpportunityKeeperScore(a: CourseOpportunity, b: CourseOpportunity): number {
  const scoreDiff = opportunityRichnessScore(b) - opportunityRichnessScore(a)
  if (scoreDiff !== 0) return scoreDiff
  return compareOpportunityAge(a, b)
}

export function pickKeeperOpportunity(group: CourseOpportunity[]): CourseOpportunity {
  return [...group].sort(compareOpportunityKeeperScore)[0]
}

/** Oldest opportunity per normalized course name. */
export function indexOpportunitiesByNameOldest(
  opportunities: CourseOpportunity[]
): Map<string, CourseOpportunity> {
  const groups = groupOpportunitiesByName(opportunities)
  const result = new Map<string, CourseOpportunity>()
  for (const [key, list] of groups) {
    result.set(key, list[0])
  }
  return result
}

export function groupOpportunitiesByPublishedCourseId(
  opportunities: CourseOpportunity[]
): Map<string, CourseOpportunity[]> {
  const groups = new Map<string, CourseOpportunity[]>()

  for (const opp of opportunities) {
    if (!opp.publishedCourseId) continue
    const list = groups.get(opp.publishedCourseId) ?? []
    list.push(opp)
    groups.set(opp.publishedCourseId, list)
  }

  for (const [key, list] of groups) {
    groups.set(key, [...list].sort(compareOpportunityKeeperScore))
  }

  return groups
}

export function groupOpportunitiesByNameAndRoute(
  opportunities: CourseOpportunity[]
): Map<string, CourseOpportunity[]> {
  const groups = new Map<string, CourseOpportunity[]>()

  for (const opp of opportunities) {
    const key = opportunityGroupKey(opp)
    const list = groups.get(key) ?? []
    list.push(opp)
    groups.set(key, list)
  }

  for (const [key, list] of groups) {
    groups.set(key, [...list].sort(compareOpportunityKeeperScore))
  }

  return groups
}

export function groupOpportunitiesByName(
  opportunities: CourseOpportunity[]
): Map<string, CourseOpportunity[]> {
  const groups = new Map<string, CourseOpportunity[]>()

  for (const opp of opportunities) {
    const key = normalizeCourseNameKey(opp.courseName)
    const list = groups.get(key) ?? []
    list.push(opp)
    groups.set(key, list)
  }

  for (const [key, list] of groups) {
    groups.set(key, [...list].sort(compareOpportunityAge))
  }

  return groups
}

export function findExistingByName(
  opportunities: CourseOpportunity[],
  courseName: string
): CourseOpportunity | null {
  const byCanonical = findExistingOpportunityByTitle(opportunities, courseName)
  if (byCanonical) return byCanonical

  const key = normalizeCourseNameKey(courseName)
  const matches = opportunities.filter((o) => normalizeCourseNameKey(o.courseName) === key)
  if (!matches.length) return null
  return [...matches].sort(compareOpportunityAge)[0]
}

export function hasDuplicateCourseName(
  opportunities: CourseOpportunity[],
  courseName: string,
  excludeId?: string
): boolean {
  const key = normalizeCourseNameKey(courseName)
  return opportunities.some(
    (o) => o.id !== excludeId && normalizeCourseNameKey(o.courseName) === key
  )
}
