/**
 * JobAZ application email sender — server-only.
 * Does not replace Supabase Auth confirmation/reset emails.
 */

import { randomBytes } from 'crypto'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { getEmailConfigStatus, getResendClient } from './resendClient'
import {
  buildEmailTemplate,
  getTemplateMeta,
  type EmailTemplateKey,
  type EmailType,
  type TemplateContext,
} from './templates'

export type SendEmailInput = {
  to: string
  templateKey: EmailTemplateKey
  context?: TemplateContext
  userId?: string | null
  /** Override subject for admin_custom */
  subject?: string
  /** Override body for admin_custom */
  customMessage?: string
  /** Force email type; otherwise taken from template */
  emailType?: EmailType
  createInAppNotification?: boolean
}

export type SendEmailResult = {
  ok: boolean
  configured: boolean
  status: 'sent' | 'blocked' | 'failed' | 'not_configured'
  message: string
  providerMessageId?: string | null
  logId?: string | null
  preview?: { subject: string; html: string; text: string; emailType: EmailType }
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'https://jobaz.co.uk'
  )
}

async function ensurePreferenceRow(params: {
  userId?: string | null
  email: string
}): Promise<{
  marketingAllowed: boolean
  serviceAllowed: boolean
  unsubscribeToken: string | null
}> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { marketingAllowed: false, serviceAllowed: true, unsubscribeToken: null }
  }

  const email = params.email.trim().toLowerCase()
  const { data: existing } = await supabase
    .from('email_preferences')
    .select(
      'id, marketing_allowed, service_emails_allowed, unsubscribe_token, unsubscribed_at'
    )
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    const row = existing as Record<string, unknown>
    const unsubscribed = Boolean(row.unsubscribed_at)
    return {
      marketingAllowed: !unsubscribed && Boolean(row.marketing_allowed),
      serviceAllowed: row.service_emails_allowed !== false,
      unsubscribeToken: row.unsubscribe_token ? String(row.unsubscribe_token) : null,
    }
  }

  const token = randomBytes(24).toString('hex')
  const { data: inserted, error } = await supabase
    .from('email_preferences')
    .insert({
      user_id: params.userId || null,
      email,
      marketing_allowed: false,
      service_emails_allowed: true,
      unsubscribe_token: token,
      updated_at: new Date().toISOString(),
    })
    .select('marketing_allowed, service_emails_allowed, unsubscribe_token')
    .maybeSingle()

  if (error || !inserted) {
    // Table may be missing — fail open for service, closed for marketing
    return { marketingAllowed: false, serviceAllowed: true, unsubscribeToken: token }
  }

  const row = inserted as Record<string, unknown>
  return {
    marketingAllowed: Boolean(row.marketing_allowed),
    serviceAllowed: row.service_emails_allowed !== false,
    unsubscribeToken: row.unsubscribe_token ? String(row.unsubscribe_token) : token,
  }
}

async function writeLog(params: {
  userId?: string | null
  toEmail: string
  subject: string
  templateKey: string
  emailType: EmailType
  status: string
  providerMessageId?: string | null
  errorMessage?: string | null
  sentAt?: string | null
}): Promise<string | null> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('email_logs')
    .insert({
      user_id: params.userId || null,
      to_email: params.toEmail,
      subject: params.subject,
      template_key: params.templateKey,
      email_type: params.emailType,
      provider: 'resend',
      status: params.status,
      provider_message_id: params.providerMessageId || null,
      error_message: params.errorMessage || null,
      sent_at: params.sentAt || null,
    })
    .select('id')
    .maybeSingle()
  if (error) return null
  return data?.id ? String(data.id) : null
}

async function createNotification(params: {
  userId: string
  title: string
  message: string
  type: string
  relatedUrl?: string | null
}): Promise<void> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return
  try {
    await supabase.from('user_notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      status: 'unread',
      related_url: params.relatedUrl || null,
    })
  } catch {
    // Table may be missing — email send still succeeds
  }
}

export function previewEmail(input: {
  templateKey: EmailTemplateKey
  context?: TemplateContext
  subject?: string
  customMessage?: string
}): { subject: string; html: string; text: string; emailType: EmailType } {
  const ctx: TemplateContext = {
    ...(input.context || {}),
    customSubject: input.subject || input.context?.customSubject,
    customMessage: input.customMessage || input.context?.customMessage,
  }
  const built = buildEmailTemplate(input.templateKey, ctx)
  return {
    subject: built.subject,
    html: built.html,
    text: built.text,
    emailType: built.emailType,
  }
}

