import type {
  CourseEntry,
  CvImprovement,
  EducationFieldId,
  EducationPathAnswers,
  EssentialAction,
  JobEntry,
  QualificationLevel,
} from '../types'
import type { EducationFieldKnowledge } from '../types'
import type { MissionTemplate } from '../professionProfiles'

export type SectorType =
  | 'regulated_health'
  | 'regulated_professional'
  | 'teaching'
  | 'technology'
  | 'trades'
  | 'creative'
  | 'finance'
  | 'science'
  | 'law'
  | 'construction_professional'
  | 'hospitality'
  | 'social_care'
  | 'logistics'
  | 'public_sector'
  | 'manufacturing'
  | 'property'
  | 'general'

export type RequirementKind =
  | 'licence'
  | 'registration'
  | 'membership'
  | 'certificate'
  | 'compliance'
  | 'portfolio'

export type UkRequirement = {
  id: string
  title: string
  description: string
  href?: string
  kind: RequirementKind
  /** mandatory = critical essential action; recommended = course or secondary action */
  tier: 'mandatory' | 'recommended'
  overseasOnly?: boolean
  ukOnly?: boolean
  whenEnglishLow?: boolean
  whenOpenToCourses?: boolean
}

export type JobBlueprint = {
  title: string
  keyword: string
  seniority?: JobEntry['seniority']
  salary?: string
}

export type SpecialisationBlueprint = {
  /** Exact specialisation id or regex source */
  match: string | RegExp
  regulated?: boolean
  goal?: Partial<Record<QualificationLevel, string>>
  promotionPath?: string[]
  requirements?: UkRequirement[]
  jobs?: Partial<Record<QualificationLevel, JobBlueprint[]>>
  certifications?: Partial<Record<QualificationLevel, CourseEntry[]>>
  cvFocus?: string[]
  alternativeRoles?: string[]
  interviewTips?: string[]
  fastestRoute?: string
  portfolioRequired?: boolean
  forbiddenPatterns?: Partial<Record<QualificationLevel, RegExp>>
}

export type GenerationContext = {
  answers: EducationPathAnswers
  knowledge: EducationFieldKnowledge
  fieldId: EducationFieldId
  specialisationId: string
  label: string
  keyword: string
  sector: SectorType
}

export type CareerRoadmapInsights = {
  fastestEntryRoute: string
  longTermPath: string[]
  alternativeRoles: string[]
  interviewPreparation: string[]
  experienceGaps: string[]
  complianceNotes: string[]
  portfolioRequired: boolean
  dailyActions: string[]
}

export type DynamicProfileBundle = {
  missionsByLevel: Record<QualificationLevel, MissionTemplate[]>
  insights: CareerRoadmapInsights
}
