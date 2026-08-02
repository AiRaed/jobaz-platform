import { createServerSupabaseClient } from '@/lib/supabase'
import { getEmailConfigStatus } from '@/lib/email'
import { tableExists } from './preferences'
import type {
  CampaignDashboardStats,
  CampaignRecipient,
  CampaignStatus,
  CampaignType,
  EmailCampaign,
} from './types'

export function getCampaignsSupabase() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export function mapCampaign(row: Record<string, unknown>): EmailCampaign {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    campaign_type: row.campaign_type as CampaignType,
    status: (row.status as CampaignStatus) || 'draft',
    source_type: row.source_type ? String(row.source_type) : null,
    source_id: row.source_id ? String(row.source_id) : null,
    audience_rules:
      row.audience_rules && typeof row.audience_rules === 'object'
        ? (row.audience_rules as Record<string, unknown>)
        : {},
    ai_summary: row.ai_summary ? String(row.ai_summary) : null,
    draft_subject: row.draft_subject ? String(row.draft_subject) : null,
    draft_body: row.draft_body ? String(row.draft_body) : null,
    created_by: row.created_by ? String(row.created_by) : null,
    reviewed_by: row.reviewed_by ? String(row.reviewed_by) : null,
    sent_by: row.sent_by ? String(row.sent_by) : null,
    created_at: String(row.created_at || ''),
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    sent_at: row.sent_at ? String(row.sent_at) : null,
  }
}

export function mapRecipient(row: Record<string, unknown>): CampaignRecipient {
  const reasons = row.match_reasons
  return {
    id: String(row.id),
    campaign_id: String(row.campaign_id),
    user_id: row.user_id ? String(row.user_id) : null,
    email: String(row.email || ''),
    match_score: Number(row.match_score || 0),
    match_reasons: Array.isArray(reasons)
      ? reasons.map(String)
      : typeof reasons === 'string'
        ? [reasons]
        : [],
    consent_status: row.consent_status as CampaignRecipient['consent_status'],
    status: row.status as CampaignRecipient['status'],
    created_at: String(row.created_at || ''),
    sent_at: row.sent_at ? String(row.sent_at) : null,
  }
}

export async function getCampaignDashboardStats(): Promise<CampaignDashboardStats> {
  const emailStatus = getEmailConfigStatus()
  const empty: CampaignDashboardStats = {
    total_campaigns: 0,
    draft_campaigns: 0,
    sent_campaigns: 0,
    users_with_consent: 0,
    users_unsubscribed: 0,
    last_campaign_sent_at: null,
    plan_reminder_sent: 0,
    alert_emails_sent: 0,
    email_configured: emailStatus.configured,
    email_config_message: emailStatus.message,
    tracking_notes: [],
  }

  const supabase = getCampaignsSupabase()
  if (!supabase) {
    empty.tracking_notes.push('Supabase service role not configured')
    return empty
  }

  if (!(await tableExists(supabase, 'email_campaigns'))) {
    empty.tracking_notes.push('email_campaigns: Not tracked yet — run migration')
    return empty
  }

  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('id, status, campaign_type, sent_at')
    .limit(500)

  const list = campaigns ?? []
  empty.total_campaigns = list.length
  empty.draft_campaigns = list.filter((c) => c.status === 'draft').length
  empty.sent_campaigns = list.filter((c) => c.status === 'sent').length
  const sentDates = list
    .map((c) => c.sent_at)
    .filter(Boolean)
    .map(String)
    .sort()
    .reverse()
  empty.last_campaign_sent_at = sentDates[0] ?? null
  empty.plan_reminder_sent = list.filter(
    (c) => c.campaign_type === 'plan_reminder' && c.status === 'sent'
  ).length
  empty.alert_emails_sent = list.filter(
    (c) =>
      c.status === 'sent' &&
      ['job_alert', 'course_alert', 'local_opportunity_alert'].includes(String(c.campaign_type))
  ).length

  if (await tableExists(supabase, 'user_email_preferences')) {
    const { count: consentCount } = await supabase
      .from('user_email_preferences')
      .select('id', { count: 'exact', head: true })
      .eq('marketing_consent', true)
      .eq('unsubscribed_all', false)
    const { count: unsubCount } = await supabase
      .from('user_email_preferences')
      .select('id', { count: 'exact', head: true })
      .eq('unsubscribed_all', true)
    empty.users_with_consent = consentCount ?? 0
    empty.users_unsubscribed = unsubCount ?? 0
  } else if (await tableExists(supabase, 'email_preferences')) {
    const { count: consentCount } = await supabase
      .from('email_preferences')
      .select('id', { count: 'exact', head: true })
      .eq('marketing_allowed', true)
      .is('unsubscribed_at', null)
    const { count: unsubCount } = await supabase
      .from('email_preferences')
      .select('id', { count: 'exact', head: true })
      .not('unsubscribed_at', 'is', null)
    empty.users_with_consent = consentCount ?? 0
    empty.users_unsubscribed = unsubCount ?? 0
    empty.tracking_notes.push('Using legacy email_preferences for consent counts')
  } else {
    empty.tracking_notes.push('Email preferences: Not tracked yet')
  }

  return empty
}
