import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { createAdminTask } from '@/lib/admin/ai/tasks'
import { normalizePriority } from '@/lib/admin/ai/reportUtils'
import type { AdminAiPriority } from '@/lib/admin/ai/types'

export const dynamic = 'force-dynamic'

/** Legacy alias — prefer POST /api/admin/tasks/create */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string
      description?: string
      priority?: AdminAiPriority | string
      relatedRoute?: string
      relatedProvider?: string
      relatedCourse?: string
      relatedReportId?: string
      related_report_id?: string
      source?: string
    }

    const result = await createAdminTask({
      title: String(body.title || ''),
      description: String(body.description || ''),
      priority: normalizePriority(body.priority),
      relatedRoute: body.relatedRoute,
      relatedProvider: body.relatedProvider,
      relatedCourse: body.relatedCourse,
      relatedReportId: body.relatedReportId || body.related_report_id || null,
      source: body.source || 'ai_manager_report',
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      task: result.task,
      alreadyExists: Boolean(result.alreadyExists),
      message: result.alreadyExists
        ? 'Task already saved for this report action'
        : 'Task saved. Admin task board will be added later.',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}
