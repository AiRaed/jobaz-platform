/** Affiliate-ready fields — populate later; never hardcode partner links in the engine. */
export type AffiliateReady = {
  officialUrl?: string | null
  affiliateUrl?: string | null
  estimatedCommission?: string | null
  partnerBadge?: boolean
  recommendedBadge?: boolean
}

export type ExtraIncomeAnswers = {
  side_profile?: string
  side_hours?: string
  side_schedule?: string
  side_income_goal?: string
  side_skills?: string
  preferred_location?: string
}

export type StartTimeline =
  | 'Can start today'
  | 'Can start this week'
  | 'Usually within 2 weeks'
  | 'After completing a short course'

export type OpportunityDifficulty = 'Easy' | 'Medium' | 'Competitive'

export type HiringDemand = 'Very High Demand' | 'High Demand' | 'Medium Demand'

export type ImmediateOpportunity = AffiliateReady & {
  id: string
  title: string
  whyMatch: string
  /** 3–5 personalised reasons for the match checklist */
  matchReasons: string[]
  startTimeline: StartTimeline
  difficulty: OpportunityDifficulty
  hiringDemand: HiringDemand
  entryRequirements: string[]
  flexibility: string
  hourlyPay: string
  monthlyEstimate: string
  matchScore: number
  skillTags: string[]
  scheduleFit: string[]
}

export type FastestPathSummary = {
  lines: string[]
  topOpportunityTitle: string
  topQualificationTitle?: string
  targetEarningsLabel: string
}

export type EarningsBoostQualification = AffiliateReady & {
  id: string
  title: string
  whyHelps: string
  cost: string
  studyTime: string
  averageIncrease: string
  skillTags: string[]
  recommendedBadge?: boolean
}

export type LongTermSideIncome = AffiliateReady & {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  startupCost: string
  timeToFirstIncome: string
  longTermPotential: string
  whyFit: string
  skillTags: string[]
}

export type EarningsEstimate = {
  immediate: { low: number; high: number; label: string }
  afterQualification: { low: number; high: number; label: string }
  after12Months: { low: number; high: number; label: string }
  hoursPerWeek: number
  incomeGoalLabel: string
  goalMetImmediate: boolean
  goalMetAfterQual: boolean
}

export type ActionWeek = {
  week: number
  title: string
  actions: string[]
}

export type ExtraIncomePlanResult = {
  pathId: 'side_job'
  phase: 'roadmap'
  profileLabel: string
  hoursLabel: string
  scheduleLabel: string
  incomeGoalLabel: string
  skillsLabels: string[]
  location: string
  supportiveMessage: string
  fastestPath: FastestPathSummary
  immediateOpportunities: ImmediateOpportunity[]
  qualifications: EarningsBoostQualification[]
  longTermStreams: LongTermSideIncome[]
  earnings: EarningsEstimate
  actionPlan: ActionWeek[]
  answers: Record<string, string>
  /** Resolved via universal course recommendation resolver (Career Coach). */
  structuredRecommendations?: import('@/lib/recommendations/types').StructuredCareerRecommendations
  /** JAZ Career Engine analyse (preferred handoff source). */
  jaz_analyse?: import('@/lib/jaz-career-engine/types').JazAnalyseResult | null
  /** Prefers this JobAZPlan in ExtraIncomeResult when present. */
  jaz_jobaz_plan?: import('@/lib/dashboard/careerOs/mapCareerCoachResultToPlan').JobAZPlan | null
  /** Which plan the UI should prefer. */
  plan_source?: 'jaz' | 'jaz_fallback' | 'legacy'
  /** Route-first career reasoning — affiliate matching happens after this. */
  routeLogic?: {
    route_id: string
    route_title: string
    user_goal: string
    after_training_roles: string[]
    cv_focus: string
    allow_sia: boolean
    missing_provider_course_types?: string[]
  }
}
