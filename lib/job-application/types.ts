export type WorkflowStepStatus = 'complete' | 'active' | 'locked' | 'recommended'

export type WorkflowStep = {
  id: 'cv' | 'cover' | 'apply' | 'interview'
  label: string
  status: WorkflowStepStatus
  hint: string
}

export type SkillGap = {
  skill: string
  learnHint: string
  interviewTip: string
  cvTip: string
}

export type SmartNextStep = {
  title: string
  description: string
  reason: string
  roleRequirements: string[]
  cvGaps: string[]
  ctaLabel: string
  ctaType: 'optimize-cv' | 'improve-match' | 'apply' | 'interview' | 'cover'
}

export type RecruiterInsight = {
  applicationStrength: number
  strengths: string[]
  weaknesses: string[]
  hiringRisk: 'Low' | 'Medium' | 'High'
  missingKeywords: string[]
  missingSkills: string[]
  confidenceScore: number
}

export type ApplicationDimensions = {
  cvQuality: number
  atsMatch: number
  coverLetter: number | null
  interviewReadiness: number
}

export type ScoreExplanation = {
  summary: string
  gaps: string[]
  roleRequirements: string[]
  cvGaps: string[]
}

export type ApplicationAnalysis = {
  applicationStrength: number
  dimensions: ApplicationDimensions
  recruiterInsight: RecruiterInsight
  scoreExplanation: ScoreExplanation
  skillGaps: SkillGap[]
  smartNextStep: SmartNextStep
  workflowSteps: WorkflowStep[]
}

export type ApplicationPrepStatus = {
  cvStatus: 'not-tailored' | 'ready'
  coverStatus: 'not-created' | 'ready'
  applicationStatus: 'not-submitted' | 'submitted'
  trainingStatus: 'not-available' | 'available'
}

export type ApplicationAnalysisInput = {
  job: { title: string; company?: string; description?: string }
  cvSummary: string
  coverLetterText: string
  cvSkills?: string[]
  statuses: ApplicationPrepStatus
  /** Optional AI enrichment from apply-assistant */
  aiFitScore?: number
  aiStrengths?: string[]
  aiWeaknesses?: string[]
  aiMissingSkills?: string[]
  aiKeywords?: string[]
}

export type ScoreDelta = {
  label: string
  delta: number
}
