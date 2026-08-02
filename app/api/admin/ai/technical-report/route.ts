import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { generateTechnicalReport } from '@/lib/admin/ai/technicalReport'

export const dynamic = 'force-dynamic'

const ALLOWED_MODES = [
  'full',
  'referral',
  'course_quality',
  'ai_errors',
  'tracking',
  'ai',
  'cv',
  'jobs',
  'interview',
] as const

/**
 * Generate JobAZ Technical Health Report.
 * POST /api/admin/ai/technical-report
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: string }
    const mode = body.mode || 'full'
    if (!ALLOWED_MODES.includes(mode as (typeof ALLOWED_MODES)[number])) {
      return NextResponse.json({ ok: false, error: 'Invalid mode' }, { status: 400 })
    }

    const result = await generateTechnicalReport({
      mode,
      createdBy: auth.user.id,
    })

    if (!result.configured) {
      return NextResponse.json({
        ok: false,
        configured: false,
        error: 'AI provider is not configured yet.',
        health: result.health || null,
      })
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          error: result.error || 'Generation failed',
          health: result.health || null,
        },
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
      health: result.health || null,
      siteBrain: result.siteBrain || null,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Failed to generate technical report',
      },
      { status: 500 }
    )
  }
}
