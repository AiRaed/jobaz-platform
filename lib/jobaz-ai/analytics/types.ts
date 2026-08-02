/**
 * JobAZ AI Analytics — shared types for the internal dashboard.
 * Extend this module as new metrics (profiles, personalization, heatmaps) are added.
 */

export type AiAnalyticsOverview = {
  totalAssessments: number
  totalCompletedAssessments: number
  totalSignupClicks: number
  totalToolClicks: number
  completionRatePercent: number
}

export type CareerPathStatRow = {
  recommendedPath: string
  count: number
  percentage: number
}

export type ToolStatRow = {
  toolId: string
  toolName: string
  count: number
}

export type FunnelStatRow = {
  eventName: string
  label: string
  count: number
  /** Step conversion from previous funnel stage (0–100). */
  conversionFromPreviousPercent: number | null
}

export type DropoffStepStat = {
  step: number
  label: string
  count: number
}

export type RecentAiEventRow = {
  id: string
  eventName: string
  createdAt: string
  anonymousId: string | null
  metadataSummary: string
}

export type AiProfilesOverview = {
  totalProfiles: number
  returningProfiles: number
  averageReadinessScore: number
  averageEngagementScore: number
  mostCommonDominantGoal: string
  mostCommonLastRecommendedPath: string
}

export type ToolClickStatRow = {
  rank: number
  toolName: string
  count: number
}

export type AiAudienceSplit = {
  anonymousProfiles: number
  authenticatedProfiles: number
  anonymousSharePercent: number
}

export type ReadinessByPathRow = {
  recommendedPath: string
  averageReadiness: number
  profileCount: number
}

export type AiAnalyticsDashboardData = {
  overview: AiAnalyticsOverview
  profiles: AiProfilesOverview
  careerPaths: CareerPathStatRow[]
  tools: ToolStatRow[]
  toolClicks: ToolClickStatRow[]
  audienceSplit: AiAudienceSplit
  readinessByPath: ReadinessByPathRow[]
  funnel: FunnelStatRow[]
  dropoff: DropoffStepStat[]
  recentEvents: RecentAiEventRow[]
}
