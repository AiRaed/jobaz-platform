import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { previewEmail, type EmailTemplateKey } from '@/lib/email'

export const dynamic = 'force-dynamic'

const ALLOWED: EmailTemplateKey[] = [
  'welcome',
  'continue_plan',
  'continue_cv',
  'recommended_course',
  'admin_custom',
]

/**
 * POST /api/admin/email/preview
 * Build preview HTML/text without sending.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const templateKey = String(body.templateKey || '') as EmailTemplateKey
    if (!ALLOWED.includes(templateKey)) {
      return NextResponse.json({ ok: false, error: 'Invalid templateKey' }, { status: 400 })
    }

    const preview = previewEmail({
      templateKey,
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
    })

    return NextResponse.json({ ok: true, preview })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Preview failed' },
      { status: 500 }
    )
  }
}
