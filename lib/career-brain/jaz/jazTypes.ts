import type { CareerBrainQuestion } from '../types'

export type JazProfessionTrack =
  | 'education'
  | 'software'
  | 'healthcare'
  | 'creative'
  | 'engineering'
  | 'finance'
  | 'general'

export type JazUnderstanding = {
  jobTitle: string | null
  professionTrack: JazProfessionTrack | null
  yearsExperience: string | null
  currentLevel: string | null
  careerGoal: string | null
  blockers: string[]
  studyWilling: string | null
  devTime: string | null
  leadershipReady: string | null
  employerMobility: string | null
  strengths: string[]
  professionSpecific: Record<string, string | string[]>
  askedIds: string[]
  questionCount: number
  confidence: number
}

export type JazQuestionPick = {
  question: CareerBrainQuestion | null
  reason: string
  confidence: number
  understanding: JazUnderstanding
}
