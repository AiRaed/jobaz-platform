/**
 * Structured career profile built adaptively during UK Career Assistant conversations.
 */

export type CareerProfileEducation = {
  level: string | null
  field: string | null
  country: string | null
  graduationYear: string | null
  ukRecognition: 'yes' | 'no' | 'not_sure' | null
}

export type CareerProfileWorkExperience = {
  hasExperience: boolean
  industries: string[]
  roles: string[]
  years: string | null
  responsibilities: string[]
  tools: string[]
  transferableSkills: string[]
}

export type CareerProfileUkReadiness = {
  englishLevel: 'basic' | 'functional' | 'comfortable' | 'fluent' | null
  certifications: string[]
  drivingLicence: boolean | null
  workEligibility: string | null
  location: string | null
}

export type CareerProfilePreferences = {
  preferredIndustry: string | null
  workStyle: string | null
  remote: boolean | null
  physicalWork: boolean | null
  customerFacing: boolean | null
  shiftWork: boolean | null
  salaryGoals: string | null
}

export type CareerProfileCareerDirection = {
  wantsSameField: boolean | null
  wantsCareerChange: boolean | null
  confidenceLevel: 'low' | 'medium' | 'high' | null
  longTermGoal: string | null
  userSegment:
    | 'graduate'
    | 'migrant'
    | 'career_changer'
    | 'unemployed'
    | 'experienced'
    | 'entry_level'
    | 'unknown'
}

export type CareerProfileBarriers = {
  confidence: boolean
  lackOfExperience: boolean
  language: boolean
  unclearDirection: boolean
  missingQualifications: boolean
  interviewFear: boolean
  transport: boolean
  burnout: boolean
}

export type CareerProfileAiInsights = {
  employabilityScore: number
  strongestAreas: string[]
  biggestRisks: string[]
  recommendedPaths: string[]
  recommendedSectors: string[]
  urgencyLevel: 'low' | 'medium' | 'high'
  jobReady: boolean
  realisticSalaryBand: string | null
  missingSkills: string[]
  fastestCertifications: string[]
  easiestEntryRoles: string[]
}

export type CareerProfile = {
  education: CareerProfileEducation
  workExperience: CareerProfileWorkExperience
  ukReadiness: CareerProfileUkReadiness
  preferences: CareerProfilePreferences
  careerDirection: CareerProfileCareerDirection
  barriers: CareerProfileBarriers
  aiInsights: CareerProfileAiInsights
  /** Natural-language memory snippets for dialogue (max ~6) */
  memorySnippets: string[]
  profileCompleteness: number
  lastUpdatedAt: string
}

export type CareerAdvisorToolAction = {
  tool: 'cv_builder' | 'cover_letter' | 'job_finder' | 'interview_coach' | 'build_your_path' | 'writing_review'
  label: string
  href: string
  reason: string
}

export type CareerAdvisorOutputs = {
  careerMatchSummary: string
  recommendedSectors: string[]
  topJobPaths: Array<{ title: string; why: string; salaryBand?: string }>
  jobFinderSearches: string[]
  cvImprovements: string[]
  missingSkills: string[]
  interviewReadinessNote: string
  nextSteps: CareerAdvisorToolAction[]
  referencePhrase: string | null
}

export type AdaptiveFollowUpTrigger = {
  id: string
  priority: number
  hint: string
  matches: (profile: CareerProfile, answers: Record<string, unknown>) => boolean
}
