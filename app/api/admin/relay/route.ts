import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  getRelayAdminSupabase,
  isValidStatus,
  mapMessage,
  mapThread,
  tableExists,
} from '@/lib/relay'

export const dynamic = 'force-dynamic'

/** GET — list all threads or one with messages */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getRelayAdminSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      threads: [],
      note: 'Supabase service role not configured',
    })
  }
  if (!(await tableExists(supabase, 'relay_threads'))) {
    return NextResponse.json({
      ok: true,
      threads: [],
      note: 'relay_threads: Not tracked yet — run migration',
    })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const status = url.searchParams.get('status') || 'all'
  const type = url.searchParams.get('type') || 'all'

  if (id) {
    const { data: thread } = await supabase
      .from('relay_threads')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: messages } = await supabase
      .from('relay_messages')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true })

    let userEmail: string | null = null
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(String(thread.user_id))
      userEmail = userData.user?.email ?? null
    } catch {
      userEmail = null
    }

    return NextResponse.json({
      ok: true,
      thread: mapThread({ ...(thread as Record<string, unknown>), user_email: userEmail }),
      messages: (messages ?? []).map((m) => mapMessage(m as Record<string, unknown>)),
    })
  }

  let query = supabase
    .from('relay_threads')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (status !== 'all') query = query.eq('status', status)
  if (type !== 'all') query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    threads: (data ?? []).map((t) => mapThread(t as Record<string, unknown>)),
  })
}

/** POST — reply as JobAZ Team, set status, archive */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getRelayAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 503 })
  }
  if (!(await tableExists(supabase, 'relay_threads'))) {
    return NextResponse.json({ error: 'relay_threads missing' }, { status: 503 })
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action || '')
  const threadId = String(body.thread_id || body.id || '')

  if (!threadId) return NextResponse.json({ error: 'thread_id required' }, { status: 400 })

  if (action === 'reply') {
    const text = String(body.message || body.body || '').trim()
    if (text.length < 1) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const now = new Date().toISOString()
    const { data: msg, error } = await supabase
      .from('relay_messages')
      .insert({
        thread_id: threadId,
        sender_role: 'admin',
        sender_user_id: auth.user.id,
        body: text.slice(0, 4000),
        created_at: now,
      })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase
      .from('relay_threads')
      .update({ updated_at: now, body_preview: text.slice(0, 180) })
      .eq('id', threadId)

    return NextResponse.json({ ok: true, message: mapMessage(msg as Record<string, unknown>) })
  }

  if (action === 'set_status') {
    const status = String(body.status || '')
    if (!isValidStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('relay_threads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .select('*')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      thread: data ? mapThread(data as Record<string, unknown>) : null,
    })
  }

  if (action === 'archive') {
    const { error } = await supabase
      .from('relay_threads')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', threadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, archived: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
