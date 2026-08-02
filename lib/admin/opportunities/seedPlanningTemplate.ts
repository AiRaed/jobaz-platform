import {
  buildProviderPresetForEntry,
  isCourseAffiliateVerifiedInTemplate,
  JOB_AZ_PLANNING_TEMPLATE,
  PLANNING_SEED_DEFAULT_NEXT_ACTION,
  PLANNING_SEED_DEFAULT_NOTES,
  UNVERIFIED_PROVIDER_NEXT_ACTION,
  resolveRoutesFromLabels,
  resolveGoalsForTemplateEntry,
  type PlanningTemplateEntry,
} from './planningTemplate'
import { findExistingByName, normalizeCourseNameKey, normalizeProviderNameKey } from './duplicateUtils'
import type {
  CourseOpportunity,
  CourseOpportunityInput,
  OpportunityGoalInput,
  OpportunityProviderInput,
} from './types'

export type SeedPlanningResult = {
  created: number
  updated: number
  routesAdded: number
  goalsAdded: number
  providersAdded: number
}

export { normalizeCourseNameKey }

function isBlank(value: string | null | undefined): boolean {
  return !(value ?? '').trim()
}

function defaultOpportunityStatus(entry: PlanningTemplateEntry): string {
  return entry.opportunityStatus ?? 'Need provider'
}

function defaultPublishStatus(entry: PlanningTemplateEntry): string {
  return entry.publishStatus ?? 'Not published'
}

function providerFromEntry(entry: PlanningTemplateEntry): OpportunityProviderInput | null {
  return buildProviderPresetForEntry(entry)
}

function nextActionForEntry(entry: PlanningTemplateEntry): string {
  if (providerFromEntry(entry) && !isCourseAffiliateVerifiedInTemplate(entry)) {
    return UNVERIFIED_PROVIDER_NEXT_ACTION
  }
  return PLANNING_SEED_DEFAULT_NEXT_ACTION
}

function mergeProviderFromTemplate(
  existing: OpportunityProviderInput,
  template: OpportunityProviderInput
): OpportunityProviderInput {
  const keepReferral =
    !template.referralUrl.trim() && Boolean(existing.referralUrl?.trim())
  return {
    ...existing,
    providerStatus: template.providerStatus,
    affiliateStatus: template.affiliateStatus,
    trackingMethod: template.trackingMethod,
    referralUrl: keepReferral ? existing.referralUrl : template.referralUrl,
    commissionType: template.commissionType || existing.commissionType,
    commissionValue: template.commissionValue || existing.commissionValue,
    publicOfferLabel: template.publicOfferLabel || existing.publicOfferLabel,
    notes: template.notes || existing.notes,
  }
}

function providersToInput(providers: CourseOpportunity['providers']): OpportunityProviderInput[] {
  return providers.map((p) => ({
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
  }))
}

function goalsToInput(goals: CourseOpportunity['goals']): OpportunityGoalInput[] {
  return (goals ?? []).map((g) => ({
    goalKey: g.goalKey,
    goalLabel: g.goalLabel,
  }))
}

export function buildSeedInputForEntry(
  entry: PlanningTemplateEntry,
  existing: CourseOpportunity | null
): {
  action: 'create' | 'update'
  input: CourseOpportunityInput
  routesAdded: number
  goalsAdded: number
  providersAdded: number
} {
  const templateRoutes = resolveRoutesFromLabels(entry.routeLabels)
  const templateGoals = resolveGoalsForTemplateEntry(entry)
  const templateProvider = providerFromEntry(entry)

  if (!existing) {
    return {
      action: 'create',
      routesAdded: templateRoutes.length,
      goalsAdded: templateGoals.length,
      providersAdded: templateProvider ? 1 : 0,
      input: {
        courseName: entry.courseName.trim(),
        shortLabel: '',
        coursePurpose: entry.coursePurpose,
        priority: entry.priority ?? 50,
        opportunityStatus: defaultOpportunityStatus(entry),
        publishStatus: defaultPublishStatus(entry),
        importance: 'Medium',
        notes: entry.notes?.trim() || PLANNING_SEED_DEFAULT_NOTES,
        nextAction: nextActionForEntry(entry),
        publishedCourseId: null,
        routes: templateRoutes,
        goals: templateGoals,
        providers: templateProvider ? [templateProvider] : [],
      },
    }
  }

  const existingRouteKeys = new Set(existing.routes.map((r) => r.routeKey))
  const routesAddedList = templateRoutes.filter((r) => !existingRouteKeys.has(r.routeKey))
  const mergedRoutes = [
    ...existing.routes.map((r) => ({ routeKey: r.routeKey, routeLabel: r.routeLabel })),
    ...routesAddedList,
  ]

  const existingGoalKeys = new Set((existing.goals ?? []).map((g) => g.goalKey))
  const goalsAddedList = templateGoals.filter((g) => !existingGoalKeys.has(g.goalKey))
  const mergedGoals = [...goalsToInput(existing.goals ?? []), ...goalsAddedList]

  let providersAdded = 0
  const mergedProviders = providersToInput(existing.providers)

  if (templateProvider) {
    const matchIndex = mergedProviders.findIndex(
      (p) => normalizeProviderNameKey(p.providerName) === normalizeProviderNameKey(templateProvider.providerName)
    )
    if (matchIndex >= 0) {
      mergedProviders[matchIndex] = mergeProviderFromTemplate(mergedProviders[matchIndex], templateProvider)
    } else {
      mergedProviders.push({
        ...templateProvider,
        isPreferred: mergedProviders.length === 0,
      })
      providersAdded = 1
    }
  }

  const templateNextAction = nextActionForEntry(entry)
  const refreshNextAction =
    !isCourseAffiliateVerifiedInTemplate(entry) &&
    (isBlank(existing.nextAction) || existing.nextAction === PLANNING_SEED_DEFAULT_NEXT_ACTION)

  return {
    action: 'update',
    routesAdded: routesAddedList.length,
    goalsAdded: goalsAddedList.length,
    providersAdded,
    input: {
      courseName: existing.courseName,
      shortLabel: existing.shortLabel,
      coursePurpose: isBlank(existing.coursePurpose) ? entry.coursePurpose : existing.coursePurpose,
      priority: existing.priority,
      opportunityStatus: existing.opportunityStatus,
      publishStatus: existing.publishStatus,
      importance: isBlank(existing.importance) ? 'Medium' : existing.importance,
      notes: isBlank(existing.notes)
        ? entry.notes?.trim() || PLANNING_SEED_DEFAULT_NOTES
        : existing.notes,
      nextAction: refreshNextAction ? templateNextAction : existing.nextAction,
      publishedCourseId: existing.publishedCourseId ?? null,
      routes: mergedRoutes,
      goals: mergedGoals,
      providers: mergedProviders,
    },
  }
}

