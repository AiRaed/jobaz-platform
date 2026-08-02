import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { generateSiteBrainAdvisor } from '@/lib/admin/ai/siteBrainAdvisor'

export const dynamic = 'force-dynamic'

const ALLOWED_MODES = [
  'ask',
  'launch_priorities',
  'business_risks',
  'dev_tasks',
  'user_scenario',
] as const

/**
 * Site Brain strategic advisor.
 * POST /api/admin/ai/site-brain-advisor
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: string
      question?: string
      scenario?: string
    }

    const mode = body.mode || 'ask'
    if (!ALLOWED_MODES.includes(mode as (typeof ALLOWED_MODES)[number])) {
      return NextResponse.json({ ok: false, error: 'Invalid mode' }, { status: 400 })
    }

    const result = await generateSiteBrainAdvisor({
      mode,
      question: body.question,
      scenario: body.scenario,
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
      mode: result.mode,
      saved: Boolean(result.reportId),
      siteBrain: result.siteBrain || null,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Failed to run Site Brain advisor',
      },
      { status: 500 }
    )
  }
}
