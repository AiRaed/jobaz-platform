import type { CareerPath } from '@/lib/career-paths'

export type MetricLevel = 'low' | 'medium' | 'high' | 'yes' | 'no'

export type RealityMetric = {
  id: string
  label: string
  level: MetricLevel
  display: string
}

export type TimelineStep = {
  period: string
  milestone: string
}

export type SalaryInfo = {
  starting: string
  experienced: string
  note?: string
  levels?: { label: string; range: string }[]
}

export type MatchSignal = {
  type: 'positive' | 'warning' | 'neutral'
  text: string
}

export type PathMatch = {
  score: number
  signals: MatchSignal[]
  readinessRange: string
  hasPersonalization: boolean
}

export type FeedOpportunity = {
  id: string
  type: 'course' | 'event' | 'story' | 'funding'
  title: string
  subtitle?: string
  location?: string
  timeAgo?: string
}

export type GuideInsight = {
  text: string
}

export type QuickQuestion = {
  question: string
  answer: string
}

export type PathIntelligence = {
  salary: SalaryInfo
  timeline: TimelineStep[]
  relatedPathIds: string[]
  peopleLikeYouStarts: string[]
  realityMetrics: RealityMetric[]
  feedOpportunities: FeedOpportunity[]
  guideInsights: GuideInsight[]
  quickQuestions: QuickQuestion[]
}

export type UserPathProfile = {
  isLoggedIn: boolean
  hasAssessment: boolean
  multilingual: boolean
  strongEnglish: boolean
  hasUkCertification: boolean
  communicationSkills: boolean
  newcomer: boolean
}
