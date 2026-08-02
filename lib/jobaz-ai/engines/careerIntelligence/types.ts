/**
 * Unified career intelligence types — UK Career Assistant + AI Career Path backend.
 */

import type { AiPersonalizedAssessmentResult } from '@/lib/jobaz-ai/assessment/types'
import type { AssessmentAnswers, CareerAssessmentResult } from '@/lib/jobaz-ai/types'

export type UkCareerDirection = {
  direction_id: string
  direction_title: string
  why: string[]
  chips?: string[]
}

export type UkCareerRuleResult = {
  summary: string
  work_now: { directions: UkCareerDirection[] }
  improve_later: { directions: UkCareerDirection[] } | null
  avoid: string[]
  next_step:
    | string
    | {
        action: 'CREATE_CV' | 'JOB_FINDER' | 'BUILD_YOUR_PATH'
        label: string
        href?: string
      }
}

export type AiFollowUpQuestion = {
  id: string
  text: string
  type: 'single'
  options: Array<{ value: string; label: string }>
  triggerId: string
  allow_free_text?: boolean
}

export type AiPersonalizedUkResult = AiPersonalizedAssessmentResult & {
  toolsExplanation?: string
  careerStageNote?: string
}

export type UnifiedAssessmentType = 'uk_career_assistant' | 'ai_career_path_wizard'

/** Stored in ai_career_assessments.result — backwards compatible with StoredCareerAssessmentResult. */
export type UnifiedStoredAssessmentResult = {
  assessment_type: UnifiedAssessmentType
  rule_result: UkCareerRuleResult | CareerAssessmentResult
  ai_personalized_result?: AiPersonalizedUkResult | AiPersonalizedAssessmentResult | null
  follow_up_context?: {
    askedFollowUpIds?: string[]
    followUpAnswers?: Record<string, string>
  }
  uk_state?: {
    path?: string | null
    phase?: string
    answers?: Record<string, unknown>
    career_profile?: import('@/lib/jobaz-ai/engines/careerAdvisor/types').CareerProfile
  }
  career_advisor_outputs?: import('@/lib/jobaz-ai/engines/careerAdvisor/types').CareerAdvisorOutputs
  progression_meta?: Record<string, unknown>
}

export type UkCareerAssistantState = {
  path?: string | null
  phase?: string
  answers?: Record<string, unknown>
  ai_follow_up_ids?: string[]
  career_profile?: import('@/lib/jobaz-ai/engines/careerAdvisor/types').CareerProfile
  [key: string]: unknown
}

export function isUkCareerRuleResult(value: unknown): value is UkCareerRuleResult {
  if (!value || typeof value !== 'object') return false
  const r = value as UkCareerRuleResult
  return typeof r.summary === 'string' && Array.isArray(r.avoid) && Boolean(r.work_now)
}

export function isUnifiedStoredResult(value: unknown): value is UnifiedStoredAssessmentResult {
  if (!value || typeof value !== 'object') return false
  return 'assessment_type' in value && 'rule_result' in value
}

export type PartialProfileContext = {
  readinessScore?: number
  engagementScore?: number
  strongestArea?: string
  weakestArea?: string
  dominantGoal?: string | null
  assessmentCount?: number
}

export type { AssessmentAnswers, CareerAssessmentResult }
