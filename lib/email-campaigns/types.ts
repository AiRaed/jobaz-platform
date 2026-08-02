export const CAMPAIGN_TYPES = [
  'plan_reminder',
  'job_alert',
  'course_alert',
  'local_opportunity_alert',
  'career_tip',
  'product_update',
] as const

export type CampaignType = (typeof CAMPAIGN_TYPES)[number]

export const CAMPAIGN_STATUSES = ['draft', 'reviewed', 'sent', 'cancelled'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const CONSENT_STATUSES = [
  'allowed',
  'excluded_no_consent',
  'excluded_unsubscribed',
  'excluded_missing_email',
] as const
export type ConsentStatus = (typeof CONSENT_STATUSES)[number]

export const RECIPIENT_STATUSES = [
  'suggested',
  'approved',
  'excluded',
  'sent',
  'failed',
  'skipped',
] as const
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number]

export type UserEmailPreferences = {
  id?: string
  user_id: string | null
  email: string
  marketing_consent: boolean
  job_alerts: boolean
  course_alerts: boolean
  local_opportunity_alerts: boolean
  career_tips: boolean
  plan_reminders: boolean
  product_updates: boolean
  unsubscribed_all: boolean
  consent_source: string | null
  consented_at: string | null
  unsubscribed_at: string | null
}

export type EmailCampaign = {
  id: string
  title: string
  campaign_type: CampaignType
  status: CampaignStatus
  source_type: string | null
  source_id: string | null
  audience_rules: Record<string, unknown>
  ai_summary: string | null
  draft_subject: string | null
  draft_body: string | null
  created_by: string | null
  reviewed_by: string | null
  sent_by: string | null
  created_at: string
  reviewed_at: string | null
  sent_at: string | null
}

export type CampaignRecipient = {
  id: string
  campaign_id: string
  user_id: string | null
  email: string
  match_score: number
  match_reasons: string[]
  consent_status: ConsentStatus
  status: RecipientStatus
  created_at: string
  sent_at: string | null
  /** Display-only enrichment (never full CV) */
  display_name?: string | null
  route?: string | null
  target_role?: string | null
  location?: string | null
}

export type AudienceRules = {
  target_route?: string
  target_role?: string
  location?: string
  experience_level?: string
  user_intent?: string
  source_title?: string
  inactive_days?: number
}

export type MatchCandidate = {
  user_id: string | null
  email: string
  display_name: string | null
  route: string | null
  target_role: string | null
  location: string | null
  match_score: number
  match_reasons: string[]
  consent_status: ConsentStatus
  recommended_action: 'send' | 'do_not_send'
}

export type CampaignDashboardStats = {
  total_campaigns: number
  draft_campaigns: number
  sent_campaigns: number
  users_with_consent: number
  users_unsubscribed: number
  last_campaign_sent_at: string | null
  plan_reminder_sent: number
  alert_emails_sent: number
  email_configured: boolean
  email_config_message: string
  tracking_notes: string[]
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  plan_reminder: 'Saved plan reminder',
  job_alert: 'New job alert',
  course_alert: 'New course alert',
  local_opportunity_alert: 'Local opportunity alert',
  career_tip: 'Career tip / reactivation',
  product_update: 'Manual announcement',
}
