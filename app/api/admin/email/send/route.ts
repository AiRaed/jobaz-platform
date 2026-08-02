import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { sendJobazEmail, type EmailTemplateKey } from '@/lib/email'

export const dynamic = 'force-dynamic'

const ALLOWED: EmailTemplateKey[] = [
  'welcome',
  'continue_plan',
  'continue_cv',
  'recommended_course',
  'admin_custom',
]

/**
 * POST /api/admin/email/send
 * Manual admin send for JobAZ application emails (Resend).
 * Does not send Supabase Auth emails.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const templateKey = String(body.templateKey || '') as EmailTemplateKey
    const to = String(body.to || '').trim()

    if (!ALLOWED.includes(templateKey)) {
      return NextResponse.json({ ok: false, error: 'Invalid templateKey' }, { status: 400 })
    }
    if (!to) {
      return NextResponse.json({ ok: false, error: 'Recipient email required' }, { status: 400 })
    }

    const result = await sendJobazEmail({
      to,
      templateKey,
      userId: body.userId ? String(body.userId) : null,
      subject: body.subject ? String(body.subject) : undefined,
      customMessage: body.customMessage ? String(body.customMessage) : undefined,
      context: {
        userName: body.userName ? String(body.userName) : null,
        route: body.route ? String(body.route) : null,
        targetRole: body.targetRole ? String(body.targetRole) : null,
        nextUpgrade: body.nextUpgrade ? String(body.nextUpgrade) : null,
        courseTitle: body.courseTitle ? String(body.courseTitle) : null,
        providerName: body.providerName ? String(body.providerName) : null,
      },
      createInAppNotification: true,
    })

    return NextResponse.json({
      ok: result.ok,
      configured: result.configured,
      status: result.status,
      message: result.message,
      providerMessageId: result.providerMessageId || null,
      logId: result.logId || null,
      preview: result.preview || null,
    }, { status: result.ok ? 200 : result.status === 'not_configured' ? 503 : 400 })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Send failed' },
      { status: 500 }
    )
  }
}
