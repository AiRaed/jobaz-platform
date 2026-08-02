import { findDuplicatePublishedLinks } from './query'
import {
  groupOpportunitiesByNameAndRoute,
  groupOpportunitiesByPublishedCourseId,
  normalizeProviderNameKey,
  pickKeeperOpportunity,
  pickBestOpportunityStatus,
  pickBestPublishStatus,
} from './duplicateUtils'
import { normalizePreferredProviders } from './mappers'
import type {
  CourseOpportunity,
  CourseOpportunityInput,
  OpportunityGoalInput,
  OpportunityProviderInput,
} from './types'

export type CleanupDuplicatesResult = {
  linkedPublishedGroupsMerged: number
  nameRouteGroupsMerged: number
  mergedGroups: number
  removedDuplicates: number
  routesMerged: number
  goalsMerged: number
  providersMerged: number
}

export type CleanupMergeOperation = {
  kind: 'linked-published' | 'name-route'
  keeperId: string
  deleteIds: string[]
  input: CourseOpportunityInput
  routesMerged: number
  goalsMerged: number
  providersMerged: number
}

export type CleanupDuplicateRowPreview = {
  id: string
  courseName: string
}

export type CleanupGroupPreview = {
  kind: 'linked-published' | 'name-route'
  publishedCourseId?: string
  publishedCourseTitle?: string
  duplicateRows: CleanupDuplicateRowPreview[]
  keeper: CleanupDuplicateRowPreview
  rowsToDelete: CleanupDuplicateRowPreview[]
}

export type CleanupDuplicatesPlan = {
  groups: CleanupGroupPreview[]
  operations: CleanupMergeOperation[]
  result: CleanupDuplicatesResult
  remainingDuplicatePublishedLinksAfterCleanup: number
}

function emptyResult(): CleanupDuplicatesResult {
  return {
    linkedPublishedGroupsMerged: 0,
    nameRouteGroupsMerged: 0,
    mergedGroups: 0,
    removedDuplicates: 0,
    routesMerged: 0,
    goalsMerged: 0,
    providersMerged: 0,
  }
}

function rowPreview(opp: CourseOpportunity): CleanupDuplicateRowPreview {
  return { id: opp.id, courseName: opp.courseName }
}

function isBlank(value: string | null | undefined): boolean {
  return !(value ?? '').trim()
}

function providerToInput(p: CourseOpportunity['providers'][number]): OpportunityProviderInput {
  return {
    id: p.id,
    providerName: p.providerName,
    providerStatus: p.providerStatus,
    affiliateStatus: p.affiliateStatus,
    officialUrl: p.officialUrl,
    referralUrl: p.referralUrl,
    dashboardUrl: p.dashboardUrl,
    commissionType: p.commissionType,
    commissionValue: p.commissionValue,
    publicOfferLabel: p.publicOfferLabel,
    trackingMethod: p.trackingMethod,
    notes: p.notes,
    isPreferred: p.isPreferred,
  }
}

function mergeNotes(...notes: string[]): string {
  const seen = new Set<string>()
  const parts: string[] = []

  for (const raw of notes) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    parts.push(trimmed)
  }

  return parts.join('\n\n')
}

function goalToInput(g: CourseOpportunity['goals'][number]): OpportunityGoalInput {
  return {
    goalKey: g.goalKey,
    goalLabel: g.goalLabel,
  }
}

export function mergeOpportunityGroup(group: CourseOpportunity[]): {
  input: CourseOpportunityInput
  routesMerged: number
  goalsMerged: number
  providersMerged: number
} {
  const keeper = pickKeeperOpportunity(group)
  const duplicates = group.filter((o) => o.id !== keeper.id)

  const routeMap = new Map<string, { routeKey: string; routeLabel: string }>()
  for (const opp of group) {
    for (const route of opp.routes) {
      if (!routeMap.has(route.routeKey)) {
        routeMap.set(route.routeKey, { routeKey: route.routeKey, routeLabel: route.routeLabel })
      }
    }
  }

  const goalMap = new Map<string, OpportunityGoalInput>()
  for (const opp of group) {
    for (const goal of opp.goals ?? []) {
      if (!goalMap.has(goal.goalKey)) {
        goalMap.set(goal.goalKey, goalToInput(goal))
      }
    }
  }

  const providerMap = new Map<string, OpportunityProviderInput>()
  for (const opp of group) {
    for (const provider of opp.providers) {
      const key = normalizeProviderNameKey(provider.providerName)
      if (!providerMap.has(key)) {
        providerMap.set(key, providerToInput(provider))
      }
    }
  }

  let providers = normalizePreferredProviders([...providerMap.values()])
  if (!providers.some((p) => p.isPreferred) && providers.length) {
    providers = providers.map((p, i) => ({ ...p, isPreferred: i === 0 }))
  }

  const routes = [...routeMap.values()]
  const goals = [...goalMap.values()]
  const routesMerged = Math.max(0, routes.length - keeper.routes.length)
  const goalsMerged = Math.max(0, goals.length - (keeper.goals?.length ?? 0))
  const providersMerged = Math.max(0, providers.length - keeper.providers.length)

  let shortLabel = keeper.shortLabel
  let coursePurpose = keeper.coursePurpose
  let importance = keeper.importance
  let nextAction = keeper.nextAction

  for (const dup of duplicates) {
    if (isBlank(shortLabel) && dup.shortLabel.trim()) shortLabel = dup.shortLabel
    if (isBlank(coursePurpose) && dup.coursePurpose.trim()) coursePurpose = dup.coursePurpose
    if (isBlank(importance) && dup.importance.trim()) importance = dup.importance
    if (isBlank(nextAction) && dup.nextAction.trim()) nextAction = dup.nextAction
  }

  const publishedCourseId =
    keeper.publishedCourseId ?? duplicates.find((d) => d.publishedCourseId)?.publishedCourseId ?? null

  return {
    routesMerged,
    goalsMerged,
    providersMerged,
    input: {
      courseName: keeper.courseName,
      shortLabel,
      coursePurpose,
      priority: Math.max(...group.map((o) => o.priority)),
      opportunityStatus: pickBestOpportunityStatus(group),
      publishStatus: pickBestPublishStatus(group),
      importance,
      notes: mergeNotes(keeper.notes, ...duplicates.map((d) => d.notes)),
      nextAction,
      publishedCourseId,
      routes,
      goals,
      providers,
    },
  }
}

