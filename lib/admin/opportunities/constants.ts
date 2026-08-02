import { COURSE_PURPOSE_OPTIONS } from '@/lib/admin/courses/coursePurpose'
import { ADMIN_ROUTE_TARGETS } from '@/lib/admin/courses/routeTargets'

export { COURSE_PURPOSE_OPTIONS as OPPORTUNITY_PURPOSE_OPTIONS }

export const OPPORTUNITY_STATUS_OPTIONS = [
  'Idea',
  'Need provider',
  'Provider found',
  'Applied to provider',
  'Approved affiliate',
  'Rejected provider',
  'Need better provider',
  'Ready to add',
  'Published',
  'Later',
  'Not suitable',
] as const

export const OPPORTUNITY_PUBLISH_STATUS_OPTIONS = [
  'Not published',
  'Draft',
  'Ready to publish',
  'Published',
  'Hidden',
  'Later',
] as const

export const OPPORTUNITY_IMPORTANCE_OPTIONS = ['High', 'Medium', 'Low'] as const

export const OPPORTUNITY_PRIORITY_PRESETS = [
  { value: 100, label: '100 — Critical' },
  { value: 80, label: '80 — High' },
  { value: 50, label: '50 — Medium' },
  { value: 20, label: '20 — Low' },
] as const

export const PROVIDER_NAME_PRESETS = [
  'Get Licensed',
  'UK Professional Development Academy',
  'British Council',
  'Future provider',
  'Other',
] as const

export const PROVIDER_STATUS_OPTIONS = [
  'Need check',
  'Provider found',
  'Active',
  'Pending',
  'Rejected',
  'Problem',
  'Later',
] as const

export const AFFILIATE_STATUS_OPTIONS = [
  'Unknown',
  'Not affiliate',
  'Applied',
  'Pending',
  'Approved',
  'Rejected',
  'Active',
  'Need follow-up',
] as const

export const VISIBILITY_STATUS_OPTIONS = [
  'internal',
  'recommendation_only',
  'public_listed',
] as const

export const COMMERCIAL_STATUS_OPTIONS = [
  'no_link',
  'official_link',
  'affiliate_ready',
] as const

/** Legacy values still stored on older rows — mapped at read time in recommendations layer. */
export const LEGACY_COMMERCIAL_STATUS_OPTIONS = [
  'affiliate_potential',
  'research_needed',
  'active',
  'not_suitable',
] as const

export const EDUCATION_FIELD_FILTER_OPTIONS = [
  'Engineering',
  'Healthcare',
  'IT & Technology',
  'Business & Finance',
  'Business',
  'Finance',
  'Construction',
  'Manufacturing',
  'Education',
  'Law',
  'Science',
  'Creative & Design',
  'Hospitality',
  'Social Care',
  'Logistics',
  'Media & Communications',
  'Public Sector',
  'Property & Real Estate',
  'Facilities',
] as const

export const RECOMMENDATION_TYPE_OPTIONS = ['course_type', 'action_type', 'resource_type'] as const

export const OPPORTUNITY_COMMISSION_TYPE_OPTIONS = [
  'Unknown',
  'Fixed',
  'Percentage',
  'Per lead',
  'Per booking',
  'None',
] as const

export const TRACKING_METHOD_OPTIONS = [
  'Unknown',
  'Main referral link',
  'Course custom link',
  'Dashboard only',
  'Sub ID supported',
  'Manual check',
  'API / webhook later',
] as const

export type OpportunityGoalOption = {
  goalKey: string
  goalLabel: string
}

/** Career engine / journey goals for opportunity planning */
export const OPPORTUNITY_GOAL_OPTIONS: OpportunityGoalOption[] = [
  { goalKey: 'work_in_education', goalLabel: 'Work in my Education' },
  { goalKey: 'work_in_experience', goalLabel: 'Work in my Experience' },
  { goalKey: 'start_new_career', goalLabel: 'Start a New Career' },
  { goalKey: 'grow_current_career', goalLabel: 'Grow in my Current Career' },
  { goalKey: 'extra_income', goalLabel: 'Looking for Extra Income' },
  { goalKey: 'start_business', goalLabel: 'Start My Own Business' },
]

export function goalLabelForKey(goalKey: string): string {
  return OPPORTUNITY_GOAL_OPTIONS.find((g) => g.goalKey === goalKey)?.goalLabel ?? goalKey
}

export type OpportunityRouteOption = {
  routeKey: string
  routeLabel: string
  pathIds: string[]
  categoryId?: string
}

const EXTRA_ROUTES: OpportunityRouteOption[] = [
  { routeKey: 'retail-sales', routeLabel: 'Retail & Sales', pathIds: ['retail-sales'] },
  { routeKey: 'customer-service', routeLabel: 'Customer Service & Call Centre', pathIds: ['customer-service'] },
  { routeKey: 'hr-recruitment', routeLabel: 'HR & Recruitment', pathIds: ['hr-recruitment'] },
  { routeKey: 'accounting-finance', routeLabel: 'Accounting & Finance', pathIds: ['accounting-finance'] },
  { routeKey: 'marketing-digital', routeLabel: 'Marketing & Digital Marketing', pathIds: ['marketing-digital'] },
  { routeKey: 'it-technology', routeLabel: 'IT & Technology', pathIds: ['it-technology'] },
  { routeKey: 'manufacturing-engineering', routeLabel: 'Manufacturing & Engineering', pathIds: ['manufacturing-engineering'] },
  { routeKey: 'education-teaching', routeLabel: 'Education & Teaching', pathIds: ['education-teaching'] },
  { routeKey: 'public-sector', routeLabel: 'Public Sector', pathIds: ['public-sector'] },
  { routeKey: 'science-laboratory', routeLabel: 'Science & Laboratory', pathIds: ['science-laboratory'] },
  { routeKey: 'creative-design', routeLabel: 'Creative & Design', pathIds: ['creative-design'] },
  { routeKey: 'media-communications', routeLabel: 'Media & Communications', pathIds: ['media-communications'] },
  { routeKey: 'property-real-estate', routeLabel: 'Property & Real Estate', pathIds: ['property-real-estate'] },
  { routeKey: 'cleaning-facilities', routeLabel: 'Cleaning & Facilities', pathIds: ['cleaner', 'maintenance-facilities'] },
  { routeKey: 'other', routeLabel: 'Other', pathIds: ['other'] },
]

export const OPPORTUNITY_ROUTE_OPTIONS: OpportunityRouteOption[] = [
  ...ADMIN_ROUTE_TARGETS.map((t) => ({
    routeKey: t.categoryId,
    routeLabel: t.label,
    pathIds: t.pathIds,
    categoryId: t.categoryId,
  })),
  ...EXTRA_ROUTES.filter((extra) => !ADMIN_ROUTE_TARGETS.some((t) => t.label === extra.routeLabel)),
]
