/**
 * JobAZ AI Memory — shared types for career path tracking and assessments.
 */

export const AI_CAREER_SOURCE = 'ai_career_path_finder' as const
export const UK_CAREER_ASSISTANT_SOURCE = 'uk_career_assistant' as const

export const AI_CAREER_PAGE = '/uk-career-assistant' as const

export type AiCareerEventName =
  | 'ai_path_page_viewed'
  | 'ai_path_started'
  | 'ai_path_question_answered'
  | 'ai_path_completed'
  | 'ai_path_result_viewed'
  | 'ai_path_signup_clicked'
  | 'ai_path_tool_clicked'
  | 'ai_path_restart_clicked'
  | 'uk_career_assistant_completed'
  | 'uk_career_assistant_started'

export type AiCareerEventMetadata = {
  source?: string
  current_step?: number
  question_id?: string
  selected_answer?: string
  recommended_path?: string
  tool_name?: string
  tool_id?: string
  destination?: string
  [key: string]: unknown
}
