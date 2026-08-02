/**
 * AI Career Path Finder tracking — thin wrappers over JobAZ AI Memory.
 */

import { trackAiCareerEvent } from '@/lib/jobaz-ai/memory'
import type { AiCareerEventMetadata } from '@/lib/jobaz-ai/memory'

export function trackAiPathPageViewed(): void {
  void trackAiCareerEvent('ai_path_page_viewed')
}

export function trackAiPathStarted(): void {
  void trackAiCareerEvent('ai_path_started', { current_step: 1 })
}

export function trackAiPathQuestionAnswered(metadata: {
  current_step: number
  question_id: string
  selected_answer: string
}): void {
  void trackAiCareerEvent('ai_path_question_answered', metadata)
}

export function trackAiPathCompleted(metadata?: AiCareerEventMetadata): void {
  void trackAiCareerEvent('ai_path_completed', metadata ?? {})
}

export function trackAiPathResultViewed(metadata?: AiCareerEventMetadata): void {
  void trackAiCareerEvent('ai_path_result_viewed', metadata ?? {})
}

export function trackAiPathSignupClicked(source?: string): void {
  void trackAiCareerEvent('ai_path_signup_clicked', {
    source: source ?? 'ai_career_path_finder',
    destination: '/signup',
  })
}

export function trackAiPathToolClicked(metadata: {
  tool_id: string
  tool_name: string
  destination: string
  recommended_path?: string
}): void {
  void trackAiCareerEvent('ai_path_tool_clicked', metadata)
}

export function trackAiPathRestartClicked(metadata?: AiCareerEventMetadata): void {
  void trackAiCareerEvent('ai_path_restart_clicked', metadata ?? {})
  void import('@/lib/jobaz-ai/profile/progression').then(({ triggerProfileProgression }) =>
    triggerProfileProgression('flow_abandoned', {
      dedupeId: metadata?.recommended_path ?? 'restart',
    })
  )
}
