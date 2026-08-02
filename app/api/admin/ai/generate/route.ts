import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  generateAdminAiReport,
  persistAdminAiReport,
} from '@/lib/admin/ai/generate'
import type { AdminAiReportType } from '@/lib/admin/ai/types'

export const dynamic = 'force-dynamic'

const ALLOWED: AdminAiReportType[] = [
  'manager',
  'marketing',
  'supervisor',
  'affiliate',
  'technical',
  'site_brain_test',
]

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      reportType?: string
      prompt?: string
      input?: Record<string, unknown>
      persist?: boolean
    }

    const reportType = body.reportType as AdminAiReportType
    if (!ALLOWED.includes(reportType)) {
      return NextResponse.json({ ok: false, error: 'Invalid reportType' }, { status: 400 })
    }

    const result = await generateAdminAiReport({
      reportType,
      prompt: body.prompt,
      input: body.input,
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

    let reportId: string | undefined
    let persistError: string | undefined
    if (body.persist !== false) {
      const saved = await persistAdminAiReport({
        reportType,
        title: result.title,
        input: {
          ...(body.input || {}),
          prompt: body.prompt || null,
          contextUsed: result.contextUsed || null,
        },
        markdown: result.markdown,
        priority: result.priority,
        createdBy: auth.user.id,
      })
      reportId = saved.id
      persistError = saved.error
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      title: result.title,
      markdown: result.markdown,
      priority: result.priority,
      reportId,
      persistError,
      contextUsed: result.contextUsed,
      siteBrain: result.siteBrain || null,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to generate report' },
      { status: 500 }
    )
  }
}
