import type { SupabaseClient } from '@supabase/supabase-js'
import type { CampaignType, ConsentStatus, UserEmailPreferences } from './types'

export async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  return !/does not exist|relation|schema cache/i.test(error.message || '')
}

export function emptyPrefs(email: string, userId?: string | null): UserEmailPreferences {
  return {
    user_id: userId ?? null,
    email: email.trim().toLowerCase(),
    marketing_consent: false,
    job_alerts: false,
    course_alerts: false,
    local_opportunity_alerts: false,
    career_tips: false,
    plan_reminders: true,
    product_updates: false,
    unsubscribed_all: false,
    consent_source: null,
    consented_at: null,
    unsubscribed_at: null,
  }
}

export function mapPrefsRow(row: Record<string, unknown>): UserEmailPreferences {
  return {
    id: row.id ? String(row.id) : undefined,
    user_id: row.user_id ? String(row.user_id) : null,
    email: String(row.email || '').toLowerCase(),
    marketing_consent: Boolean(row.marketing_consent),
    job_alerts: Boolean(row.job_alerts),
    course_alerts: Boolean(row.course_alerts),
    local_opportunity_alerts: Boolean(row.local_opportunity_alerts),
    career_tips: Boolean(row.career_tips),
    plan_reminders: row.plan_reminders !== false,
    product_updates: Boolean(row.product_updates),
    unsubscribed_all: Boolean(row.unsubscribed_all),
    consent_source: row.consent_source ? String(row.consent_source) : null,
    consented_at: row.consented_at ? String(row.consented_at) : null,
    unsubscribed_at: row.unsubscribed_at ? String(row.unsubscribed_at) : null,
  }
}

/** Preference required for each campaign type (marketing types need marketing_consent OR the specific alert). */
export function consentStatusForCampaign(
  prefs: UserEmailPreferences | null,
  type: CampaignType,
  email?: string | null
): ConsentStatus {
  if (!email?.trim()) return 'excluded_missing_email'
  if (!prefs) return 'excluded_no_consent'
  if (prefs.unsubscribed_all || prefs.unsubscribed_at) return 'excluded_unsubscribed'

  if (type === 'plan_reminder') {
    return prefs.plan_reminders ? 'allowed' : 'excluded_no_consent'
  }

  // Marketing-style campaigns
  const hasChannel =
    (type === 'job_alert' && prefs.job_alerts) ||
    (type === 'course_alert' && prefs.course_alerts) ||
    (type === 'local_opportunity_alert' && prefs.local_opportunity_alerts) ||
    (type === 'career_tip' && prefs.career_tips) ||
    (type === 'product_update' && prefs.product_updates) ||
    prefs.marketing_consent

  return hasChannel ? 'allowed' : 'excluded_no_consent'
}

export async function loadUserPrefsMap(
  supabase: SupabaseClient,
  emails: string[]
): Promise<{
  byEmail: Map<string, UserEmailPreferences>
  byUserId: Map<string, UserEmailPreferences>
  available: boolean
}> {
  const byEmail = new Map<string, UserEmailPreferences>()
  const byUserId = new Map<string, UserEmailPreferences>()

  if (!(await tableExists(supabase, 'user_email_preferences'))) {
    // Fallback: email_preferences.marketing_allowed
    if (await tableExists(supabase, 'email_preferences')) {
      const { data } = await supabase
        .from('email_preferences')
        .select('user_id, email, marketing_allowed, unsubscribed_at')
        .limit(2000)
      for (const raw of data ?? []) {
        const row = raw as Record<string, unknown>
        const email = String(row.email || '').toLowerCase()
        if (!email) continue
        const prefs = emptyPrefs(email, row.user_id ? String(row.user_id) : null)
        prefs.marketing_consent = Boolean(row.marketing_allowed) && !row.unsubscribed_at
        prefs.job_alerts = prefs.marketing_consent
        prefs.course_alerts = prefs.marketing_consent
        prefs.local_opportunity_alerts = prefs.marketing_consent
        prefs.career_tips = prefs.marketing_consent
        prefs.product_updates = prefs.marketing_consent
        prefs.unsubscribed_all = Boolean(row.unsubscribed_at)
        prefs.unsubscribed_at = row.unsubscribed_at ? String(row.unsubscribed_at) : null
        byEmail.set(email, prefs)
        if (prefs.user_id) byUserId.set(prefs.user_id, prefs)
      }
      return { byEmail, byUserId, available: true }
    }
    return { byEmail, byUserId, available: false }
  }

  let query = supabase.from('user_email_preferences').select('*').limit(3000)
  if (emails.length > 0 && emails.length < 400) {
    query = query.in(
      'email',
      emails.map((e) => e.toLowerCase())
    )
  }
  const { data } = await query
  for (const raw of data ?? []) {
    const prefs = mapPrefsRow(raw as Record<string, unknown>)
    if (prefs.email) byEmail.set(prefs.email, prefs)
    if (prefs.user_id) byUserId.set(prefs.user_id, prefs)
  }
  return { byEmail, byUserId, available: true }
}

/** Sync legacy email_preferences.marketing_allowed when granular prefs change. */
export async function syncLegacyMarketingFlag(
  supabase: SupabaseClient,
  email: string,
  marketingAllowed: boolean,
  userId?: string | null
): Promise<void> {
  if (!(await tableExists(supabase, 'email_preferences'))) return
  const normalized = email.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('email_preferences')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('email_preferences')
      .update({
        marketing_allowed: marketingAllowed,
        unsubscribed_at: marketingAllowed ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      })
      .eq('email', normalized)
  } else {
    await supabase.from('email_preferences').insert({
      email: normalized,
      user_id: userId || null,
      marketing_allowed: marketingAllowed,
      service_emails_allowed: true,
      unsubscribed_at: marketingAllowed ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}
