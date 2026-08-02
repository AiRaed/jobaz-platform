import type { CareerPlanItemStatus } from '@/lib/career-hub/types'

export type TrainingCourseSource =
  | 'career_assistant'
  | 'career_route'
  | 'career_plan'
  | 'saved'
  | 'cv_analysis'
  | 'job_analysis'

export type TrainingItemStatus = CareerPlanItemStatus | 'not_started'

export type TrainingCourseItem = {
  id: string
  slug: string
  name: string
  provider: string
  duration: string
  cost: string
  required: boolean
  recommended: boolean
  careerImpact: string
  icon?: string
  imageUrl?: string
  pathId?: string
  routeLabel?: string
  courseHref: string
  source: TrainingCourseSource
  status: TrainingItemStatus
  priority?: number
  completedAt?: string
  certificateStatus?: 'pending' | 'verified' | 'none'
  unlockedOpportunity?: string
  /** Future: partner / referral */
  referralUrl?: string
  affiliateUrl?: string
  providerId?: string
}

export type TrainingProgressStats = {
  required: number
  inProgress: number
  completed: number
  saved: number
}

export type TrainingUnlockOpportunity = {
  id: string
  trainingName: string
  trainingType: 'licence' | 'course' | 'certification'
  unlocksRole: string
  pathId?: string
  completed: boolean
}

export type TrainingCentreState = {
  hasAssessment: boolean
  pathId: string | null
  routeLabel: string | null
  stats: TrainingProgressStats
  recommended: TrainingCourseItem[]
  plan: TrainingCourseItem[]
  completed: TrainingCourseItem[]
  unlocks: TrainingUnlockOpportunity[]
}
