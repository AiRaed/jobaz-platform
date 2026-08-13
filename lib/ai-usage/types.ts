export const AI_TOOL_CATEGORIES = [
  'cv_builder',
  'cover_letter',
  'writing_review',
  'interview_coach',
  'apply_assistant',
  'jaz_assistant',
  'local_ai',
] as const

export type AiToolCategory = (typeof AI_TOOL_CATEGORIES)[number]

export type AiLimitReason =
  | 'guest_limit'
  | 'daily_limit'
  | 'admin_unlimited'
  | 'login_required'

export type AiUsageCheckResult = {
  allowed: boolean
  reason?: AiLimitReason
  remaining?: number
  resetAt?: string
  userId?: string | null
  anonymousId?: string | null
}

export const GUEST_LIMIT_PER_CATEGORY = 1
export const LOGGED_IN_DAILY_LIMIT_PER_CATEGORY = 2
export const APPLY_ASSISTANT_DAILY_LIMIT = 1

export const AI_LIMIT_ERROR = 'AI_LIMIT_REACHED'

export const AI_LIMIT_MESSAGES = {
  guest:
    'Create a free account to continue using AI tools.',
  daily:
    'You’ve used today’s free AI limit for this tool. Try again tomorrow. Premium AI credits are coming soon.',
  apply:
    'Apply Assistant is limited during the beta launch.',
} as const

export const GUEST_COOKIE_NAME = 'jobaz_ai_anon'
