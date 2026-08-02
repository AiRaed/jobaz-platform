/**
 * Career Journey Engine — persistent operating-system state for JobAZ.
 * Frontend-first with localStorage; syncs from UK Career Assistant + dashboard signals.
 */

export type CareerJourneyState =
  | 'exploring'
  | 'discovering'
  | 'preparing'
  | 'building_cv'
  | 'job_ready'
  | 'applying'
  | 'interviewing'
  | 'upskilling'
  | 'working'
  | 'growing'

export type CareerPathTier = 'work_now' | 'build_next' | 'long_term'

export type CareerPathDirection = {
  id: string
  title: string
  why: string[]
  chips?: string[]
  recommendedTraining?: string[]
}

export type CareerPathTriad = {
  workNow: CareerPathDirection[]
  buildNext: CareerPathDirection[]
  longTerm: CareerPathDirection[]
  supportiveSummary?: string
  ladderSummary?: string
}

export type SmartProfileSection = {
  id: string
  label: string
  value: string
  complete: boolean
  improveHref?: string
}

export type CareerIntelligenceProfile = {
  generatedAt: string
  currentSituation: string
  strengths: string[]
  englishConfidence: string
  careerInterests: string[]
  transferableSkills: string[]
  workStyle: string
  ukReadiness: string
  confidenceLevel: string
  suggestedIndustries: string[]
  recommendedFirstSteps: string[]
  sections: SmartProfileSection[]
  pathTriad: CareerPathTriad
  assessmentSummary?: string
}

export type JourneyNextAction = {
  id: string
  title: string
  description: string
  href: string
  priority: 'primary' | 'secondary'
  toolLabel?: string
}

export type CareerJourneySnapshot = {
  state: CareerJourneyState
  stateLabel: string
  stateDescription: string
  readinessScore: number
  profile: CareerIntelligenceProfile | null
  nextActions: JourneyNextAction[]
  updatedAt: string
  hasCompletedAssessment: boolean
}

export type JourneySignalInput = {
  hasAssessment: boolean
  readinessScore: number
  cvQualityScore: number
  hasBaseCv: boolean
  applicationsCount: number
  interviewConfidence: number
  savedJobsCount?: number
  dominantGoal?: string | null
  englishLevel?: string | null
  engagementScore?: number
  weakestArea?: string | null
  hasAcceptedOffer?: boolean
}

export const JOURNEY_STATE_LABELS: Record<CareerJourneyState, string> = {
  exploring: 'Exploring',
  discovering: 'Discovering',
  preparing: 'Preparing',
  building_cv: 'Building CV',
  job_ready: 'Job Ready',
  applying: 'Applying',
  interviewing: 'Interviewing',
  upskilling: 'Upskilling',
  working: 'Working',
  growing: 'Growing',
}

export const JOURNEY_STATE_DESCRIPTIONS: Record<CareerJourneyState, string> = {
  exploring:
    'Discover your direction with JAZ — a guided conversation that maps realistic UK options for you.',
  discovering:
    'You are uncovering what fits. We will layer Work Now, Build Next, and long-term paths — no single label.',
  preparing:
    'Foundation first: clarity, confidence, and the documents that open doors in the UK.',
  building_cv:
    'Your CV is the bridge to interviews. Strengthen it before applying widely.',
  job_ready:
    'You are close. Match your CV to roles and start targeted applications.',
  applying:
    'Keep momentum — track applications, tailor documents, and prepare for replies.',
  interviewing:
    'Interviews are the final hurdle. Practice calm, structured answers — you are ready enough to try.',
  upskilling:
    'Short training now can unlock better roles in 3–6 months. Stay consistent.',
  working:
    'You are earning and building experience. Plan your next step while you grow.',
  growing:
    'Share wins, explore communities, and keep levelling up your career path.',
}