function applyCleanupOperationsInMemory(
  opportunities: CourseOpportunity[],
  operations: CleanupMergeOperation[]
): CourseOpportunity[] {
  if (!operations.length) return opportunities

  const byId = new Map(opportunities.map((o) => [o.id, o]))
  const deleteIds = new Set<string>()

  for (const op of operations) {
    const keeper = byId.get(op.keeperId)
    if (!keeper) continue

    byId.set(op.keeperId, {
      ...keeper,
      courseName: op.input.courseName,
      shortLabel: op.input.shortLabel,
      coursePurpose: op.input.coursePurpose,
      priority: op.input.priority,
      opportunityStatus: op.input.opportunityStatus,
      publishStatus: op.input.publishStatus,
      importance: op.input.importance,
      notes: op.input.notes,
      nextAction: op.input.nextAction,
      publishedCourseId: op.input.publishedCourseId ?? null,
      routes: op.input.routes.map((route, index) => ({
        id: keeper.routes[index]?.id ?? `sim-route-${op.keeperId}-${index}`,
        opportunityId: op.keeperId,
        routeKey: route.routeKey,
        routeLabel: route.routeLabel,
      })),
      goals: (op.input.goals ?? []).map((goal, index) => ({
        id: keeper.goals[index]?.id ?? `sim-goal-${op.keeperId}-${index}`,
        opportunityId: op.keeperId,
        goalKey: goal.goalKey,
        goalLabel: goal.goalLabel,
      })),
      providers: op.input.providers.map((provider, index) => ({
        id: provider.id ?? keeper.providers[index]?.id ?? `sim-provider-${op.keeperId}-${index}`,
        opportunityId: op.keeperId,
        providerName: provider.providerName,
        providerStatus: provider.providerStatus,
        affiliateStatus: provider.affiliateStatus,
        officialUrl: provider.officialUrl,
        referralUrl: provider.referralUrl,
        dashboardUrl: provider.dashboardUrl,
        commissionType: provider.commissionType,
        commissionValue: provider.commissionValue,
        publicOfferLabel: provider.publicOfferLabel,
        trackingMethod: provider.trackingMethod,
        notes: provider.notes,
        isPreferred: provider.isPreferred,
        createdAt: keeper.providers[index]?.createdAt ?? keeper.createdAt,
        updatedAt: keeper.updatedAt,
      })),
    })

    for (const id of op.deleteIds) deleteIds.add(id)
  }

  return [...byId.values()].filter((o) => !deleteIds.has(o.id))
}

function resolvePublishedCourseTitle(
  publishedCourseId: string,
  group: CourseOpportunity[],
  publishedCourseTitles: Map<string, string>
): string {
  return (
    publishedCourseTitles.get(publishedCourseId) ??
    group.find((o) => o.linkedPublishedCourseTitle)?.linkedPublishedCourseTitle ??
    group[0]?.courseName ??
    publishedCourseId
  )
}

