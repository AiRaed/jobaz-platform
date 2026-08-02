import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { parseAdminAiDateRange } from '@/lib/admin/ai/dateRange'
import {
  generateManagerReport,
  getLatestManagerReport,
} from '@/lib/admin/ai/managerReport'

export const dynamic = 'force-dynamic'

/** Load latest saved AI Manager Report */
export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const result = await getLatestManagerReport()
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true, report: result.report })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load report' },
      { status: 500 }
    )
  }
}

/** Generate + save AI Manager Report */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as { range?: string }
    const range = parseAdminAiDateRange(body.range)

    const result = await generateManagerReport({
      range,
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
      { ok: false, error: e instanceof Error ? e.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}
