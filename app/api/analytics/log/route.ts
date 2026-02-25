import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logEventServer } from '@/lib/analytics/logEvent'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/analytics/log
 * Client-side analytics: body { event_name: string, metadata?: object }.
 * Resolves with 200 even if logging fails (no UI impact).
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
            // ignore in route handler
          }
        },
      },
    })

    let body: { event_name?: string; metadata?: object }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: true })
    }
    const event_name = body?.event_name
    if (!event_name || typeof event_name !== 'string') {
      return NextResponse.json({ ok: true })
    }

    await logEventServer(supabase, event_name, body?.metadata ?? {})
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
