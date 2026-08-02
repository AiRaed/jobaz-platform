import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { EMAIL_TEMPLATE_OPTIONS, getEmailConfigStatus } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/email/status
 * Admin-only — whether Resend is configured (never returns the API key).
 */
export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const status = getEmailConfigStatus()
  return NextResponse.json({
    ok: true,
    configured: status.configured,
    provider: status.provider,
    from: status.from,
    replyTo: status.replyTo,
    message: status.message,
    templates: EMAIL_TEMPLATE_OPTIONS,
  })
}
