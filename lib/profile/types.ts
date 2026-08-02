import type { CvData } from '@/app/cv-builder-v2/page'
import type { AiUserProfile } from '@/lib/jobaz-ai/profile/types'

export type ProfileVisibility = 'private' | 'public' | 'recruiter'

export type AvailabilityStatus =
  | 'Open to opportunities'
  | 'Interviewing'
  | 'Private'
  | 'Recruiter visible'

export type ProfilePrivacySettings = {
  hideEmail: boolean
  hidePhone: boolean
  hideLocation: boolean
  anonymousMode: boolean
  recruitersOnly: boolean
}

export type ProfileExtensions = {
  aboutMe: string
  visibility: ProfileVisibility
  username: string
  availabilityStatus: AvailabilityStatus
  careerDirection: string
  avatarUrl: string | null
  linkedinUrl: string
  portfolioUrl: string
  githubUrl: string
  languagesSpoken: string
  privacy: ProfilePrivacySettings
}

export type ProfileMetric = {
  id: string
  label: string
  value: number
  tone: 'violet' | 'emerald' | 'blue' | 'cyan' | 'amber' | 'rose'
  tooltip: string
  improveHint: string
}

export type ProfileStrengthStage =
  | 'Beginner'
  | 'Growing'
  | 'Competitive'
  | 'Recruiter Ready'
  | 'Top Candidate'

export type ProfileStrength = {
  percentage: number
  stage: ProfileStrengthStage
  nextStage: ProfileStrengthStage | null
  completedSections: string[]
  missingSections: string[]
  recommendation: string
  sectionsTotal: number
  sectionsComplete: number
}

export type ToneSignal = {
  label: string
  tone: 'good' | 'neutral' | 'weak'
}

export type AboutToneAnalysis = {
  signals: ToneSignal[]
  summary: string
}

export type ExperienceRoleInsight = {
  id: string
  atsStrength: number
  recruiterImpact: number
  badges: string[]
  detectedStrengths: string[]
}

export type SkillsIntelligence = {
  verified: string[]
  missing: string[]
  recruiterDemanded: string[]
  scanFirst: string[]
  atsKeywordStrength: number
  suggestions: string[]
  roleRelevance: { skill: string; relevance: number }[]
}

export type CareerFocusItem = {
  label: string
  impact: string
}

export type RecruiterImpression = {
  strongestTraits: string[]
  weaknesses: string[]
  confidence: number
  confidenceLabel: string
  shortlistMessage: string
  suggestions: string[]
}

export type ProfileDocumentSummary = {
  id: string
  label: string
  description: string
  href: string
  count?: number
}

export type ProfileActivityItem = {
  id: string
  label: string
  when: string
  type: 'cv' | 'job' | 'application' | 'interview' | 'assessment' | 'profile' | 'general'
}

export type SuggestedCertification = {
  name: string
  reason: string
}

export type ProfileViewModel = {
  displayName: string
  email: string
  location: string
  careerDirection: string
  careerLevel: string
  availabilityStatus: AvailabilityStatus
  avatarUrl: string | null
  extensions: ProfileExtensions
  cvData: CvData | null
  aiProfile: AiUserProfile | null
  metrics: ProfileMetric[]
  profileStrength: ProfileStrength
  aboutTone: AboutToneAnalysis
  experienceInsights: ExperienceRoleInsight[]
  skillsIntelligence: SkillsIntelligence
  careerDna: string[]
  recruiterImpression: RecruiterImpression
  careerFocus: CareerFocusItem[]
  suggestedCertifications: SuggestedCertification[]
  documents: ProfileDocumentSummary[]
  activity: ProfileActivityItem[]
  hasCv: boolean
  isRecruiterVisible: boolean
}
