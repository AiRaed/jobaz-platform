/**
 * JAZ Business Discovery Engine — types.
 */

import type { CareerBrainQuestion } from '../types'

export type BusinessDirection =
  | 'barber'
  | 'cleaning'
  | 'software'
  | 'driver'
  | 'food'
  | 'trades'
  | 'consultancy'
  | 'retail'
  | 'ecommerce'
  | 'tutoring'
  | 'care'
  | 'general'

export type BusinessVerdict = 'Strong Potential' | 'Moderate Potential' | 'Weak Potential'

export type StartupDifficulty = 'Low' | 'Moderate' | 'High'

export type BusinessRiskLevel = 'Low' | 'Medium' | 'High'

export type BusinessRiskItem = {
  level: BusinessRiskLevel
  reason: string
}

export type BusinessRiskAnalysis = {
  cashFlowRisk: BusinessRiskItem
  customerAcquisitionRisk: BusinessRiskItem
  competitionRisk: BusinessRiskItem
  regulatoryRisk: BusinessRiskItem
}

export type BusinessWeekPlan = {
  week: string
  actions: string[]
}

export type BusinessScoreBreakdownItem = {
  label: string
  points: number
}

export type BusinessRoadmap = {
  workNow: string
  buildNext: string
  longTermGoal: string
}

export type BusinessDiscoveryUnderstanding = {
  routingGoal: string | null
  intent: string | null
  businessIdea: string | null
  industryField: string | null
  skills: string[]
  experienceLevel: string | null
  capital: string | null
  timePerWeek: string | null
  incomeExpectation: string | null
  riskTolerance: string | null
  hasNetwork: string | null
  assets: string[]
  direction: BusinessDirection
  specialized: Record<string, string | string[]>
  askedIds: string[]
  questionCount: number
  confidence: number
}

export type BusinessDiscoveryQuestionPick = {
  question: CareerBrainQuestion | null
  reason: string
  confidence: number
  understanding: BusinessDiscoveryUnderstanding
}

export type BusinessModelRecommendation = {
  id: string
  title: string
  why: string
  startupCost: string
  timeToRevenue: string
  revenuePotential: string
  confidence: 'High' | 'Moderate' | 'Lower'
  type: 'primary' | 'alternative' | 'rejected'
}

export type BusinessDiscoveryFinalReport = {
  businessIdeaLabel: string
  ideaViability: BusinessVerdict
  ideaViabilityExplanation: string
  businessVerdict: BusinessVerdict
  verdictExplanation: string
  whyThisVerdict: string
  businessPotentialScore: number
  scoreBreakdown: BusinessScoreBreakdownItem[]
  startupDifficulty: StartupDifficulty
  startupDifficultyExplanation: string
  financialRequirements: string[]
  operationalRequirements: string[]
  fastestValidationPath: string
  opportunitySummary: string
  existingAdvantages: string[]
  majorRisks: string[]
  advantages: string[]
  challenges: string[]
  mostRealisticModel: BusinessModelRecommendation
  alternativeModels: BusinessModelRecommendation[]
  avoidInitially?: string
  roadmap: BusinessRoadmap
  estimatedStartupCost: string
  estimatedTimeToFirstRevenue: string
  ukRequirements: string[]
  revenuePotential: {
    first3Months: string
    months6to12: string
    longerTerm: string
  }
  first30DaysPlan: string[]
  first30DaysWeeks: BusinessWeekPlan[]
  first90DaysPlan: string[]
  growthPath: string[]
  riskAnalysis: BusinessRiskAnalysis
  bestNextAction: string
  confidenceScore: number
  confidenceExplanation: string
  notBusinessRecommendation?: string
}

export type BusinessDiscoveryGrowthOutput = {
  summary: string
  confidence: number
  finalReport: BusinessDiscoveryFinalReport
  recommendedJobAZActions: Array<{ action: string; label: string; href?: string }>
}