export async function sendJobazEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = String(input.to || '').trim().toLowerCase()
  if (!to || !to.includes('@')) {
    return {
      ok: false,
      configured: true,
      status: 'failed',
      message: 'A valid recipient email is required.',
    }
  }

  const config = getEmailConfigStatus()
  const meta = getTemplateMeta(input.templateKey)
  const emailType = input.emailType || meta.emailType

  const prefs = await ensurePreferenceRow({
    userId: input.userId,
    email: to,
  })

  const unsubscribeUrl = prefs.unsubscribeToken
    ? `${siteOrigin()}/api/email/unsubscribe?token=${encodeURIComponent(prefs.unsubscribeToken)}`
    : null

  const ctx: TemplateContext = {
    ...(input.context || {}),
    customSubject: input.subject || input.context?.customSubject,
    customMessage: input.customMessage || input.context?.customMessage,
    unsubscribeUrl,
    homeUrl: input.context?.homeUrl || siteOrigin(),
    planUrl: input.context?.planUrl || `${siteOrigin()}/dashboard`,
    cvUrl: input.context?.cvUrl || `${siteOrigin()}/cv-builder-v2`,
    coursesUrl: input.context?.coursesUrl || `${siteOrigin()}/career-hub`,
  }

  const built = buildEmailTemplate(input.templateKey, ctx)
  const preview = {
    subject: built.subject,
    html: built.html,
    text: built.text,
    emailType,
  }

  if (!config.configured) {
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'not_configured',
      errorMessage: config.message,
    })
    return {
      ok: false,
      configured: false,
      status: 'not_configured',
      message: config.message,
      logId,
      preview,
    }
  }

  if (emailType === 'marketing' && !prefs.marketingAllowed) {
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'blocked',
      errorMessage: 'marketing_allowed=false',
    })
    return {
      ok: false,
      configured: true,
      status: 'blocked',
      message:
        'Marketing email blocked — this address has not opted in to marketing emails (marketing_allowed=false).',
      logId,
      preview,
    }
  }

  if (emailType === 'service' && !prefs.serviceAllowed) {
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'blocked',
      errorMessage: 'service_emails_allowed=false',
    })
    return {
      ok: false,
      configured: true,
      status: 'blocked',
      message: 'Service email blocked by user preference.',
      logId,
      preview,
    }
  }

  const resend = getResendClient()
  if (!resend || !config.from) {
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'not_configured',
      errorMessage: 'Email sending is not configured yet.',
    })
    return {
      ok: false,
      configured: false,
      status: 'not_configured',
      message: 'Email sending is not configured yet.',
      logId,
      preview,
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: [to],
      subject: built.subject,
      html: built.html,
      text: built.text,
      ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    })

    if (error) {
      const logId = await writeLog({
        userId: input.userId,
        toEmail: to,
        subject: built.subject,
        templateKey: built.templateKey,
        emailType,
        status: 'failed',
        errorMessage: error.message,
      })
      return {
        ok: false,
        configured: true,
        status: 'failed',
        message: error.message || 'Resend send failed',
        logId,
        preview,
      }
    }

    const providerMessageId = data?.id || null
    const sentAt = new Date().toISOString()
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'sent',
      providerMessageId,
      sentAt,
    })

    if (input.createInAppNotification !== false && input.userId) {
      await createNotification({
        userId: input.userId,
        title: built.subject,
        message: `Email sent: ${built.templateKey}`,
        type: `email_${built.templateKey}`,
        relatedUrl: ctx.planUrl || null,
      })
    }

    return {
      ok: true,
      configured: true,
      status: 'sent',
      message: 'Email sent',
      providerMessageId,
      logId,
      preview,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Email send failed'
    const logId = await writeLog({
      userId: input.userId,
      toEmail: to,
      subject: built.subject,
      templateKey: built.templateKey,
      emailType,
      status: 'failed',
      errorMessage: msg,
    })
    return {
      ok: false,
      configured: true,
      status: 'failed',
      message: msg,
      logId,
      preview,
    }
  }
}

export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, message: 'Email preferences are not available.' }
  }
  const clean = String(token || '').trim()
  if (!clean) return { ok: false, message: 'Invalid unsubscribe token.' }

  const { data, error } = await supabase
    .from('email_preferences')
    .update({
      marketing_allowed: false,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', clean)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, message: error.message }
  if (!data) return { ok: false, message: 'Unsubscribe token not found.' }
  return { ok: true, message: 'You have been unsubscribed from JobAZ marketing emails.' }
}
