import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { createAdminTask } from '@/lib/admin/ai/tasks'
import { normalizePriority } from '@/lib/admin/ai/reportUtils'
import type { AdminAiPriority } from '@/lib/admin/ai/types'

export const dynamic = 'force-dynamic'

/**
 * Create an admin task from an AI Manager recommended action.
 * POST /api/admin/tasks/create
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      title?: string
      description?: string
      source?: string
      priority?: string | AdminAiPriority
      related_report_id?: string
      relatedReportId?: string
      related_route?: string
      relatedRoute?: string
      related_provider?: string
      relatedProvider?: string
      related_course?: string
      relatedCourse?: string
    }

    const result = await createAdminTask({
      title: String(body.title || ''),
      description: String(body.description || ''),
      source: body.source || 'ai_manager_report',
      priority: normalizePriority(body.priority),
      relatedReportId: body.related_report_id || body.relatedReportId || null,
      relatedRoute: body.related_route || body.relatedRoute || null,
      relatedProvider: body.related_provider || body.relatedProvider || null,
      relatedCourse: body.related_course || body.relatedCourse || null,
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
        : 'Task saved. View Admin Tasks',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}
