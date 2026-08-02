import type { CareerPathTriad } from '@/lib/career-journey/types'
import type { CourseEntry, EssentialAction } from '@/lib/career-engine/shared/planTypes'
import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import type { RealityCheckSummary, StartNewCareerTimelinePhase } from './roadmapAdvisor'

export type CareerDiscoveryRecommendation = {
  sectorId: CareerSectorId
  label: string
  matchScore: number
  scoreReasons: string[]
  workNow: string[]
  buildNext: Array<{ title: string; why: string }>
  courses: Array<{ title: string; why: string; mandatory: boolean }>
  careerProgression: string[]
  timeline: {
    estimatedTransition: string
    bridgeRole: string
    firstTargetRole: string
    longTermGoal: string
    incomeNote: string
    phases: Array<{ period: string; label: string; actions: string[] }>
  }
  readiness: {
    score: number
    summary: string
    missing: string[]
  }
  transferableSkills: string[]
  skills: string[]
  routeTypeLabel: string
}

export type StartNewCareerSituation =
  | 'experienced_known_target'
  | 'experienced_unknown_target'
  | 'no_experience_known_target'
  | 'no_experience_unknown_target'

export type TransitionRouteType =
  | 'direct_transition'
  | 'bridge_transition'
  | 'major_retraining'
  | 'long_term_goal'

export type StartNewCareerAnswers = {
  starting_situation: StartNewCareerSituation
  current_field?: string
  current_field_other?: string
  experience_years?: string
  target_field?: string
  target_field_other?: string
  interest_area?: string
  work_environment?: string
  target_confirmed?: string
  education_level?: string
  english_level?: string
  uk_work_experience?: string
  urgency?: string
  study_willing?: string
  preferred_location?: string
}

export type StartNewCareerRecommendationsResult = {
  pathId: 'start_new_career'
  phase: 'recommendations'
  situation: StartNewCareerSituation
  situationLabel: string
  currentField: string
  answers: Record<string, string>
  recommendations: CareerDiscoveryRecommendation[]
  explorationSummary: string
}

export type StartNewCareerPlanResult = {
  pathId: 'start_new_career'
  phase: 'roadmap'
  situation: StartNewCareerSituation
  situationLabel: string
  currentField: string
  targetField: string
  routeType: TransitionRouteType
  routeTypeLabel: string
  supportiveMessage: string
  pathRationale: string
  barriers: string[]
  answers: Record<string, string>
  transition: {
    difficulty: string
    estimatedTimeline: string
    readinessScore: number
    readinessSummary: string
    transferableSkills: string[]
    summary: string
    realityCheck: string
    fastestRouteSummary: string
  }
  triad: CareerPathTriad
  realityCheckSummary: RealityCheckSummary
  careerProgression: string[]
  timelinePhases: StartNewCareerTimelinePhase[]
  essentialActions: EssentialAction[]
  recommendedCourses: Array<CourseEntry & { href: string }>
  location: string
  structuredRecommendations?: import('@/lib/recommendations/types').StructuredCareerRecommendations
}

export type StartNewCareerEngineResult =
  | StartNewCareerRecommendationsResult
  | StartNewCareerPlanResult

export function isStartNewCareerRoadmap(
  result: StartNewCareerEngineResult
): result is StartNewCareerPlanResult {
  return result.phase === 'roadmap'
}

export function isStartNewCareerRecommendations(
  result: StartNewCareerEngineResult
): result is StartNewCareerRecommendationsResult {
  return result.phase === 'recommendations'
}
