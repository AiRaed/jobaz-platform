/** Shared result shape for Career Engine paths (Education + Experience). */

export type EnglishLevel = 'beginner' | 'basic' | 'intermediate' | 'good' | 'fluent'

export type JobEntry = {
  title: string
  seniority?: 'graduate' | 'junior' | 'mid' | 'senior' | 'research'
  searchKeyword: string
  salaryRange?: string
}

export type CourseEntry = {
  id: string
  title: string
  whyReasons: string[]
  duration?: string
  costLabel?: string
  qualification?: string
  pathId?: string
  slug?: string
}

export type EssentialAction = {
  id: string
  title: string
  description: string
  href?: string
  priority: 'critical' | 'recommended'
  /** Ordered step in the UK career roadmap (Experience path). */
  step?: number
}

export type CvImprovement = {
  id: string
  title: string
  description: string
  href: string
  priority: number
}

export type CareerEnginePlanResult = {
  pathId: 'work_in_education' | 'work_in_experience'
  field: string
  fieldLabel: string
  /** Education path — profession within the broad field */
  specialisation?: string
  specialisationLabel?: string
  answers: Record<string, string>
  goal: string
  workNow: Array<JobEntry & { href: string }>
  essentialActions: EssentialAction[]
  recommendedCourses: Array<CourseEntry & { href: string }>
  cvImprovements: CvImprovement[]
  careerTimeline: string[]
  missions: Array<{
    id: string
    label: string
    href: string
    target?: number
  }>
  careerReadiness: {
    score: number
    interviewReadiness: 'low' | 'medium' | 'high'
    summary: string
    missing: string[]
    /** Legal or professional requirements before working (Experience path). */
    mandatoryRequirements?: string[]
    /** Employability boosters — not legally required (Experience path). */
    recommendedImprovements?: string[]
    /** Per-path readiness when multiple specialisations selected (Experience path). */
    pathReadiness?: Array<{
      specId: string
      pathLabel: string
      score: number
      ready: boolean
      missingMandatory: string[]
      summary: string
    }>
  }
  /** Realistic UK transition timeline label, e.g. "3–6 months". */
  estimatedPathway?: string
  /** Index into careerTimeline for the user's current role (Experience path). */
  careerTimelineCurrentIndex?: number
  /** Index into careerTimeline for the next realistic career step (Experience path). */
  careerTimelineTargetIndex?: number
  /** Dynamic UK career advisor insights (education path). */
  careerInsights?: {
    fastestEntryRoute: string
    longTermPath: string[]
    alternativeRoles: string[]
    interviewPreparation: string[]
    experienceGaps: string[]
    complianceNotes: string[]
    portfolioRequired: boolean
    dailyActions: string[]
    skillsEmployersExpect?: string[]
  }
  location: string
  /** Universal resolved course cards for Career Coach display. */
  structuredRecommendations?: import('@/lib/recommendations/types').StructuredCareerRecommendations
}
