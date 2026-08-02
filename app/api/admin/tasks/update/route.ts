import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  updateAdminTaskStatus,
  type AdminTaskStatus,
} from '@/lib/admin/ai/tasks'

export const dynamic = 'force-dynamic'

/**
 * Update an admin task status.
 * POST /api/admin/tasks/update
 * Body: { id, status: open | in_progress | done | ignored }
 */
export async function POST(req: NextRequest) {
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
