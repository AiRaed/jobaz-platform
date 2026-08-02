/**
 * Resend client — server-only. Never import from client components.
 */

import { Resend } from 'resend'

export type EmailConfigStatus = {
  configured: boolean
  provider: string
  from: string | null
  replyTo: string | null
  message: string
}

export function getEmailConfigStatus(): EmailConfigStatus {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase()
  const apiKey = process.env.RESEND_API_KEY?.trim() || ''
  const from = process.env.EMAIL_FROM?.trim() || null
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || null

  if (!apiKey) {
    return {
      configured: false,
      provider,
      from,
      replyTo,
      message: 'Email sending is not configured yet.',
    }
  }

  if (!from) {
    return {
      configured: false,
      provider,
      from,
      replyTo,
      message: 'Email sending is not configured yet. Set EMAIL_FROM.',
    }
  }

  return {
    configured: true,
    provider,
    from,
    replyTo,
    message: 'Resend is configured.',
  }
}

let resendSingleton: Resend | null = null

/** Returns Resend client or null when not configured. */
export function getResendClient(): Resend | null {
  const status = getEmailConfigStatus()
  if (!status.configured) return null
  const apiKey = process.env.RESEND_API_KEY!.trim()
  if (!resendSingleton) {
    resendSingleton = new Resend(apiKey)
  }
  return resendSingleton
}
