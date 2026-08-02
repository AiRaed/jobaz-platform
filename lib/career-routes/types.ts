/**
 * JobAZ Career Route Stage Framework
 *
 * Standard pattern for every career route:
 * User Goal → Work Now Role → Training Upgrade → After Training Role
 * + CV stages, job search terms, course CTAs, My Plan fields.
 *
 * Security extra income is the first fully implemented example.
 * Other routes may be stubs until content/providers exist.
 */

export type CareerUserGoal =
  | 'extra_income'
  | 'start_new_career'
  | 'improve_cv'
  | 'change_career'
  | 'grow_career'
  | 'find_course_licence'

/** CV / plan stage the user is preparing for. */
export type CareerRouteStageId = 'work_now' | 'after_training' | 'general'

export type TrainingMentionStatus =
  | 'none'
  | 'interested'
  | 'in_progress'
  | 'completed'

export type CourseCtaMode = 'apply_now' | 'course_type' | 'coming_soon'

export type CareerRouteImplementation = 'full' | 'stub'

export type CareerTrainingUpgrade = {
  title: string
  /** Match plan items / course interest / certifications */
  match: RegExp
  primary?: boolean
}

export type CareerRecommendedCourse = {
  title: string
  match: RegExp
  /** True when an affiliate/referral URL is expected in admin for Phase 1 */
  affiliateExpected?: boolean
}

export type CareerCvStageConfig = {
  id: CareerRouteStageId
  /** Short UI label e.g. "Work Now CV" / "After SIA CV" */
  buttonLabel: string
  /** Banner line e.g. "CV stage: Work Now" */
  stageLabel: string
  targetRole: string
  jobSearchTerms: string[]
  /** Prefer first term for Job Finder query */
  primaryJobQuery: string
  requiresCompletedUpgrade?: boolean
  warning?: string
}

export type CareerSummaryTemplate = {
  id: CareerRouteStageId
  buttonLabel: string
  helperText: string
  requiresCompletedUpgrade?: boolean
  warning?: string
  buildSummary: (ctx: {
    trainingStatus: TrainingMentionStatus
    currentTarget: string
    nextUpgrade: string
    primaryTrainingTitle: string
  }) => string
}

export type CareerQualificationSuggestion = {
  label: string
  mode: 'completed_only' | 'in_progress_ok' | 'always_optional'
  match: RegExp
}

export type CareerRouteTrustRules = {
  /** Never say trained/qualified/certified/completed unless user confirmed */
  neverClaimCompletedUnlessConfirmed: true
  incompletePhrases: Array<'working_towards' | 'interested_in' | 'planning_to_complete' | 'building_experience'>
}

/** Stable keys for future admin analytics — do not rename lightly. */
export type CareerRouteAnalyticsKeys = {
  route_id: string
  /** e.g. security_extra_income */
  route_key: string
}

export type CareerRouteStageRule = {
  route_id: string
  route_title: string
  user_goal: CareerUserGoal | CareerUserGoal[]
  implementation: CareerRouteImplementation
  matchRoute: (routeTitle: string, currentTarget?: string) => boolean
  work_now_roles: string[]
  training_upgrades: CareerTrainingUpgrade[]
  after_training_roles: string[]
  optional_addons: string[]
  recommended_courses: CareerRecommendedCourse[]
  cv_stages: {
    work_now: CareerCvStageConfig
    after_training: CareerCvStageConfig
    general: CareerCvStageConfig
  }
  summary_templates: CareerSummaryTemplate[]
  skills: string[]
  experience_bullets: string[]
  qualifications: CareerQualificationSuggestion[]
  weekly_plan_steps?: (ctx: {
    workNowRole: string
    primaryTrainingTitle: string
    optionalAddon?: string
  }) => string[]
  trust_rules: CareerRouteTrustRules
  analytics: CareerRouteAnalyticsKeys
}

export type ResolvedCareerRouteStage = {
  rule: CareerRouteStageRule
  routeTitle: string
  implementation: CareerRouteImplementation
  trainingStatus: TrainingMentionStatus
  primaryTrainingTitle: string
  recommendedStage: CareerRouteStageId
  activeStage: CareerRouteStageId
  currentTarget: string
  nextUpgrade: string
  jobSearchQuery: string
  stageLabel: string
  afterTrainingButtonLabel: string
  workNowButtonLabel: string
  afterTrainingWarning: string | null
  summaryTemplates: CareerSummaryTemplate[]
  skills: string[]
  experienceBullets: string[]
  qualificationSuggestions: Array<CareerQualificationSuggestion & { allowed: boolean; hint: string }>
  workNowRoles: string[]
  afterTrainingRoles: string[]
  optionalAddons: string[]
  recommendedCourses: CareerRecommendedCourse[]
  weeklyPlanSteps: string[]
  analytics: CareerRouteAnalyticsKeys
}
