import type { CareerPlanItem } from '@/lib/career-hub/types'
import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'

export type MilestoneStatus = 'complete' | 'current' | 'pending'

export type CareerMilestone = {
  id: string
  label: string
  status: MilestoneStatus
  href?: string
  kind?: 'assessment' | 'route' | 'requirement' | 'cv' | 'jobs_saved' | 'jobs_applied' | 'interview' | 'offer' | 'employment'
}

export type CareerPlanType =
  | 'entry_with_licence'
  | 'qualified_professional'
  | 'career_changer'
  | 'promotion_seeker'
  | 'freelancer'

export type RouteRequirementStatus = 'not_started' | 'in_progress' | 'completed'

export type TrainingSectionTier =
  | 'required_first'
  | 'professional_qualifications'
  | 'future_development'

export type RouteRequirement = {
  id: string
  name: string
  slug: string
  type: 'course' | 'licence' | 'certification' | 'skill'
  status: RouteRequirementStatus
  required: boolean
  estimatedTime: string
  estimatedCost: string
  expectedImpact: string
  pathId?: string
  courseHref?: string
  source?: 'essential_action' | 'recommended_course' | 'path_requirement'
  actionLabel?: string
  sectionTier?: TrainingSectionTier
}

export type RoadmapTrainingSection = {
  tier: TrainingSectionTier
  label: string
  items: RouteRequirement[]
}

export type SuggestedRole = {
  title: string
}

export type RouteInsightCards = {
  whyThisRoute: string[]
  whatYouBring: string[]
  areasToImprove: string[]
}

export type CareerDestination = {
  currentRoute: string
  targetRole: string
  nextRole: string
  advancedPath: string
  salarySteps: { label: string; amount: string }[]
  timeHorizons: { label: string; period: string }[]
}

export type PlanNextAction = {
  priority: string
  buttonLabel: string
  href: string
}

export type RoadmapTaskKind =
  | 'assessment'
  | 'cv'
  | 'training'
  | 'apply'
  | 'interview'
  | 'first_job'
  | 'growth'

export type RoadmapTaskSource = 'system' | 'essential_action' | 'recommended_course' | 'requirement'

export type CareerRoadmapTask = {
  id: string
  phaseId: string
  kind: RoadmapTaskKind
  source: RoadmapTaskSource
  label: string
  missionLabel: string
  href: string
  actionLabel?: string
  status: MilestoneStatus
  completed: boolean
  target?: number
  current?: number
  description?: string
  requirement?: RouteRequirement
}

export type CareerRoadmapPhase = {
  id: string
  label: string
  status: MilestoneStatus
  href?: string
  tasks: CareerRoadmapTask[]
}

export type CareerRoadmapTrainingDetails = {
  phaseActive: boolean
  essentialActions: RouteRequirement[]
  recommendedCourses: RouteRequirement[]
  sections: RoadmapTrainingSection[]
  all: RouteRequirement[]
}

export type CareerRoadmap = {
  hasAssessment: true
  planType: CareerPlanType
  routeLabel: string
  routePathId: string | null
  targetRole: string
  timeToEmployment: string
  routeInsights: RouteInsightCards
  destination: CareerDestination
  suggestedRoles: SuggestedRole[]
  requirements: RouteRequirement[]
  phases: CareerRoadmapPhase[]
  tasks: CareerRoadmapTask[]
  journeySteps: readonly string[]
  currentPhaseIndex: number
  missions: MissionItem[]
  nextAction: PlanNextAction
  continueJourney: PlanNextAction
  progressPercent: number
  careerReadinessPercent: number
  readinessInsights: string[]
  /** Explainable readiness factors for the My Plan hero */
  readinessBreakdown: {
    completed: string[]
    missing: string[]
    factors: Array<{
      id: string
      label: string
      weight: number
      earned: number
      complete: boolean
    }>
  }
  milestones: CareerMilestone[]
  firstIncompleteTask: CareerRoadmapTask
  trainingDetails: CareerRoadmapTrainingDetails | null
  /** Career Coach path ladder (Start Now / Train Next / Upgrade) when available. */
  pathLadder?: import('./pathPlanLadder').PathPlanLadder | null
}

/** Alias for backward compatibility — roadmap is the canonical plan model */
export type GeneratedCareerPlan = CareerRoadmap

export type JobTrackerStats = {
  savedJobs: number
  applicationsSent: number
  interviews: number
  offers: number
  rejected: number
  pending: number
}

export type CvStatusSummary = {
  score: number
  level: string
  lastUpdated: string | null
  missingSections: string[]
  improveHref: string
}

export type PlanActivitySignals = {
  planItems: CareerPlanItem[]
  savedJobsCount: number
  appliedJobsCount: number
  interviewConfidence: number
  cvQualityScore: number
  hasBaseCv: boolean
  cvReady: boolean
}

export const CAREER_PLAN_REFRESH_EVENT = 'jobaz-career-plan-generated-updated'
