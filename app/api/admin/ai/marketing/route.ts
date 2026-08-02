import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { generateMarketingCopy } from '@/lib/admin/ai/marketingReport'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'Facebook Ad',
  'TikTok Script',
  'Email Campaign',
  'Landing Page Copy',
  '5 Post Ideas',
] as const

/**
 * Generate Marketing AI copy.
 * POST /api/admin/ai/marketing
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      route?: string
      audience?: string
      channel?: string
      contentType?: string
      format?: string
    }

    const contentType = body.contentType || body.format || ''
    if (!ALLOWED_TYPES.includes(contentType as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { ok: false, error: 'Invalid contentType' },
        { status: 400 }
      )
    }

    const result = await generateMarketingCopy({
      route: String(body.route || 'Extra Income'),
      audience: String(body.audience || 'general UK users'),
      channel: String(body.channel || 'Facebook'),
      contentType,
      createdBy: auth.user.id,
    })

    if (!result.configured) {
      return NextResponse.json({
        ok: false,
        configured: false,
        error: 'AI provider is not configured yet.',
      })
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, configured: true, error: result.error || 'Generation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      title: result.title,
      markdown: result.markdown,
      priority: result.priority,
      reportId: result.reportId,
      persistError: result.persistError,
      createdAt: result.createdAt,
      saved: Boolean(result.reportId),
      siteBrain: result.siteBrain || null,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to generate marketing copy' },
      { status: 500 }
    )
  }
}
