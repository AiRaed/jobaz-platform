export type VisibilityStatus = 'internal' | 'recommendation_only' | 'public_listed'

export type CommercialStatus = 'no_link' | 'official_link' | 'affiliate_ready'

export type RecommendationType = 'course_type' | 'action_type' | 'resource_type'

export type RecommendationCardSource =
  | 'career_coach_result'
  | 'education_path_result'
  | 'uk_career_assistant'

export type RecommendationCourseCardData = {
  id: string
  opportunityId?: string
  publishedCourseId?: string
  slug?: string
  title: string
  shortDescription: string
  whyRecommended: string
  bestFor?: string
  duration?: string
  level?: string
  purpose?: string
  visibilityStatus: VisibilityStatus
  commercialStatus: CommercialStatus
  recommendationType: RecommendationType
  badge: string
  statusMessage?: string
  referralUrl?: string
  officialUrl?: string
  publicOfferLabel?: string
  suggestedSearchKeywords: string
  googleSearchUrl?: string
  priority: number
  matchScore: number
  canAddToRoadmap: boolean
}

export type OtherSuggestion = {
  id: string
  title: string
  description?: string
  /** Numbered action plan items (replaces repeated "Today's focus" cards). */
  actions?: string[]
}

export type StructuredCareerRecommendations = {
  essentialActions: Array<{
    id: string
    title: string
    description: string
    href?: string
    priority?: 'critical' | 'recommended'
  }>
  recommendedCourses: RecommendationCourseCardData[]
  otherSuggestions: OtherSuggestion[]
  /** Refined job cards when specialisation-aware filtering applies. */
  workNow?: Array<{
    title: string
    seniority?: string
    searchKeyword: string
    salaryRange?: string
    href: string
  }>
}
