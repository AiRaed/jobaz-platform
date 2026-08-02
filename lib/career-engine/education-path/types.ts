/** Career Engine Path 1 — Work in my Education */

import type { StructuredCareerRecommendations } from '@/lib/recommendations/types'

export type EducationFieldId =
  | 'engineering'
  | 'healthcare'
  | 'business_finance'
  | 'it'
  | 'education'
  | 'law'
  | 'science'
  | 'creative_arts'
  | 'construction'
  | 'hospitality'
  | 'social_care'
  | 'logistics_transport'
  | 'media_communications'
  | 'public_sector'
  | 'manufacturing'
  | 'property_real_estate'
  | 'other'

export type QualificationOrigin = 'uk' | 'outside_uk'

export type QualificationLevel = 'bachelors' | 'masters' | 'phd'

export type EnglishLevel = 'beginner' | 'basic' | 'intermediate' | 'good' | 'fluent'

export type EducationPathAnswers = {
  education_field: EducationFieldId
  education_specialisation: string
  /** When user selects Other or types a custom degree */
  education_specialisation_other?: string
  qualification_origin: QualificationOrigin
  qualification_level: QualificationLevel
  english_level: EnglishLevel
  open_to_courses: 'yes' | 'no'
  preferred_location: string
}

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
}

export type CvImprovement = {
  id: string
  title: string
  description: string
  href: string
  priority: number
}

export type EducationFieldKnowledge = {
  id: EducationFieldId
  label: string
  goalRole: string
  careerHubPathId: string
  typicalJobs: JobEntry[]
  graduateJobs: JobEntry[]
  professionalRegistration: EssentialAction[]
  qualificationRecognition: {
    requiredForOutsideUk: boolean
    summary: string
    bodies: string[]
  }
  careerProgression: string[]
  recommendedCourses: CourseEntry[]
  professionalCertifications: CourseEntry[]
  essentialSkills: string[]
  commonEmployers: string[]
  transferableRoles: JobEntry[]
  temporaryEntryRoles: JobEntry[]
}

export type EducationPathResult = {
  pathId: 'work_in_education'
  field: EducationFieldId
  fieldLabel: string
  specialisation: string
  specialisationLabel: string
  answers: EducationPathAnswers
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
    current?: number
  }>
  careerReadiness: {
    score: number
    interviewReadiness: 'low' | 'medium' | 'high'
    summary: string
    missing: string[]
  }
  /** Dynamic UK career advisor insights (licences, gaps, fastest route, etc.) */
  careerInsights?: {
    fastestEntryRoute: string
    longTermPath: string[]
    alternativeRoles: string[]
    interviewPreparation: string[]
    experienceGaps: string[]
    complianceNotes: string[]
    portfolioRequired: boolean
    dailyActions: string[]
  }
  location: string
  structuredRecommendations?: StructuredCareerRecommendations
}
