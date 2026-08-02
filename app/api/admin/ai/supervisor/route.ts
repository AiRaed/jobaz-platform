import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { parseAdminAiDateRange } from '@/lib/admin/ai/dateRange'
import { generateSupervisorReport } from '@/lib/admin/ai/supervisorReport'

export const dynamic = 'force-dynamic'

const ALLOWED_MODES = [
  'review',
  'weak',
  'missing_courses',
  'risky',
  'route_mismatch',
  'stale_plan',
] as const

/**
 * Generate AI Supervisor report.
 * POST /api/admin/ai/supervisor
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: string
      range?: string
    }

    const mode = body.mode || 'review'
    if (!ALLOWED_MODES.includes(mode as (typeof ALLOWED_MODES)[number])) {
      return NextResponse.json({ ok: false, error: 'Invalid mode' }, { status: 400 })
    }

    const result = await generateSupervisorReport({
      mode,
      range: parseAdminAiDateRange(body.range),
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
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Failed to generate supervisor report',
      },
      { status: 500 }
    )
  }
}
