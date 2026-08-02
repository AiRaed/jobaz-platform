/**
 * POST /api/analytics/jaz-track
 * Client Learning Loop events. Always returns 200 — never blocks UX.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { trackJazEventServer } from '@/lib/analytics/jazTrackEvent'
import type { JazTrackEventInput } from '@/lib/analytics/jazTrackTypes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as JazTrackEventInput | null
    if (!body?.event_type || typeof body.event_type !== 'string') {
      return NextResponse.json({ ok: true })
    }

    let userId: string | null = body.user_id ?? null
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && anon) {
        const cookieStore = await cookies()
        const supabase = createServerClient(url, anon, {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll() {},
          },
        })
        const { data } = await supabase.auth.getUser()
        if (data.user?.id) userId = data.user.id
      }
    } catch {
      // ignore auth probe
    }

    await trackJazEventServer({
      ...body,
      user_id: userId,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
