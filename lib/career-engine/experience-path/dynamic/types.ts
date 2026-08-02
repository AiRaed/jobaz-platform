import type { CourseEntry, CvImprovement, EssentialAction, JobEntry } from '@/lib/career-engine/shared/planTypes'
import type { ExperienceIndustryId, ExperienceTier } from '../types'

export type ExperienceRequirement = {
  id: string
  title: string
  description: string
  href?: string
  tier: 'mandatory' | 'recommended'
  overseasOnly?: boolean
  ukOnly?: boolean
}

export type ExperienceJobBlueprint = {
  title: string
  keyword: string
  seniority?: JobEntry['seniority']
  salary?: string
  tiers?: ExperienceTier[]
}

export type ExperienceSpecialisationBlueprint = {
  match: string
  label?: string
  regulated?: boolean
  careerHubPathId?: string
  goals?: Partial<Record<ExperienceTier, string>>
  promotionPath?: string[]
  requirements?: ExperienceRequirement[]
  jobs?: ExperienceJobBlueprint[]
  courses?: CourseEntry[]
  cvImprovements?: CvImprovement[]
  skillsExpected?: string[]
  alternativeRoles?: string[]
  interviewTips?: string[]
  fastestRoute?: string
  ukAdvice?: string[]
  portfolioRequired?: boolean
}

export type ExperienceRoadmapInsights = {
  fastestEntryRoute: string
  longTermPath: string[]
  alternativeRoles: string[]
  interviewPreparation: string[]
  experienceGaps: string[]
  complianceNotes: string[]
  skillsEmployersExpect: string[]
  portfolioRequired: boolean
  dailyActions: string[]
  ukAdvice: string[]
}

export type GeneratedExperienceProfile = {
  id: string
  industryId: ExperienceIndustryId
  specialisationId: string
  label: string
  careerHubPathId: string
  goals: Record<ExperienceTier, string>
  timelines: Record<ExperienceTier, string[]>
  jobs: Record<ExperienceTier, JobEntry[]>
  essentialActions: EssentialAction[]
  outsideUkActions: EssentialAction[]
  courses: CourseEntry[]
  cvImprovements: CvImprovement[]
  missions: Array<{ id: string; label: string; href: string; target?: number }>
  recognitionSummary: string
  skillsExpected: string[]
  insights: ExperienceRoadmapInsights
  regulated: boolean
}
