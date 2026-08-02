import { normalizeVisibilityStatus } from '@/lib/recommendations/visibility'
import type {
  CourseOpportunity,
  CourseOpportunityInput,
  OpportunityGoal,
  OpportunityProvider,
  OpportunityProviderInput,
  OpportunityRoute,
} from './types'

export type OpportunityRow = {
  id: string
  course_name: string
  short_label: string | null
  course_purpose: string | null
  priority: number
  opportunity_status: string
  publish_status: string
  importance: string | null
  notes: string | null
  next_action: string | null
  published_course_id: string | null
  visibility_status?: string | null
  education_fields?: string[] | null
  specialisations?: string[] | null
  commercial_status?: string | null
  suggested_search_keywords?: string | null
  admin_notes?: string | null
  can_be_course_card?: boolean | null
  recommendation_type?: string | null
  created_at: string
  updated_at: string
}

export type OpportunityRouteRow = {
  id: string
  opportunity_id: string
  route_key: string
  route_label: string
}

export type OpportunityProviderRow = {
  id: string
  opportunity_id: string
  provider_name: string
  provider_status: string
  affiliate_status: string
  official_url: string | null
  referral_url: string | null
  dashboard_url: string | null
  commission_type: string | null
  commission_value: string | null
  public_offer_label: string | null
  tracking_method: string | null
  notes: string | null
  is_preferred: boolean
  created_at: string
  updated_at: string
}

export type OpportunityGoalRow = {
  id: string
  opportunity_id: string
  goal_key: string
  goal_label: string
}

function str(v: string | null | undefined): string {
  return (v ?? '').trim()
}

export function routeRowToOpportunityRoute(row: OpportunityRouteRow): OpportunityRoute {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    routeKey: row.route_key,
    routeLabel: row.route_label,
  }
}

export function goalRowToOpportunityGoal(row: OpportunityGoalRow): OpportunityGoal {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    goalKey: row.goal_key,
    goalLabel: row.goal_label,
  }
}

export function providerRowToOpportunityProvider(row: OpportunityProviderRow): OpportunityProvider {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    providerName: row.provider_name,
    providerStatus: row.provider_status,
    affiliateStatus: row.affiliate_status,
    officialUrl: str(row.official_url),
    referralUrl: str(row.referral_url),
    dashboardUrl: str(row.dashboard_url),
    commissionType: str(row.commission_type) || 'Unknown',
    commissionValue: str(row.commission_value),
    publicOfferLabel: str(row.public_offer_label),
    trackingMethod: str(row.tracking_method) || 'Unknown',
    notes: str(row.notes),
    isPreferred: Boolean(row.is_preferred),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function assembleCourseOpportunity(
  row: OpportunityRow,
  routes: OpportunityRouteRow[],
  providers: OpportunityProviderRow[],
  goals: OpportunityGoalRow[] = []
): CourseOpportunity {
  return {
    id: row.id,
    courseName: row.course_name,
    shortLabel: str(row.short_label),
    coursePurpose: str(row.course_purpose),
    priority: row.priority ?? 50,
    opportunityStatus: row.opportunity_status,
    publishStatus: row.publish_status,
    importance: str(row.importance),
    notes: str(row.notes),
    nextAction: str(row.next_action),
    publishedCourseId: row.published_course_id ?? null,
    visibilityStatus: normalizeVisibilityStatus(row.visibility_status),
    educationFields: row.education_fields ?? [],
    specialisations: row.specialisations ?? [],
    commercialStatus: str(row.commercial_status),
    suggestedSearchKeywords: str(row.suggested_search_keywords),
    adminNotes: str(row.admin_notes),
    canBeCourseCard: row.can_be_course_card ?? true,
    recommendationType: str(row.recommendation_type),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    routes: routes.filter((r) => r.opportunity_id === row.id).map(routeRowToOpportunityRoute),
    goals: goals.filter((g) => g.opportunity_id === row.id).map(goalRowToOpportunityGoal),
    providers: providers
      .filter((p) => p.opportunity_id === row.id)
      .map(providerRowToOpportunityProvider),
  }
}

export function opportunityInputToInsertRow(input: CourseOpportunityInput) {
  const now = new Date().toISOString()
  return {
    course_name: input.courseName.trim(),
    short_label: input.shortLabel.trim() || null,
    course_purpose: input.coursePurpose.trim() || null,
    priority: input.priority ?? 50,
    opportunity_status: input.opportunityStatus || 'Need provider',
    publish_status: input.publishStatus || 'Not published',
    importance: input.importance.trim() || null,
    notes: input.notes.trim() || null,
    next_action: input.nextAction.trim() || null,
    published_course_id: input.publishedCourseId ?? null,
    visibility_status: input.visibilityStatus ?? 'internal',
    education_fields: input.educationFields ?? [],
    specialisations: input.specialisations ?? [],
    commercial_status: input.commercialStatus?.trim() || null,
    suggested_search_keywords: input.suggestedSearchKeywords?.trim() || null,
    admin_notes: input.adminNotes?.trim() || null,
    can_be_course_card: input.canBeCourseCard ?? true,
    recommendation_type: input.recommendationType?.trim() || null,
    updated_at: now,
  }
}

export function opportunityInputToUpdateRow(input: CourseOpportunityInput) {
  return {
    ...opportunityInputToInsertRow(input),
    updated_at: new Date().toISOString(),
  }
}

export function routeInputToInsertRow(opportunityId: string, route: { routeKey: string; routeLabel: string }) {
  return {
    opportunity_id: opportunityId,
    route_key: route.routeKey,
    route_label: route.routeLabel,
  }
}

export function goalInputToInsertRow(
  opportunityId: string,
  goal: { goalKey: string; goalLabel: string }
) {
  return {
    opportunity_id: opportunityId,
    goal_key: goal.goalKey,
    goal_label: goal.goalLabel,
  }
}

export function providerInputToInsertRow(opportunityId: string, provider: OpportunityProviderInput) {
  const now = new Date().toISOString()
  return {
    opportunity_id: opportunityId,
    provider_name: provider.providerName.trim(),
    provider_status: provider.providerStatus || 'Need check',
    affiliate_status: provider.affiliateStatus || 'Unknown',
    official_url: provider.officialUrl.trim() || null,
    referral_url: provider.referralUrl.trim() || null,
    dashboard_url: provider.dashboardUrl.trim() || null,
    commission_type: provider.commissionType.trim() || null,
    commission_value: provider.commissionValue.trim() || null,
    public_offer_label: provider.publicOfferLabel.trim() || null,
    tracking_method: provider.trackingMethod.trim() || null,
    notes: provider.notes.trim() || null,
    is_preferred: Boolean(provider.isPreferred),
    updated_at: now,
  }
}

export function normalizePreferredProviders(providers: OpportunityProviderInput[]): OpportunityProviderInput[] {
  const preferredIndex = providers.findIndex((p) => p.isPreferred)
  if (preferredIndex < 0) return providers
  return providers.map((p, i) => ({ ...p, isPreferred: i === preferredIndex }))
}
