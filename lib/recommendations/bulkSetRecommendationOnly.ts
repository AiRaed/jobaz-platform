import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { resolveCommercialStatusForOpportunity } from './visibility'

export type RecommendationOnlyBulkPatch = {
  visibility_status: 'recommendation_only'
  publish_status: 'Not published'
  can_be_course_card: true
  commercial_status: string
  updated_at: string
}

/** Fields applied when admin sets opportunities as recommendation-only cards. */
export function buildRecommendationOnlyBulkPatch(opp: CourseOpportunity): RecommendationOnlyBulkPatch {
  const commercial = resolveCommercialStatusForOpportunity(opp)
  return {
    visibility_status: 'recommendation_only',
    publish_status: 'Not published',
    can_be_course_card: true,
    commercial_status: commercial,
    updated_at: new Date().toISOString(),
  }
}

export function applyRecommendationOnlyBulkToOpportunity(opp: CourseOpportunity): CourseOpportunity | null {
  if (opp.publishedCourseId) return null
  const patch = buildRecommendationOnlyBulkPatch(opp)
  return {
    ...opp,
    visibilityStatus: patch.visibility_status,
    publishStatus: patch.publish_status,
    canBeCourseCard: patch.can_be_course_card,
    commercialStatus: patch.commercial_status,
    updatedAt: patch.updated_at,
  }
}
