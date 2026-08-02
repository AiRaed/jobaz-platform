/**
 * JAZ Side Income Intelligence — types.
 */

import type { CareerBrainQuestion } from '../types'

export type SideIncomeEmployment =
  | 'employed_full'
  | 'employed_part'
  | 'unemployed'
  | 'student'
  | 'self_employed'

export type SideIncomeUnderstanding = {
  employment: string | null
  monthlyGoal: string | null
  hoursPerWeek: string | null
  schedule: string | null
  mainField: string | null
  skills: string[]
  assets: string[]
  workStyle: {
    physicalVsDesk: string | null
    homeVsOutside: string | null
    peopleVsIndependent: string | null
    scheduleFlex: string | null
  }
  riskTolerance: string | null
  incomeTimeline: string | null
  teachingExperience: boolean
  professionalField: string | null
  hasCar: boolean
  hasComputer: boolean
  hasHomeWorkspace: boolean
  hasCapital: boolean
  hasDrivingLicence: boolean
  askedIds: string[]
  questionCount: number
  confidence: number
}

export type SideIncomeQuestionPick = {
  question: CareerBrainQuestion | null
  reason: string
  confidence: number
  understanding: SideIncomeUnderstanding
}

export type SideIncomeOpportunity = {
  id: string
  title: string
  why: string
  incomeRange: string
  confidence: 'High' | 'Moderate' | 'Lower'
  category: 'fastest' | 'flexible' | 'highest_potential'
}

export type SideIncomeFinalReport = {
  incomeProfileSummary: string
  availableAssetsAnalysis: string[]
  incomeBarriers: string[]
  fastestIncomeOption: SideIncomeOpportunity | null
  mostFlexibleOption: SideIncomeOpportunity | null
  highestPotentialOption: SideIncomeOpportunity | null
  recommendedSkillsToIncreaseEarnings: string[]
  expectedIncomeRanges: string
  actionPlan: string[]
  allOpportunities: SideIncomeOpportunity[]
}

export type SideIncomeGrowthOutput = {
  summary: string
  confidence: number
  finalReport: SideIncomeFinalReport
  recommendedJobAZActions: Array<{ action: string; label: string; href?: string }>
}
