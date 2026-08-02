import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createRelayThread,
  getRelayAdminSupabase,
  mapMessage,
  mapThread,
  tableExists,
  validateCreateRelay,
} from '@/lib/relay'

export const dynamic = 'force-dynamic'

function getUserClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore
          }
        },
      },
    }
  )
}

/** GET — list threads or one thread + messages */
export async function GET(req: NextRequest) {
  const userClient = getUserClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const admin = getRelayAdminSupabase()
  if (!admin) {
    return NextResponse.json({
      ok: true,
      threads: [],
      messages: [],
      note: 'Relay storage not configured',
    })
  }
  if (!(await tableExists(admin, 'relay_threads'))) {
    return NextResponse.json({
      ok: true,
      threads: [],
      messages: [],
      note: 'relay_threads: Not tracked yet — run migration',
    })
  }

  const url = new URL(req.url)
  const threadId = url.searchParams.get('id')

  if (threadId) {
    const { data: thread } = await admin
      .from('relay_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const { data: messages } = await admin
      .from('relay_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      ok: true,
      thread: mapThread(thread as Record<string, unknown>),
      messages: (messages ?? []).map((m) => mapMessage(m as Record<string, unknown>)),
    })
  }

  const { data: threads } = await admin
    .from('relay_threads')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    ok: true,
    threads: (threads ?? []).map((t) => mapThread(t as Record<string, unknown>)),
  })
}

/** POST — create thread or reply */
export async function POST(req: NextRequest) {
  const userClient = getUserClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const admin = getRelayAdminSupabase()
  if (!admin) {
    return NextResponse.json({ error: 'Relay storage not configured' }, { status: 503 })
  }
  if (!(await tableExists(admin, 'relay_threads'))) {
    return NextResponse.json(
      { error: 'relay_threads missing — run migration 20250728210000_relay_phase1_inbox.sql' },
      { status: 503 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action || 'create')

  if (action === 'create') {
    const validated = validateCreateRelay(body)
    if (validated.error || !validated.data) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    try {
      const result = await createRelayThread(admin, user.id, validated.data)
      return NextResponse.json({ ok: true, ...result })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not create request' },
        { status: 500 }
      )
    }
  }

  if (action === 'reply') {
    const threadId = String(body.thread_id || '')
    const text = String(body.message || body.body || '').trim()
    if (!threadId || text.length < 1) {
      return NextResponse.json({ error: 'thread_id and message required' }, { status: 400 })
    }
    const { data: thread } = await admin
      .from('relay_threads')
      .select('id, status')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    if (String((thread as { status?: string }).status) === 'closed') {
      return NextResponse.json({ error: 'This thread is closed.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data: msg, error } = await admin
      .from('relay_messages')
      .insert({
        thread_id: threadId,
        sender_role: 'user',
        sender_user_id: user.id,
        body: text.slice(0, 4000),
        created_at: now,
      })
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin
      .from('relay_threads')
      .update({
        updated_at: now,
        body_preview: text.slice(0, 180),
        status: 'open',
      })
      .eq('id', threadId)

    return NextResponse.json({ ok: true, message: mapMessage(msg as Record<string, unknown>) })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
