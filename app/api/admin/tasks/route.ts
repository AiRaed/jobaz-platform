import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  listAdminTasks,
  updateAdminTaskStatus,
  type AdminTaskStatus,
} from '@/lib/admin/ai/tasks'

export const dynamic = 'force-dynamic'

/** List admin tasks (+ summary). Also supports ?related_report_id= for Save-as-task restore. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const reportId =
    req.nextUrl.searchParams.get('related_report_id') ||
    req.nextUrl.searchParams.get('reportId')

  if (reportId) {
    const { listTasksForReport } = await import('@/lib/admin/ai/tasks')
    const result = await listTasksForReport(reportId)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true, tasks: result.tasks })
  }

  const status = req.nextUrl.searchParams.get('status') || undefined
  const priority = req.nextUrl.searchParams.get('priority') || undefined
  const source = req.nextUrl.searchParams.get('source') || undefined
  const search = req.nextUrl.searchParams.get('search') || undefined

  const result = await listAdminTasks({ status, priority, source, search })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    tasks: result.tasks,
    summary: result.summary,
  })
}

/** Update task status: open | in_progress | done | ignored */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string
      status?: string
    }
    const id = String(body.id || '').trim()
    const status = String(body.status || '').trim() as AdminTaskStatus
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Task id required' }, { status: 400 })
    }
    if (!['open', 'in_progress', 'done', 'ignored'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })
    }

    const result = await updateAdminTaskStatus(id, status)
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true, task: result.task })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}
