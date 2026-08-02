export const RELAY_TYPES = [
  'opportunity_enquiry',
  'cv_help',
  'course_question',
  'jobaz_support',
  'business_enquiry',
] as const

export type RelayType = (typeof RELAY_TYPES)[number]

export const RELAY_TYPE_LABELS: Record<RelayType, string> = {
  opportunity_enquiry: 'Opportunity enquiry',
  cv_help: 'CV help',
  course_question: 'Course question',
  jobaz_support: 'JobAZ support',
  business_enquiry: 'Business / work enquiry',
}

export const RELAY_STATUSES = ['open', 'needs_follow_up', 'closed', 'archived'] as const
export type RelayStatus = (typeof RELAY_STATUSES)[number]

export const RELAY_STATUS_LABELS: Record<RelayStatus, string> = {
  open: 'Open',
  needs_follow_up: 'Needs follow-up',
  closed: 'Closed',
  archived: 'Archived',
}

export type RelayThread = {
  id: string
  user_id: string
  type: RelayType
  subject: string
  status: RelayStatus
  body_preview: string | null
  preferred_contact_time: string | null
  related_opportunity_id: string | null
  related_course_id: string | null
  related_job_id: string | null
  related_feed_post_id: string | null
  created_at: string
  updated_at: string
  user_email?: string | null
  message_count?: number
}

export type RelayMessage = {
  id: string
  thread_id: string
  sender_role: 'user' | 'admin' | 'system'
  sender_user_id: string | null
  body: string
  created_at: string
}

export type CreateRelayInput = {
  type: RelayType
  subject: string
  message: string
  preferred_contact_time?: string | null
  related_opportunity_id?: string | null
  related_course_id?: string | null
  related_job_id?: string | null
  related_feed_post_id?: string | null
}