export function planSeedOperations(
  existingOpportunities: CourseOpportunity[]
): Array<{
  action: 'create' | 'update'
  existingId?: string
  input: CourseOpportunityInput
  routesAdded: number
  goalsAdded: number
  providersAdded: number
}> {
  const running: CourseOpportunity[] = existingOpportunities.map((o) => ({
    ...o,
    goals: o.goals ?? [],
  }))

  const operations: Array<{
    action: 'create' | 'update'
    existingId?: string
    input: CourseOpportunityInput
    routesAdded: number
    goalsAdded: number
    providersAdded: number
  }> = []

  for (const entry of JOB_AZ_PLANNING_TEMPLATE) {
    const existing = findExistingByName(running, entry.courseName)
    const built = buildSeedInputForEntry(entry, existing)

    operations.push({
      action: built.action,
      existingId: existing?.id,
      input: built.input,
      routesAdded: built.routesAdded,
      goalsAdded: built.goalsAdded,
      providersAdded: built.providersAdded,
    })

    if (built.action === 'create') {
      running.unshift({
        id: `pending-${normalizeCourseNameKey(entry.courseName)}`,
        courseName: built.input.courseName,
        shortLabel: built.input.shortLabel,
        coursePurpose: built.input.coursePurpose,
        priority: built.input.priority,
        opportunityStatus: built.input.opportunityStatus,
        publishStatus: built.input.publishStatus,
        importance: built.input.importance,
        notes: built.input.notes,
        nextAction: built.input.nextAction,
        publishedCourseId: built.input.publishedCourseId ?? null,
        educationFields: built.input.educationFields ?? [],
        specialisations: built.input.specialisations ?? [],
        commercialStatus: built.input.commercialStatus ?? '',
        suggestedSearchKeywords: built.input.suggestedSearchKeywords ?? '',
        adminNotes: built.input.adminNotes ?? '',
        canBeCourseCard: built.input.canBeCourseCard ?? true,
        recommendationType: built.input.recommendationType ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        routes: built.input.routes.map((r, i) => ({
          id: `r-${i}`,
          opportunityId: '',
          routeKey: r.routeKey,
          routeLabel: r.routeLabel,
        })),
        goals: built.input.goals.map((g, i) => ({
          id: `g-${i}`,
          opportunityId: '',
          goalKey: g.goalKey,
          goalLabel: g.goalLabel,
        })),
        providers: built.input.providers.map((p, i) => ({
          id: `p-${i}`,
          opportunityId: '',
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
          createdAt: '',
          updatedAt: '',
        })),
      })
    } else if (existing) {
      const index = running.findIndex((o) => o.id === existing.id)
      if (index >= 0) {
        running[index] = {
          ...existing,
          ...built.input,
          routes: built.input.routes.map((r, i) => ({
            id: existing.routes[i]?.id ?? `r-${i}`,
            opportunityId: existing.id,
            routeKey: r.routeKey,
            routeLabel: r.routeLabel,
          })),
          goals: built.input.goals.map((g, i) => ({
            id: existing.goals?.[i]?.id ?? `g-${i}`,
            opportunityId: existing.id,
            goalKey: g.goalKey,
            goalLabel: g.goalLabel,
          })),
          providers: built.input.providers.map((p, i) => ({
            id: existing.providers[i]?.id ?? `p-${i}`,
            opportunityId: existing.id,
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
            createdAt: existing.providers[i]?.createdAt ?? '',
            updatedAt: existing.providers[i]?.updatedAt ?? '',
          })),
        }
      }
    }
  }

  return operations
}

export function summarizeSeedOperations(
  operations: ReturnType<typeof planSeedOperations>
): SeedPlanningResult {
  return operations.reduce<SeedPlanningResult>(
    (acc, op) => {
      if (op.action === 'create') acc.created += 1
      else acc.updated += 1
      acc.routesAdded += op.routesAdded
      acc.goalsAdded += op.goalsAdded
      acc.providersAdded += op.providersAdded
      return acc
    },
    { created: 0, updated: 0, routesAdded: 0, goalsAdded: 0, providersAdded: 0 }
  )
}

export { JOB_AZ_PLANNING_TEMPLATE }