function planLinkedPublishedDuplicateCleanup(
  opportunities: CourseOpportunity[],
  publishedCourseTitles: Map<string, string>
): { operations: CleanupMergeOperation[]; groups: CleanupGroupPreview[]; result: CleanupDuplicatesResult } {
  const groups = groupOpportunitiesByPublishedCourseId(opportunities)
  const operations: CleanupMergeOperation[] = []
  const previews: CleanupGroupPreview[] = []
  const result = emptyResult()

  for (const [publishedCourseId, group] of groups) {
    if (group.length <= 1) continue

    const keeper = pickKeeperOpportunity(group)
    const duplicates = group.filter((o) => o.id !== keeper.id)
    const merged = mergeOpportunityGroup(group)

    merged.input.publishedCourseId = publishedCourseId
    merged.input.publishStatus = pickBestPublishStatus(group)

    operations.push({
      kind: 'linked-published',
      keeperId: keeper.id,
      deleteIds: duplicates.map((d) => d.id),
      input: merged.input,
      routesMerged: merged.routesMerged,
      goalsMerged: merged.goalsMerged,
      providersMerged: merged.providersMerged,
    })

    previews.push({
      kind: 'linked-published',
      publishedCourseId,
      publishedCourseTitle: resolvePublishedCourseTitle(publishedCourseId, group, publishedCourseTitles),
      duplicateRows: group.map(rowPreview),
      keeper: rowPreview(keeper),
      rowsToDelete: duplicates.map(rowPreview),
    })

    result.linkedPublishedGroupsMerged += 1
    result.removedDuplicates += duplicates.length
    result.routesMerged += merged.routesMerged
    result.goalsMerged += merged.goalsMerged
    result.providersMerged += merged.providersMerged
  }

  result.mergedGroups = result.linkedPublishedGroupsMerged + result.nameRouteGroupsMerged
  return { operations, groups: previews, result }
}

function planNameRouteDuplicateCleanup(
  opportunities: CourseOpportunity[],
  publishedCourseTitles: Map<string, string>
): { operations: CleanupMergeOperation[]; groups: CleanupGroupPreview[]; result: CleanupDuplicatesResult } {
  const groups = groupOpportunitiesByNameAndRoute(opportunities)
  const operations: CleanupMergeOperation[] = []
  const previews: CleanupGroupPreview[] = []
  const result = emptyResult()

  for (const group of groups.values()) {
    if (group.length <= 1) continue

    const keeper = pickKeeperOpportunity(group)
    const duplicates = group.filter((o) => o.id !== keeper.id)
    const merged = mergeOpportunityGroup(group)

    operations.push({
      kind: 'name-route',
      keeperId: keeper.id,
      deleteIds: duplicates.map((d) => d.id),
      input: merged.input,
      routesMerged: merged.routesMerged,
      goalsMerged: merged.goalsMerged,
      providersMerged: merged.providersMerged,
    })

    const publishedCourseId = keeper.publishedCourseId ?? merged.input.publishedCourseId ?? undefined

    previews.push({
      kind: 'name-route',
      publishedCourseId,
      publishedCourseTitle: publishedCourseId
        ? resolvePublishedCourseTitle(publishedCourseId, group, publishedCourseTitles)
        : undefined,
      duplicateRows: group.map(rowPreview),
      keeper: rowPreview(keeper),
      rowsToDelete: duplicates.map(rowPreview),
    })

    result.nameRouteGroupsMerged += 1
    result.removedDuplicates += duplicates.length
    result.routesMerged += merged.routesMerged
    result.goalsMerged += merged.goalsMerged
    result.providersMerged += merged.providersMerged
  }

  result.mergedGroups = result.linkedPublishedGroupsMerged + result.nameRouteGroupsMerged
  return { operations, groups: previews, result }
}

function combineResults(
  linked: CleanupDuplicatesResult,
  nameRoute: CleanupDuplicatesResult
): CleanupDuplicatesResult {
  return {
    linkedPublishedGroupsMerged: linked.linkedPublishedGroupsMerged,
    nameRouteGroupsMerged: nameRoute.nameRouteGroupsMerged,
    mergedGroups: linked.linkedPublishedGroupsMerged + nameRoute.nameRouteGroupsMerged,
    removedDuplicates: linked.removedDuplicates + nameRoute.removedDuplicates,
    routesMerged: linked.routesMerged + nameRoute.routesMerged,
    goalsMerged: linked.goalsMerged + nameRoute.goalsMerged,
    providersMerged: linked.providersMerged + nameRoute.providersMerged,
  }
}

export function planDuplicateCleanup(
  opportunities: CourseOpportunity[],
  publishedCourseTitles: Map<string, string> = new Map()
): CleanupDuplicatesPlan {
  const linked = planLinkedPublishedDuplicateCleanup(opportunities, publishedCourseTitles)
  const afterLinked = applyCleanupOperationsInMemory(opportunities, linked.operations)
  const nameRoute = planNameRouteDuplicateCleanup(afterLinked, publishedCourseTitles)
  const operations = [...linked.operations, ...nameRoute.operations]
  const afterAll = applyCleanupOperationsInMemory(opportunities, operations)

  return {
    groups: [...linked.groups, ...nameRoute.groups],
    operations,
    result: combineResults(linked.result, nameRoute.result),
    remainingDuplicatePublishedLinksAfterCleanup: findDuplicatePublishedLinks(afterAll).length,
  }
}

export const CLEANUP_SUCCESS_MESSAGE =
  'Duplicate opportunities cleaned and route/provider/goal links merged.'
